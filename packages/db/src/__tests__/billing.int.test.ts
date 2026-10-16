import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import pg from "pg";
import { createDb, createPlatformDb, forPlatform, forTenant } from "../index.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL)
  && "DATABASE_URL/PLATFORM_DATABASE_URL missing: requires migrated PostgreSQL 16 with plans synced";
const DAY = 86_400_000, expiresAt = new Date("2040-02-01T12:00:00.000Z");
const at = (days: number) => new Date(expiresAt.getTime() + days * DAY);

test("Postgres billing: fake clock 14/7/1, grace boundary, concurrent dedupe, atomic suspension and renewal with host invalidation", { skip }, async t => {
  t.mock.timers.enable({ apis: ["Date"], now: at(-15) });
  const platform = createPlatformDb({ pool: 3 }), db = createDb({ pool: 1 });
  const tenantId = randomUUID(), actorId = randomUUID();
  const ops = forPlatform(platform), repo = forTenant(db, tenantId);
  const hosts = [`${tenantId}.localhost`, `www.${tenantId}.localhost`];
  try {
    await platform.tenant.create({ data: { id: tenantId, slug: `billing-${tenantId}`, name: "[DỮ LIỆU MẪU] Gia hạn",
      planId: "pro", status: "active", planExpiresAt: expiresAt } });
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU] Gia hạn", themeId: "t15" });
    for (const [i, hostname] of hosts.entries()) await repo.domain.create({ hostname, siteId: site.id,
      verificationToken: randomUUID(), status: i ? "pending" : "active", isPrimary: i === 0 });
    await ops.billing.run({ now: new Date() });
    assert.equal(await repo.outbox.count(), 0);
    for (const days of [14, 7, 1]) {
      t.mock.timers.setTime(at(-days).getTime());
      const before = await repo.outbox.count();
      await Promise.all([1, 2].map(() => ops.billing.run({ now: new Date() })));
      await ops.billing.run({ now: new Date() });
      assert.equal(await repo.outbox.count(), before + 1);
      const job = await repo.outbox.first({ where: { idempotencyKey: `renewal:${tenantId}:${expiresAt.toISOString()}:${days}` } });
      assert.deepEqual(job?.payload, { tenantId, days, expiresAt: expiresAt.toISOString() });
      assert.equal(job?.topic, "notify.renewal");
    }
    assert.equal(await repo.auditLog.count({ where: { actorType: "system", action: "tenant.renewal.reminded" } }), 3);
    for (const days of [0, 6, 7 - 1 / DAY]) {
      t.mock.timers.setTime(at(days).getTime());
      await ops.billing.run({ now: new Date() });
      assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status, "active");
      assert.equal(await repo.outbox.count(), 3);
    }
    t.mock.timers.setTime(at(7).getTime());
    await Promise.all([1, 2].map(() => ops.billing.run({ now: new Date() })));
    await ops.billing.run({ now: new Date() });
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status, "suspended");
    const audits = await repo.auditLog.list({ where: { action: "tenant.suspend.expired" } });
    assert.equal(audits.length, 1);
    assert.equal(audits[0].actorType, "system"); assert.equal(audits[0].actorId, null);
    assert.deepEqual(audits[0].data, { planExpiresAt: expiresAt.toISOString() });
    const jobs = await repo.outbox.list(); assert.equal(jobs.length, 5);
    const invalidation = jobs.find(job => job.topic === "invalidate")!;
    const payload = invalidation.payload as { tags: string[]; hosts: string[] };
    assert.deepEqual(payload.tags, [`tenant:${tenantId}`]); assert.deepEqual(payload.hosts.sort(), hosts.sort());
    const suspended = jobs.find(job => job.topic === "notify.suspended");
    assert.equal(suspended?.idempotencyKey, `suspended:${tenantId}:${expiresAt.toISOString()}`);
    assert.deepEqual(suspended?.payload, { tenantId, expiresAt: expiresAt.toISOString() });
    assert.equal((await ops.domains.resolve(hosts[0]))?.tenantStatus, "suspended");

    const renewedAt = at(40);
    const result = await ops.tenants.changePlan({ actorId, tenantId, changes: { planExpiresAt: renewedAt } });
    assert.equal(result.changed, true);
    const renewed = await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    assert.equal(renewed.status, "active"); assert.deepEqual(renewed.planExpiresAt, renewedAt);
    const renewalAudit = await repo.auditLog.first({ where: { action: "tenant.plan.change" } });
    assert.deepEqual(renewalAudit?.data, {
      before: { planExpiresAt: expiresAt.toISOString(), status: "suspended" },
      after: { planExpiresAt: renewedAt.toISOString(), status: "active" },
    });
    assert.equal(renewalAudit?.actorId, actorId); assert.equal(renewalAudit?.actorType, "platform_admin");
    const renewedJob = await repo.outbox.first({ where: { topic: "invalidate", id: { not: invalidation.id } } });
    assert.deepEqual((renewedJob?.payload as { hosts: string[] }).hosts.sort(), hosts);
    assert.equal((await ops.domains.resolve(hosts[0]))?.tenantStatus, "active");
    assert.deepEqual(await ops.tenants.changePlan({ actorId, tenantId, changes: { planExpiresAt: new Date(renewedAt) } }), { changed: false });
    assert.equal(await repo.outbox.count(), 6);
    assert.deepEqual(await repo.site.get(site.id), site, "billing preserves site content");

    // A new expiry has its own milestones, even after the previous subscription was suspended.
    t.mock.timers.setTime(renewedAt.getTime() - 14 * DAY);
    await ops.billing.run({ now: new Date() });
    assert.equal(await repo.outbox.count({ where: { idempotencyKey: `renewal:${tenantId}:${renewedAt.toISOString()}:14` } }), 1);
    // A newer manual suspension wins over the old billing audit.
    await ops.tenants.changePlan({ actorId, tenantId, changes: { status: "suspended" } });
    await ops.tenants.changePlan({ actorId, tenantId, changes: { planExpiresAt: at(60) } });
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status, "suspended");
  } finally {
    await platform.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([platform.$disconnect(), db.$disconnect()]);
  }
});

test("Postgres billing: null expiry, trial, manual suspension, explicit status, expiry removal and concurrent renewal", { skip }, async t => {
  t.mock.timers.enable({ apis: ["Date"], now: at(-5) });
  const platform = createPlatformDb({ pool: 3 });
  const ops = forPlatform(platform), ids = Array.from({ length: 6 }, () => randomUUID()), actorId = randomUUID();
  const [trial, unlimited, manual, concurrent, active, expiredTrial] = ids;
  try {
    for (const id of ids) await platform.tenant.create({ data: {
      id, slug: `billing-${id}`, name: "[DỮ LIỆU MẪU] Gói", planId: "basic",
      status: [trial, expiredTrial].includes(id) ? "trial" : id === manual ? "suspended" : "active", planExpiresAt: id === unlimited ? null : expiresAt,
    } });
    assert.deepEqual(await ops.billing.run({ now: new Date() }), { reminded: 4, suspended: 0 });
    assert.deepEqual(await ops.billing.run({ now: new Date() }), { reminded: 0, suspended: 0 });
    for (const id of [trial, concurrent, active, expiredTrial]) {
      const jobs = await forTenant(platform, id).outbox.list();
      assert.equal(jobs.length, 1);
      assert.deepEqual(jobs[0].payload, { tenantId: id, days: 7, expiresAt: expiresAt.toISOString() });
    }
    for (const id of [unlimited, manual]) assert.equal(await forTenant(platform, id).outbox.count(), 0);
    await ops.tenants.changePlan({ actorId, tenantId: manual, changes: { planExpiresAt: at(40) } });
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: manual } })).status, "suspended");
    await ops.tenants.changePlan({ actorId, tenantId: manual, changes: { status: "active" } });
    assert.deepEqual((await forTenant(platform, manual).outbox.first({ where: { topic: "invalidate", payload: { path: ["hosts"], equals: [] } } }))?.payload,
      { tags: [`tenant:${manual}`], hosts: [] });
    await ops.tenants.changePlan({ actorId, tenantId: active, changes: { status: "suspended" } });
    await ops.tenants.changePlan({ actorId, tenantId: active, changes: { planExpiresAt: at(40) } });
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: active } })).status, "suspended");
    await ops.tenants.changePlan({ actorId, tenantId: trial, changes: { planExpiresAt: null } });
    const cleared = await forTenant(platform, trial).auditLog.first({ where: { action: "tenant.plan.change" } });
    assert.deepEqual(cleared?.data, { before: { planExpiresAt: expiresAt.toISOString() }, after: { planExpiresAt: null } });
    t.mock.timers.setTime(at(7).getTime());
    await Promise.all([
      ops.billing.run({ now: new Date() }),
      ops.tenants.changePlan({ actorId, tenantId: concurrent, changes: { planExpiresAt: at(40) } }),
    ]);
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: concurrent } })).status, "active");
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: trial } })).status, "trial");
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: unlimited } })).status, "active");
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: expiredTrial } })).status, "suspended");
  } finally { await platform.tenant.deleteMany({ where: { id: { in: ids } } }); await platform.$disconnect(); }
});

test("Postgres billing: outbox failure rolls back suspension, audit and invalidation", {
  skip: skip || (!process.env.TEST_OWNER_DATABASE_URL && "TEST_OWNER_DATABASE_URL missing: requires trigger injection"),
}, async () => {
  const platform = createPlatformDb({ pool: 2 });
  const tenantId = randomUUID(), fn = `test_billing_${tenantId.replaceAll("-", "")}`;
  const owner = new pg.Pool({ connectionString: process.env.TEST_OWNER_DATABASE_URL, max: 1 });
  try {
    await platform.tenant.create({ data: { id: tenantId, slug: `billing-${tenantId}`, name: "[DỮ LIỆU MẪU] Rollback",
      planId: "basic", status: "active", planExpiresAt: expiresAt } });
    await owner.query(`CREATE FUNCTION public.${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected billing failure'; END $$`);
    try {
      await owner.query(`CREATE TRIGGER ${fn} BEFORE INSERT ON public."Outbox" FOR EACH ROW WHEN (NEW."tenantId" = '${tenantId}'::uuid AND NEW.topic = 'notify.suspended') EXECUTE FUNCTION public.${fn}()`);
      try {
        await assert.rejects(forPlatform(platform).billing.run({ now: at(7) }), /injected billing failure/);
        assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status, "active");
        assert.equal(await forTenant(platform, tenantId).auditLog.count(), 0);
        assert.equal(await forTenant(platform, tenantId).outbox.count(), 0);
      } finally { await owner.query(`DROP TRIGGER ${fn} ON public."Outbox"`); }
    } finally { await owner.query(`DROP FUNCTION public.${fn}()`); }
    await forPlatform(platform).billing.run({ now: at(7) });
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status, "suspended");
    assert.equal(await forTenant(platform, tenantId).outbox.count(), 2);
  } finally {
    await platform.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([owner.end(), platform.$disconnect()]);
  }
});

test("Postgres billing: simultaneous audit timestamps preserve a manual suspension when renewed", { skip }, async t => {
  t.mock.timers.enable({ apis: ["Date"], now: at(7) });
  const platform = createPlatformDb({ pool: 1 }), tenantId = randomUUID(), actorId = randomUUID();
  const createdAt = at(7);
  try {
    await platform.tenant.create({ data: { id: tenantId, slug: `billing-${tenantId}`, name: "[DỮ LIỆU MẪU] Khóa thủ công",
      planId: "basic", status: "suspended", planExpiresAt: expiresAt } });
    await platform.auditLog.createMany({ data: [
      { id: "ffffffff-ffff-4fff-8fff-ffffffffffff", tenantId, actorType: "system", action: "tenant.suspend.expired", entity: "Tenant", entityId: tenantId,
        createdAt, data: { planExpiresAt: expiresAt.toISOString() } },
      { id: "00000000-0000-4000-8000-000000000001", tenantId, actorType: "platform_admin", actorId, action: "tenant.plan.change", entity: "Tenant", entityId: tenantId,
        createdAt, data: { before: { status: "active" }, after: { status: "suspended" } } },
    ] });
    await forPlatform(platform).tenants.changePlan({ actorId, tenantId, changes: { planExpiresAt: at(60) } });
    assert.equal((await platform.tenant.findUniqueOrThrow({ where: { id: tenantId } })).status, "suspended");
  } finally { await platform.tenant.deleteMany({ where: { id: tenantId } }); await platform.$disconnect(); }
});
