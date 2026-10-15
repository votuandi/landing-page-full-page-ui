import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { normalizeVnPhone } from "../../../core/src/phone.ts";
import { createDb, type Db } from "../client.ts";
import { forPlatform, forTenant } from "../repository.ts";

// E5-S10 / D17: SiteUser logins are unique per tenant only; platform accounts live in their own tables.
describe("tenant-scoped accounts", { skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16" }, () => {
  let db: Db;
  const a = randomUUID(), b = randomUUID(), planId = `accounts-${randomUUID()}`, tag = randomUUID().slice(0, 8);
  const adminEmail = `admin-${tag}@demo.vn`;
  const user = (tenantId: string, data: Record<string, unknown>) =>
    forTenant(db, tenantId).siteUser.create({ name: "[DỮ LIỆU MẪU]", role: "owner", ...data } as never);
  before(async () => {
    db = createDb({ pool: 2 });
    await db.plan.create({ data: { id: planId, name: "Test", features: [], limits: {} } });
    for (const id of [a, b]) {
      await db.tenant.create({ data: { id, slug: `acc-${tag}-${id.slice(0, 8)}`, name: "[DỮ LIỆU MẪU]", planId } });
      await forTenant(db, id).site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    }
  });
  after(async () => {
    if (!db) return;
    try {
      await db.tenant.deleteMany({ where: { id: { in: [a, b] } } });
      await db.plan.delete({ where: { id: planId } });
      await forPlatform(db).platformAdmin.deleteMany({ where: { email: adminEmail } });
    } finally { await db.$disconnect(); }
  });

  test("same email/phone/username in two tenants are two accounts; duplicates inside a tenant fail", async () => {
    const login = { email: "a@x.vn", phone: normalizeVnPhone("0901 234 567"), username: "nangluongsolar_admin" };
    const userA = await user(a, { ...login, passwordHash: "hash-a" });
    const userB = await user(b, { ...login, passwordHash: "hash-b" });
    assert.notEqual(userA.id, userB.id);
    await assert.rejects(user(a, { email: "A@X.vn ".trim().toLowerCase() }), /Unique constraint/);
    await assert.rejects(user(a, { phone: normalizeVnPhone("+84901234567") }), /Unique constraint/);
    await assert.rejects(user(a, { username: login.username }), /Unique constraint/);
    // Un-normalized values never reach the unique index.
    await assert.rejects(user(a, { email: "A@X.vn" }), /SiteUser_email_check/);
    await assert.rejects(user(a, { phone: "+84901234567" }), /SiteUser_phone_check/);
    await assert.rejects(user(a, { username: "0901234567" }), /SiteUser_username_check/);
  });

  test("an account needs an identifier; ghost sessions are admin-only", async () => {
    await assert.rejects(user(a, {}), /SiteUser_identifier_check/);
    const admin = await forPlatform(db).platformAdmin.create({ data: { email: adminEmail, name: "Ops", passwordHash: "x" } });
    const grant = await forPlatform(db).ghostGrant.create({ data: {
      platformAdminId: admin.id, targetTenantId: a, reason: "test", tokenHash: randomUUID(),
      expiresAt: new Date(Date.now() + 60_000), sessionExpiresAt: new Date(Date.now() + 1_800_000),
    } });
    const session = (data: Record<string, unknown>) => forTenant(db, a).siteSession.create({
      tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60_000), ...data,
    } as never);
    await assert.rejects(session({ kind: "ghost", audience: "storefront", ghostGrantId: grant.id }), /SiteSession_kind_check/);
    await assert.rejects(session({ kind: "user", audience: "admin" }), /SiteSession_kind_check/);
    assert.ok(await session({ kind: "ghost", audience: "admin", ghostGrantId: grant.id }));
  });

  test("tenant repositories never cross tenants and hide secrets by default", async () => {
    const foreign = await user(b, { email: `foreign-${tag}@x.vn`, passwordHash: "secret", totpSecret: "totp" });
    assert.equal(await forTenant(db, a).siteUser.get(foreign.id), null);
    await assert.rejects(forTenant(db, a).siteSession.create({
      siteUserId: foreign.id, audience: "admin", tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60_000),
    }), /Foreign key constraint/);
    const own = await forTenant(db, b).siteUser.get(foreign.id);
    assert.ok(own);
    assert.equal("passwordHash" in own, false);
    assert.equal("totpSecret" in own, false);
    const withHash = await forTenant(db, b).siteUser.first({ where: { id: foreign.id }, omit: { passwordHash: false } });
    assert.equal(withHash?.passwordHash, "secret");
  });

  test("reserved or malformed subdomains and a second site are rejected by the database", async () => {
    for (const slug of ["admin", "console", "preview", "xn--abc", "-abc"]) {
      await assert.rejects(db.tenant.create({ data: { slug, name: "x", planId } }), /Tenant_slug_check/, slug);
    }
    await assert.rejects(forTenant(db, a).site.create({ name: "Second", themeId: "t12" }), /Unique constraint/);
  });
});
