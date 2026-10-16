import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb, forPlatform, forTenant } from "../index.ts";
import pg from "pg";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "DATABASE_URL/PLATFORM_DATABASE_URL missing: requires migrated PostgreSQL 16 with plans synced";

test("Postgres plan changes: actor/before/after audit, no-op, atomic rollback and concurrent updates", { skip }, async t => {
  const platform = createPlatformDb({ pool: 3 }), db = createDb({ pool: 1 });
  const tenantId = randomUUID(), actorId = randomUUID();
  const tenants = forPlatform(platform).tenants, repo = forTenant(db, tenantId);
  await platform.tenant.create({ data: { id: tenantId, slug: `plan-${tenantId}`, name: "[DỮ LIỆU MẪU] Gói", planId: "pro", status: "active" } });
  try {
    const changes = {
      planId: "basic" as const, addons: ["shorts" as const],
      featureOverrides: { calculator: { on: true, reason: "Test" } },
      limitOverrides: { users: { add: 2, reason: "Test" } }, permissionPolicy: { editor: { publish: false } },
    };
    const result = await tenants.changePlan({ actorId, tenantId, changes, reason: "Hạ gói" });
    assert.equal(result.changed, true);
    const row = await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    for (const key of Object.keys(changes) as (keyof typeof changes)[]) assert.deepEqual(row[key], changes[key]);
    const audit = await repo.auditLog.first({ where: { action: "tenant.plan.change" } }); assert.ok(audit);
    assert.equal(audit.actorType, "platform_admin"); assert.equal(audit.actorId, actorId);
    assert.deepEqual(audit.data, { before: { planId: "pro", addons: [], featureOverrides: {}, limitOverrides: {}, permissionPolicy: {} }, after: changes, reason: "Hạ gói" });
    const jobs = await repo.outbox.list(); assert.equal(jobs.length, 2);
    assert.deepEqual(jobs.find(j => j.topic === "invalidate")?.payload, { tags: [`tenant:${tenantId}`] });
    const notification = jobs.find(j => j.topic === "notify.plan-changed");
    assert.deepEqual(notification?.payload, { tenantId, from: "pro", to: "basic" });
    assert.equal(notification?.idempotencyKey, `notify.plan-changed:${audit.id}`);
    assert.deepEqual(await tenants.changePlan({ actorId, tenantId, changes }), { changed: false });
    assert.deepEqual(await tenants.changePlan({ actorId, tenantId, changes: {} }), { changed: false });
    assert.equal(await repo.auditLog.count(), 1); assert.equal(await repo.outbox.count(), 2);
    // Runtime credentials cannot acquire the platform mutation surface (including by casting).
    assert.deepEqual(Object.keys(forPlatform(db).tenants), ["bySlug"]);

    // A real database failure on the outbox insert rolls back the tenant update and the audit row.
    if (process.env.TEST_OWNER_DATABASE_URL) {
      const owner = new pg.Pool({ connectionString: process.env.TEST_OWNER_DATABASE_URL, max: 1 });
      const fn = `test_fail_outbox_${tenantId.replaceAll("-", "")}`;
      await owner.query(`CREATE FUNCTION public.${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected outbox failure'; END $$`);
      await owner.query(`CREATE TRIGGER ${fn} BEFORE INSERT ON public."Outbox" FOR EACH ROW WHEN (NEW."tenantId" = '${tenantId}'::uuid) EXECUTE FUNCTION public.${fn}()`);
      try {
        await assert.rejects(tenants.changePlan({ actorId, tenantId, changes: { planId: "premium" } }), /injected outbox failure/);
      } finally {
        await owner.query(`DROP TRIGGER ${fn} ON public."Outbox"`);
        await owner.query(`DROP FUNCTION public.${fn}()`);
        await owner.end();
      }
    } else t.diagnostic("TEST_OWNER_DATABASE_URL missing: rollback injection skipped");
    assert.deepEqual(await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } }), row);
    assert.equal(await repo.auditLog.count(), 1); assert.equal(await repo.outbox.count(), 2);

    // Identical concurrent writes serialize: only one new audit and invalidation, no plan notification.
    const results = await Promise.all([1, 2].map(() => tenants.changePlan({ actorId, tenantId, changes: { addons: ["catalog", "shorts"] } })));
    assert.equal(results.filter(r => r.changed).length, 1);
    assert.equal(await repo.auditLog.count(), 2); assert.equal(await repo.outbox.count(), 3);
    const invalid = { ...changes, planId: "unknown" };
    await assert.rejects(tenants.changePlan({ actorId, tenantId, changes: invalid as typeof changes }));
    assert.equal(await repo.auditLog.count(), 2);
  } finally {
    await platform.tenant.delete({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), platform.$disconnect()]);
  }
});

test("Postgres override expiry: fake clock, both override types, repeat/concurrent scans dedupe without deleting data", { skip }, async () => {
  const platform = createPlatformDb({ pool: 3 });
  const tenantId = randomUUID(), until = "2040-01-01T12:00:00.000Z";
  const overrides = { calculator: { on: true, reason: "Test", until } };
  await platform.tenant.create({ data: { id: tenantId, slug: `expiry-${tenantId}`, name: "[DỮ LIỆU MẪU] Override", planId: "basic", featureOverrides: overrides,
    limitOverrides: { users: { add: 1, reason: "Test", until }, pages: { add: 1, reason: "Test", until: "2040-01-01T11:00:00.000Z" } },
  } });
  try {
    const tenants = forPlatform(platform).tenants, repo = forTenant(platform, tenantId);
    await tenants.scanExpiredOverrides({ now: new Date("2040-01-01T10:59:59Z") });
    assert.equal(await repo.outbox.count(), 0);
    await Promise.all([1, 2].map(() => tenants.scanExpiredOverrides({ now: new Date(until) })));
    const jobs = await repo.outbox.list(); assert.equal(jobs.length, 2);
    assert.deepEqual(jobs.map(j => j.idempotencyKey).sort(), ["2040-01-01T11:00:00.000Z", until].map(date => `override-expired:${tenantId}:${date}`));
    for (const job of jobs) assert.deepEqual(job.payload, { tags: [`tenant:${tenantId}`] });
    await tenants.scanExpiredOverrides({ now: new Date("2040-01-01T12:05:00Z") });
    assert.equal(await repo.outbox.count(), 2);
    assert.equal(await repo.auditLog.count({ where: { actorType: "system", action: "tenant.override.expired" } }), 1);
    assert.deepEqual((await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } })).featureOverrides, overrides);
  } finally {
    await platform.tenant.delete({ where: { id: tenantId } }); await platform.$disconnect();
  }
});
