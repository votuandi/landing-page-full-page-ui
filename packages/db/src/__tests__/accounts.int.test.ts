import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { normalizeVnPhone } from "../../../core/src/phone.ts";
import { createDb, createPlatformDb, type Db } from "../client.ts";
import { forPlatform, forTenant } from "../repository.ts";
import { CrossTenantRefError } from "../refs.ts";

// E5-S10 / D17: SiteUser logins are unique per tenant only; platform accounts live in their own tables.
describe("tenant-scoped accounts", { skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16" }, () => {
  let db: Db;
  let ops: ReturnType<typeof createPlatformDb>;
  const a = randomUUID(), b = randomUUID(), planId = `accounts-${randomUUID()}`, tag = randomUUID().slice(0, 8);
  const adminEmail = `admin-${tag}@demo.vn`;
  const user = (tenantId: string, data: Record<string, unknown>) =>
    forTenant(db, tenantId).siteUser.create({ name: "[DỮ LIỆU MẪU]", role: "owner", ...data } as never);
  before(async () => {
    db = createDb({ pool: 2 });
    ops = createPlatformDb({ pool: 2 });
    await ops.plan.create({ data: { id: planId, name: "Test", features: [], limits: {} } });
    for (const id of [a, b]) {
      await ops.tenant.create({ data: { id, slug: `acc-${tag}-${id.slice(0, 8)}`, name: "[DỮ LIỆU MẪU]", planId } });
      await forTenant(db, id).site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    }
  });
  after(async () => {
    if (!db) return;
    try {
      await ops.tenant.deleteMany({ where: { id: { in: [a, b] } } });
      await ops.plan.delete({ where: { id: planId } });
      await forPlatform(ops).platformAdmin.deleteMany({ where: { email: adminEmail } });
    } finally { await Promise.all([db.$disconnect(), ops.$disconnect()]); }
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

  test("an account needs an identifier; session kinds, audiences and grants are checked", async () => {
    await assert.rejects(user(a, {}), /SiteUser_identifier_check/);
    const admin = await forPlatform(ops).platformAdmin.create({ data: { email: adminEmail, name: "Ops", passwordHash: "x" } });
    const grantFor = (targetTenantId: string) => forPlatform(ops).ghostGrant.create({ data: {
      platformAdminId: admin.id, targetTenantId, reason: "test", tokenHash: randomUUID(),
      expiresAt: new Date(Date.now() + 60_000), sessionExpiresAt: new Date(Date.now() + 1_800_000),
    } });
    const [grant, grantB] = [await grantFor(a), await grantFor(b)];
    const member = await user(a, { email: `member-${tag}@x.vn` });
    const session = (data: Record<string, unknown>) => forTenant(db, a).siteSession.create({
      tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60_000), ...data,
    } as never);
    for (const invalid of [
      { kind: "ghost", audience: "storefront", ghostGrantId: grant.id },
      { kind: "ghost", audience: "admin" },
      { kind: "ghost", audience: "admin", ghostGrantId: grant.id, siteUserId: member.id },
      { kind: "user", audience: "admin" },
      { kind: "user", audience: "admin", siteUserId: member.id, ghostGrantId: grant.id },
    ]) await assert.rejects(session(invalid), /SiteSession_kind_check/, JSON.stringify(invalid));
    for (const audience of ["admin", "storefront"]) assert.ok(await session({ kind: "user", audience, siteUserId: member.id }));
    const ghost = await session({ kind: "ghost", audience: "admin", ghostGrantId: grant.id }) as { id: string };
    // A grant only opens sessions in its own target tenant (D18), on create and on update.
    await assert.rejects(session({ kind: "ghost", audience: "admin", ghostGrantId: grantB.id }), /Foreign key constraint/);
    await assert.rejects(forTenant(db, a).siteSession.update(ghost.id, { ghostGrantId: grantB.id }), /Foreign key constraint/);
  });

  test("tokens and page versions cannot point at another tenant's account", async () => {
    const foreign = await user(b, { email: `token-${tag}@x.vn` });
    const own = await user(a, { email: `token-${tag}@x.vn` });
    const token = (siteUserId: string) => forTenant(db, a).siteToken.create({
      siteUserId, purpose: "invite", tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 60_000),
    } as never) as Promise<{ id: string }>;
    await assert.rejects(token(foreign.id), /Foreign key constraint/);
    const ownToken = await token(own.id);
    await assert.rejects(forTenant(db, a).siteToken.update(ownToken.id, { siteUserId: foreign.id }), /Foreign key constraint/);
    const site = await forTenant(db, a).site.first();
    const page = await forTenant(db, a).page.create({ siteId: site!.id, slug: `v-${tag}`, sections: [] });
    const version = (data: Record<string, unknown>) => forTenant(db, a).pageVersion.create({ pageId: page.id, snapshot: {}, ...data } as never) as Promise<{ id: string }>;
    await assert.rejects(version({ revision: 1, publishedBySiteUserId: foreign.id }), /Foreign key constraint/);
    const saved = await version({ revision: 2, publishedBySiteUserId: own.id });
    await assert.rejects(forTenant(db, a).pageVersion.update(saved.id, { publishedBySiteUserId: foreign.id }), /Foreign key constraint/);
  });

  test("reads cannot hop through platform relations into another tenant (customer, plan, ghost grants)", async () => {
    const customer = await forPlatform(ops).customer.create({ data: { name: "[DỮ LIỆU MẪU] Customer", contactName: "x" } });
    await ops.tenant.updateMany({ where: { id: { in: [a, b] } }, data: { customerId: customer.id } });
    const repo = forTenant(db, a);
    for (const include of [
      { tenant: { include: { customer: { include: { tenants: { include: { siteUsers: true } } } } } } },
      { tenant: { include: { plan: { include: { tenants: true } } } } },
      { tenant: { select: { ghostGrants: true } } },
    ]) await assert.rejects(async () => repo.siteUser.first({ include } as never), CrossTenantRefError, JSON.stringify(include));
    await assert.rejects(async () => repo.siteSession.first({ include: { ghostGrant: { include: { platformAdmin: { include: { ghostGrants: true } } } } } } as never), CrossTenantRefError);
    await assert.rejects(async () => repo.siteUser.first({ select: { tenant: { select: { _count: { select: { ghostGrants: true } } } } } } as never), CrossTenantRefError);
    // The tenant itself and its own rows stay readable.
    const row = await repo.siteUser.first({ include: { tenant: { include: { siteUsers: true } } } });
    assert.ok(row);
    assert.ok(row.tenant.siteUsers.every((item) => item.tenantId === a));
    await ops.tenant.updateMany({ where: { id: { in: [a, b] } }, data: { customerId: null } });
    await forPlatform(ops).customer.delete({ where: { id: customer.id } });
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
      await assert.rejects(ops.tenant.create({ data: { slug, name: "x", planId } }), /Tenant_slug_check/, slug);
    }
    await assert.rejects(forTenant(db, a).site.create({ name: "Second", themeId: "t12" }), /Unique constraint/);
  });
});
