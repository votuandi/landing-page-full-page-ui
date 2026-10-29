import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createDb, createLead, createPlatformDb, forPlatform, forTenant } from "../index.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL && process.env.TEST_OWNER_DATABASE_URL)
  && "DATABASE_URL/PLATFORM_DATABASE_URL/TEST_OWNER_DATABASE_URL missing: requires migrated PostgreSQL 16";

test("Postgres createLead: bỏ kênh ngoài gói dù còn enabled", { skip }, async () => {
  const db = createDb({ pool: 1 }), platform = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await platform.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "basic", status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    for (const kind of ["telegram", "webhook", "google_sheets"] as const) await repo.leadIntegration.create({ kind, name: kind, configEncrypted: "test" });
    const result = await createLead(db, tenantId, site.id, { source: "contact", phone: "0901234567", data: {} }, { kinds: ["email", "telegram"] });
    assert.equal(result.jobs, 1);
    const jobs = await repo.outbox.list();
    assert.equal((jobs[0].payload as { kind: string }).kind, "telegram");
  } finally {
    await platform.lead.deleteMany({ where: { tenantId } }); await platform.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), platform.$disconnect()]);
  }
});

test("Postgres createLead: a failing outbox insert rolls back the lead (E11-S01, D14)", { skip }, async () => {
  const db = createDb({ pool: 1 }), platform = createPlatformDb({ pool: 1 });
  const owner = new pg.Pool({ connectionString: process.env.TEST_OWNER_DATABASE_URL, max: 1 });
  const tenantId = randomUUID(), siteId = randomUUID(), fn = `test_fail_lead_outbox_${tenantId.replaceAll("-", "")}`;
  await platform.tenant.create({ data: { id: tenantId, slug: `lead-${tenantId}`, name: "[DỮ LIỆU MẪU] Lead", planId: "pro", status: "active" } });
  try {
    await platform.site.create({ data: { id: siteId, tenantId, name: "Lead", themeId: "t15" } });
    await platform.leadIntegration.create({ data: { tenantId, kind: "webhook", name: "hook", configEncrypted: "test" } });
    // Real database error on the second write of the transaction.
    await owner.query(`CREATE FUNCTION public.${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected outbox failure'; END $$`);
    await owner.query(`CREATE TRIGGER ${fn} BEFORE INSERT ON public."Outbox" FOR EACH ROW WHEN (NEW."tenantId" = '${tenantId}'::uuid) EXECUTE FUNCTION public.${fn}()`);
    try {
      await assert.rejects(createLead(db, tenantId, siteId, { source: "contact", name: "A", phone: "0901234570", data: {} }), /injected outbox failure/);
    } finally {
      await owner.query(`DROP TRIGGER ${fn} ON public."Outbox"`);
      await owner.query(`DROP FUNCTION public.${fn}()`);
    }
    assert.equal(await forTenant(db, tenantId).lead.count(), 0);
    assert.equal(await forTenant(db, tenantId).outbox.count(), 0);
    const { id, jobs } = await createLead(db, tenantId, siteId, { source: "contact", name: "A", phone: "0901234570", data: {} });
    assert.equal(jobs, 1);
    assert.ok(await forTenant(db, tenantId).lead.get(id));
  } finally {
    await platform.lead.deleteMany({ where: { tenantId } });
    await platform.tenant.delete({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), platform.$disconnect(), owner.end()]);
  }
});

test("Postgres: a failing second channel job rolls back the lead and the first job; audit failures roll back dead/resend", { skip }, async () => {
  const db = createDb({ pool: 1 }), platform = createPlatformDb({ pool: 2 });
  const owner = new pg.Pool({ connectionString: process.env.TEST_OWNER_DATABASE_URL, max: 1 });
  const tenantId = randomUUID(), siteId = randomUUID(), fn = `test_fail_${tenantId.replaceAll("-", "")}`;
  const outbox = forPlatform(platform).outbox;
  const trigger = async (table: string, when: string, run: () => Promise<unknown>) => {
    await owner.query(`CREATE FUNCTION public.${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected failure'; END $$`);
    await owner.query(`CREATE TRIGGER ${fn} BEFORE INSERT ON public."${table}" FOR EACH ROW WHEN (NEW."tenantId" = '${tenantId}'::uuid AND ${when}) EXECUTE FUNCTION public.${fn}()`);
    try { await assert.rejects(run(), /injected failure/); } finally {
      await owner.query(`DROP TRIGGER ${fn} ON public."${table}"`);
      await owner.query(`DROP FUNCTION public.${fn}()`);
    }
  };
  await platform.tenant.create({ data: { id: tenantId, slug: `lead2-${tenantId}`, name: "[DỮ LIỆU MẪU] Lead", planId: "pro", status: "active" } });
  try {
    await platform.site.create({ data: { id: siteId, tenantId, name: "Lead", themeId: "t15" } });
    for (const kind of ["webhook", "telegram"] as const) await platform.leadIntegration.create({ data: { tenantId, kind, name: kind, configEncrypted: "test" } });
    // The webhook job is written first (ids ascend), the telegram job then fails.
    await trigger("Outbox", `NEW.payload->>'kind' = 'telegram'`, () => createLead(db, tenantId, siteId, { source: "contact", name: "A", phone: "0901234571", data: {} }));
    assert.equal(await forTenant(db, tenantId).lead.count(), 0);
    assert.equal(await forTenant(db, tenantId).outbox.count(), 0);

    // AuditLog insert fails → the dead transition is rolled back, the job stays claimable after its lease.
    await createLead(db, tenantId, siteId, { source: "contact", name: "A", phone: "0901234571", data: {} });
    const now = new Date();
    const [job] = await outbox.claim({ tenantId, limit: 1, now });
    await trigger("AuditLog", `NEW.action = 'outbox.dead'`, () => outbox.fail(job, new Error("permanent"), { now, dead: true }));
    assert.equal((await forTenant(db, tenantId).outbox.get(job.id))?.status, "processing");
    assert.equal(await outbox.fail(job, new Error("permanent"), { now, dead: true }), "dead");
    await trigger("AuditLog", `NEW.action = 'outbox.resend'`, () => outbox.resend({ tenantId, id: job.id }));
    assert.equal((await forTenant(db, tenantId).outbox.get(job.id))?.status, "failed");
    assert.equal(await outbox.resend({ tenantId, id: job.id }), true);
  } finally {
    await platform.lead.deleteMany({ where: { tenantId } });
    await platform.tenant.delete({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), platform.$disconnect(), owner.end()]);
  }
});
