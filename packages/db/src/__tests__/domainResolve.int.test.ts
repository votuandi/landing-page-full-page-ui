import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { createDb, type Db } from "../client.ts";
import { forPlatform, forTenant } from "../repository.ts";

describe("platform domain resolution", { skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires Postgres 16" }, () => {
  let db: Db;
  const tenantId = randomUUID(), otherTenant = randomUUID(), siteId = randomUUID(), otherSite = randomUUID();
  const planId = `resolve-${randomUUID()}`;
  const host = `${randomUUID()}.localhost`, primary = `www.${host}`;
  before(async () => {
    db = createDb({ pool: 2 });
    await db.plan.create({ data: { id: planId, name: "Test", features: [], limits: {} } });
    for (const id of [tenantId, otherTenant]) await db.tenant.create({ data: { id, slug: id, name: "[DỮ LIỆU MẪU]", planId } });
    for (const id of [siteId, otherSite]) await forTenant(db, tenantId).site.create({ id, name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const repo = forTenant(db, tenantId);
    await repo.domain.create({ hostname: host, siteId, verificationToken: randomUUID(), status: "active" });
    await repo.domain.create({ hostname: primary, siteId, verificationToken: randomUUID(), status: "verified", isPrimary: true });
    await repo.domain.create({ hostname: `other.${host}`, siteId: otherSite, verificationToken: randomUUID(), status: "active", isPrimary: true });
  });
  after(async () => {
    if (!db) return;
    try {
      await db.tenant.deleteMany({ where: { id: { in: [tenantId, otherTenant] } } });
      await db.plan.delete({ where: { id: planId } });
    } finally { await db.$disconnect(); }
  });
  test("returns only routing fields, tenant status and the primary of the same site", async () => {
    assert.deepEqual(await forPlatform(db).domains.resolve(host), {
      hostname: host, tenantId, siteId, status: "active", isPrimary: false, tenantStatus: "trial", primaryHost: primary,
    });
    assert.equal(await forPlatform(db).domains.resolve(`missing.${host}`), null);
    await db.tenant.update({ where: { id: tenantId }, data: { status: "suspended" } });
    assert.equal((await forPlatform(db).domains.resolve(host))?.tenantStatus, "suspended");
  });
  test("removed and pending primaries cannot become redirect targets; reassigned pending host stays pending", async () => {
    const repo = forTenant(db, tenantId);
    const domain = await repo.domain.first({ where: { hostname: primary } });
    assert.ok(domain);
    for (const status of ["removed", "pending"] as const) {
      await repo.domain.update(domain.id, { status });
      assert.equal((await forPlatform(db).domains.resolve(host))?.primaryHost, null);
    }
    const alias = await repo.domain.first({ where: { hostname: host } });
    assert.ok(alias);
    await repo.domain.delete(alias.id);
    const newSite = await forTenant(db, otherTenant).site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t12" });
    await forTenant(db, otherTenant).domain.create({ hostname: host, siteId: newSite.id, verificationToken: randomUUID() });
    const resolved = await forPlatform(db).domains.resolve(host);
    assert.equal(resolved?.tenantId, otherTenant);
    assert.equal(resolved?.status, "pending");
    assert.equal(resolved?.primaryHost, null);
  });
});
