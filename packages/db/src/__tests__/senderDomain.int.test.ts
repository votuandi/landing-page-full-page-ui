import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createDb, createPlatformDb, forTenant, findLeadSender, demoteSendingDomain, MissingTenantError } from "../index.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL && process.env.TEST_OWNER_DATABASE_URL)
  && "requires migrated PostgreSQL and regenerated Prisma client";

test("chỉ verified mới có sender; hết gói, trial, suspended; hạ rồi nâng gói", { skip }, async () => {
  const db = createDb({ pool: 1 }), platform = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await platform.tenant.create({ data: { id: tenantId, slug: tenantId, name: '[DỮ LIỆU MẪU] "Solar"', planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId);
    assert.equal(await findLeadSender(db, tenantId), null);
    const row = await repo.sendingDomain.create({ hostname: `mail.${tenantId}.vn` });
    for (const status of ["pending", "failed", "verified"] as const) {
      await repo.sendingDomain.update(row.id, { status });
      assert.equal((await findLeadSender(db, tenantId))?.hostname ?? null, status === "verified" ? row.hostname : null);
    }
    for (const data of [{ planId: "pro" }, { planId: "premium", status: "suspended" as const },
      { status: "trial" as const, createdAt: new Date(Date.now() - 15 * 86400_000) }]) {
      await platform.tenant.update({ where: { id: tenantId }, data });
      assert.equal(await findLeadSender(db, tenantId), null);
    }
    await platform.tenant.update({ where: { id: tenantId }, data: { planId: "premium", status: "active" } });
    assert.equal((await findLeadSender(db, tenantId))?.hostname, row.hostname);
    await demoteSendingDomain(db, tenantId, "different.vn");
    assert.equal((await repo.sendingDomain.get(row.id))?.status, "verified");
    await demoteSendingDomain(db, tenantId, row.hostname);
    assert.equal((await repo.sendingDomain.get(row.id))?.status, "failed");
    assert.equal(await findLeadSender(db, tenantId), null);
  } finally {
    await platform.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), platform.$disconnect()]);
  }
});

test("cách ly tenant: RLS/thiếu scope, unique hostname và hai add đồng thời", { skip }, async () => {
  const db = createDb({ pool: 1 }), platform = createPlatformDb({ pool: 1 }), a = randomUUID(), b = randomUUID();
  const runtime = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    for (const id of [a, b]) await platform.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repoA = forTenant(db, a), repoB = forTenant(db, b), hostname = `mail.${a}.vn`;
    const attempts = await Promise.allSettled([repoA.sendingDomain.create({ hostname }), repoA.sendingDomain.create({ hostname: `other.${a}.vn` })]);
    assert.equal(attempts.filter(result => result.status === "fulfilled").length, 1);
    const row = (await repoA.sendingDomain.first())!;
    assert.equal(await repoB.sendingDomain.get(row.id), null);
    assert.equal(await findLeadSender(db, b), null);
    await assert.rejects(repoB.sendingDomain.create({ hostname: row.hostname }), { code: "P2002" });
    await assert.rejects(db.sendingDomain.findMany(), MissingTenantError);
    assert.deepEqual((await runtime.query('SELECT * FROM public."SendingDomain"')).rows, []);
  } finally {
    await platform.tenant.deleteMany({ where: { id: { in: [a, b] } } });
    await Promise.all([db.$disconnect(), platform.$disconnect(), runtime.end()]);
  }
});
