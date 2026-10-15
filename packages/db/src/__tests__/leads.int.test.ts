import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createDb, createLead, createPlatformDb, forTenant } from "../index.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL && process.env.TEST_OWNER_DATABASE_URL)
  && "DATABASE_URL/PLATFORM_DATABASE_URL/TEST_OWNER_DATABASE_URL missing: requires migrated PostgreSQL 16";

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
