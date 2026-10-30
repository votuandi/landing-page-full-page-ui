import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { createDb, createPlatformDb, forTenant, type SiteRole, type SiteUserStatus } from "@solar/db";
import { createLoginLimiter, createRealm, effectivePermissions, hashPassword, type Session } from "@solar/auth";
import { siteStore } from "@solar/auth/db";
import { createAccounts } from "../lib/accounts.ts";
import { createStaff } from "../lib/staff.ts";

describe("staff with PostgreSQL and RLS", { skip: !process.env.DATABASE_URL || !process.env.PLATFORM_DATABASE_URL ? "Claude: requires migrated DB" : false }, () => {
  let db: ReturnType<typeof createDb>, ops: ReturnType<typeof createPlatformDb>, passwordHash: string;
  const tenants: string[] = [], password = "Solar!Staff-password-strong";
  before(async () => { db = createDb({ pool: 4 }); ops = createPlatformDb({ pool: 2 }); passwordHash = await hashPassword(password); });
  after(async () => {
    try { if (ops) await ops.tenant.deleteMany({ where: { id: { in: tenants } } }); }
    finally { await Promise.all([db?.$disconnect(), ops?.$disconnect()]); }
  });
  async function setup(planId = "premium") {
    const tenantId = randomUUID(); tenants.push(tenantId);
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId, status: "active" } });
    const repo = forTenant(db, tenantId);
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    async function user(role: SiteRole = "editor", status: SiteUserStatus = "active", email = `${randomUUID()}@demo.vn`) {
      return repo.siteUser.create({ role, status, email, name: "[DỮ LIỆU MẪU]", passwordHash });
    }
    const owner = await user("owner");
    const limiter = createLoginLimiter({ ipLimit: 1000, maxFailures: 100 });
    const realm = createRealm({ name: "site", secret: "s".repeat(32), store: siteStore(db, { audience: "admin" }), limiter, sessionTtl: 86400_000, idleTtl: 3600_000 });
    const service = createStaff({ db, realm, limiter });
    async function login(email = owner.email!, audience: "admin" | "storefront" = "admin") {
      const r = audience === "admin" ? realm : createRealm({ name: "site", secret: "s".repeat(32), store: siteStore(db, { audience }), sessionTtl: 86400_000, idleTtl: 3600_000 });
      const result = await r.login({ identifier: email, password, tenantId, ip: "test", userAgent: "node:test" });
      assert.equal(result.ok, true); return { ...result, realm: r };
    }
    const logged = await login(), session = logged.session;
    const invite = (identifier = `${randomUUID()}@demo.vn`, s = session) => service.invite(s, tenantId, { identifier, name: "[DỮ LIỆU MẪU]", role: "editor" }, "https://test.admin.solar.vn");
    return { tenantId, repo, site, user, owner, service, session, realm, login, invite, logged, limiter };
  }
  test("list excludes clients and secrets", async () => {
    const s = await setup(); await s.user("client");
    await s.repo.siteUser.update(s.owner.id, { totpSecret: "secret", totpBackupCodes: ["secret"] });
    const result = await s.service.list(s.session, s.tenantId);
    assert.equal(result.users.length, 1); assert.equal(result.users[0].hasTotp, true);
    assert.ok(result.users[0].lastLoginAt, "login records the timestamp in PostgreSQL");
    for (const key of ["totpSecret", "totpBackupCodes", "passwordHash"]) assert.equal(key in result.users[0], false);
  });
  test("invite by email queues mail, returns no link", async () => {
    const s = await setup(), result = await s.invite(" Staff@Demo.vn ");
    assert.equal(result.url, undefined);
    const user = await s.repo.siteUser.first({ where: { email: "staff@demo.vn" } }); assert.equal(user?.status, "invited");
    const jobs = await s.repo.outbox.list({ where: { topic: "mail.send" } }); assert.equal(jobs.length, 1);
    assert.equal((jobs[0].payload as { to: string }).to, "staff@demo.vn");
  });
  test("invite by phone returns one-use link", async () => {
    const s = await setup(), result = await s.invite("0901 234 567");
    assert.equal((await s.repo.outbox.count()), 0);
    const raw = new URL(result.url!).searchParams.get("token")!;
    const accounts = createAccounts({ db, realm: s.realm, limiter: s.limiter });
    await accounts.setPassword(s.tenantId, raw, password, "invite");
    const user = await s.repo.siteUser.first({ where: { phone: "0901234567" } });
    assert.equal(user?.status, "active"); assert.equal(user?.emailVerifiedAt, null);
    await assert.rejects(accounts.setPassword(s.tenantId, raw, password, "invite"));
  });
  test("invite over plan limit is rejected", async () => {
    const s = await setup("basic");
    await assert.rejects(s.invite(), error => !!error && typeof error === "object" && "details" in error && (error.details as { limit: boolean }).limit);
    assert.equal(await s.repo.siteUser.count(), 1);
  });
  test("limit counts staff only", async () => {
    const s = await setup("pro"); for (let i = 0; i < 5; i++) await s.user("client");
    await s.user("staff", "disabled"); await s.invite(); await s.invite(); await assert.rejects(s.invite(), { status: 403 });
    assert.equal((await s.service.list(s.session, s.tenantId)).used, 3);
  });
  test("duplicate login id in site, allowed in other site", async () => {
    const s = await setup(), other = await setup(); await s.invite("dup@demo.vn");
    await assert.rejects(s.invite(" DUP@demo.vn "), /đã có tài khoản/); await other.invite("dup@demo.vn");
  });
  test("role change applies next request", async () => {
    const s = await setup(), user = await s.user(), logged = await s.login(user.email!);
    await s.service.changeRole(s.session, s.tenantId, user.id, "viewer");
    const current = await s.realm.getSession(logged.cookie.value, { tenantOfHost: s.tenantId });
    assert.equal(current?.permissions.has("pages.edit") ?? false, false);
    assert.equal((await s.repo.siteUser.get(user.id))?.role, "viewer");
  });
  test("changing invited role preserves the invitation", async () => {
    const s = await setup(), invite = await s.invite("0901234567");
    const user = await s.repo.siteUser.first({ where: { phone: "0901234567" } });
    await s.service.changeRole(s.session, s.tenantId, user!.id, "viewer");
    await createAccounts({ db, realm: s.realm, limiter: s.limiter }).setPassword(s.tenantId, new URL(invite.url!).searchParams.get("token")!, password, "invite");
    assert.equal((await s.repo.siteUser.get(user!.id))?.role, "viewer");
  });
  test("lock revokes sessions, unlock restores", async () => {
    const s = await setup(), user = await s.user(), logged = await s.login(user.email!), store = await s.login(user.email!, "storefront");
    await s.service.setLocked(s.session, s.tenantId, user.id, true);
    for (const l of [logged, store]) assert.equal(await l.realm.getSession(l.cookie.value, { tenantOfHost: s.tenantId }), null);
    await s.service.setLocked(s.session, s.tenantId, user.id, false); await s.login(user.email!);
  });
  test("remove ends sessions, keeps page versions", async () => {
    const s = await setup(), user = await s.user(), logged = await s.login(user.email!);
    const page = await s.repo.page.create({ siteId: s.site.id, slug: "home", sections: [] });
    const version = await s.repo.pageVersion.create({ pageId: page.id, revision: 1, snapshot: {}, publishedBySiteUserId: user.id });
    await s.service.remove(s.session, s.tenantId, user.id);
    assert.equal(await s.repo.siteUser.get(user.id), null);
    assert.equal(await s.realm.getSession(logged.cookie.value, { tenantOfHost: s.tenantId }), null);
    const kept = await s.repo.pageVersion.get(version.id); assert.equal(kept?.publishedBySiteUserId, null); assert.equal(kept?.tenantId, s.tenantId);
    await s.invite(user.email!);
  });
  test("remove ends sessions in all audiences", async () => {
    const s = await setup(), user = await s.user(), admin = await s.login(user.email!), storefront = await s.login(user.email!, "storefront");
    await s.service.remove(s.session, s.tenantId, user.id);
    assert.equal(await s.repo.siteUser.get(user.id), null);
    for (const logged of [admin, storefront]) assert.equal(await logged.realm.getSession(logged.cookie.value, { tenantOfHost: s.tenantId }), null);
    await s.invite(user.email!);
  });
  test("last active owner is protected", async () => {
    const s = await setup(), actor = await s.user("owner", "locked");
    const stale = { ...s.session, accountId: actor.id };
    for (const run of [() => s.service.changeRole(stale, s.tenantId, s.owner.id, "admin"), () => s.service.setLocked(stale, s.tenantId, s.owner.id, true), () => s.service.remove(stale, s.tenantId, s.owner.id)]) await assert.rejects(run(), { status: 403 });
    // A ghost can manage users but must never remove the final active owner either.
    assert.equal(await s.repo.siteUser.count({ where: { role: "owner", status: "active" } }), 1);
  });
  test("admin cannot touch or create owner", async () => {
    const s = await setup(), admin = await s.user("admin"), logged = await s.login(admin.email!);
    for (const run of [() => s.service.changeRole(logged.session, s.tenantId, s.owner.id, "editor"), () => s.service.setLocked(logged.session, s.tenantId, s.owner.id, true), () => s.service.remove(logged.session, s.tenantId, s.owner.id), () => s.service.resendInvite(logged.session, s.tenantId, s.owner.id, "https://test.vn")]) await assert.rejects(run(), { status: 403 });
    await assert.rejects(s.service.changeRole(s.session, s.tenantId, admin.id, "owner" as "admin"), { status: 400 });
  });
  test("transfer owner is owner-only and atomic", async () => {
    const s = await setup(), user = await s.user(), logged = await s.login(user.email!);
    await assert.rejects(s.service.transferOwner(logged.session, s.tenantId, s.owner.id), { status: 403 });
    const invited = await s.user("staff", "invited");
    await assert.rejects(s.service.transferOwner(s.session, s.tenantId, invited.id), { status: 400 });
    await s.service.transferOwner(s.session, s.tenantId, user.id);
    assert.equal((await s.repo.siteUser.get(s.owner.id))?.role, "admin"); assert.equal((await s.repo.siteUser.get(user.id))?.role, "owner");
  });
  test("client conversion rules", async () => {
    const s = await setup(), client = await s.user("client"), admin = await s.user("admin"), logged = await s.login(admin.email!), customer = await s.login(client.email!, "storefront");
    await assert.rejects(s.service.convertClient(logged.session, s.tenantId, client.id, "staff"), { status: 403 });
    await assert.rejects(s.service.convertToClient(logged.session, s.tenantId, s.owner.id), { status: 403 });
    await assert.rejects(s.invite(client.email!), error => !!error && typeof error === "object" && "details" in error && (error.details as { clientId: string }).clientId === client.id);
    await s.service.convertClient(s.session, s.tenantId, client.id, "staff");
    assert.equal(await customer.realm.getSession(customer.cookie.value, { tenantOfHost: s.tenantId }), null);
    await s.service.convertToClient(s.session, s.tenantId, client.id); assert.equal((await s.repo.siteUser.get(client.id))?.role, "client");
    const pending = await s.user("client", "unverified"); await assert.rejects(s.service.convertClient(s.session, s.tenantId, pending.id, "staff"), { status: 400 });
    const basic = await setup("basic"), bc = await basic.user("client"); await assert.rejects(basic.service.convertClient(basic.session, basic.tenantId, bc.id, "staff"), { status: 403 });
  });
  test("own sessions list and revoke others", async () => {
    const s = await setup(), other = await s.login(), storefront = await s.login(s.owner.email!, "storefront");
    const rows = await s.service.sessions(s.session, s.tenantId); assert.equal(rows.length, 3); assert.equal(rows.filter(r => r.current).length, 1);
    assert.equal("tokenHash" in rows[0], false);
    await s.service.logoutOtherSessions(s.session, s.tenantId);
    assert.ok(await s.realm.getSession(s.logged.cookie.value, { tenantOfHost: s.tenantId }));
    for (const l of [other, storefront]) assert.equal(await l.realm.getSession(l.cookie.value, { tenantOfHost: s.tenantId }), null);
  });
  test("resend invite replaces token; old invite link dies", async () => {
    const s = await setup(), first = await s.invite("0901234567"), user = await s.repo.siteUser.first({ where: { phone: "0901234567" } });
    const next = await s.service.resendInvite(s.session, s.tenantId, user!.id, "https://test.vn");
    assert.notEqual(first.url, next.url);
    const accounts = createAccounts({ db, realm: s.realm, limiter: s.limiter });
    await assert.rejects(accounts.setPassword(s.tenantId, new URL(first.url!).searchParams.get("token")!, password, "invite"));
    await s.service.remove(s.session, s.tenantId, user!.id);
    await assert.rejects(accounts.setPassword(s.tenantId, new URL(next.url!).searchParams.get("token")!, password, "invite"));
  });
  test("resend invite is rate limited", async () => {
    const s = await setup(); await s.invite(); const user = await s.repo.siteUser.first({ where: { status: "invited" } });
    const limited = createStaff({ db, realm: s.realm, limiter: createLoginLimiter({ maxFailures: 1 }) });
    await limited.resendInvite(s.session, s.tenantId, user!.id, "https://test.vn");
    await assert.rejects(limited.resendInvite(s.session, s.tenantId, user!.id, "https://test.vn"), { status: 429 });
  });
  test("concurrent owners cannot lock each other out", async () => {
    const s = await setup(), other = await s.user("owner"), logged = await s.login(other.email!);
    const results = await Promise.allSettled([s.service.setLocked(s.session, s.tenantId, other.id, true), s.service.setLocked(logged.session, s.tenantId, s.owner.id, true)]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1); assert.equal(await s.repo.siteUser.count({ where: { role: "owner", status: "active" } }), 1);
  });
  test("concurrent invites respect limit", async () => {
    const s = await setup("pro"); await s.user("staff", "locked");
    const results = await Promise.allSettled([s.invite(), s.invite()]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1); assert.equal(await s.repo.siteUser.count(), 3);
  });
  test("concurrent duplicate invite", async () => {
    const s = await setup(); const results = await Promise.allSettled([s.invite("same@demo.vn"), s.invite("same@demo.vn")]);
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    const failed = results.find(r => r.status === "rejected"); assert.equal(failed?.status, "rejected"); assert.match(failed.reason.message, /đã có tài khoản/);
  });
  test("other tenant user is not found; client cannot be managed as staff", async () => {
    const s = await setup(), other = await setup(), client = await s.user("client");
    for (const id of [other.owner.id, client.id]) for (const run of [() => s.service.changeRole(s.session, s.tenantId, id, "staff"), () => s.service.remove(s.session, s.tenantId, id), () => s.service.setLocked(s.session, s.tenantId, id, true), () => s.service.resendInvite(s.session, s.tenantId, id, "https://test.vn")]) await assert.rejects(run(), { status: 404 });
    assert.equal((await other.repo.siteUser.get(other.owner.id))?.status, "active");
  });
  test("self actions rejected", async () => {
    const s = await setup();
    for (const run of [() => s.service.changeRole(s.session, s.tenantId, s.owner.id, "staff"), () => s.service.remove(s.session, s.tenantId, s.owner.id), () => s.service.setLocked(s.session, s.tenantId, s.owner.id, true), () => s.service.convertToClient(s.session, s.tenantId, s.owner.id)]) await assert.rejects(run(), { status: 400 });
  });
  test("stale actor role is rechecked", async () => {
    const s = await setup(), target = await s.user(); await s.repo.siteUser.update(s.owner.id, { role: "editor" });
    await assert.rejects(s.service.setLocked(s.session, s.tenantId, target.id, true), { status: 403 });
  });
  test("lock state transitions", async () => {
    const s = await setup(), invited = await s.user("staff", "invited"), locked = await s.user("staff", "locked");
    for (const [id, value] of [[invited.id, false], [invited.id, true], [locked.id, true]] as const) await assert.rejects(s.service.setLocked(s.session, s.tenantId, id, value), { status: 409 });
  });
  test("tenant over limit keeps managing staff", async () => {
    const s = await setup("basic"), target = await s.user();
    await s.service.list(s.session, s.tenantId); await s.service.changeRole(s.session, s.tenantId, target.id, "staff");
    await s.service.setLocked(s.session, s.tenantId, target.id, true); await assert.rejects(s.invite(), { status: 403 });
  });
  test("ghost actor audit and limits", async () => {
    const s = await setup(), target = await s.user();
    // Site realm stores only the grant ID; no PlatformAdmin account is loaded here.
    const grantId = randomUUID(), sessionId = randomUUID();
    const admin = await ops.platformAdmin.create({ data: { email: `${randomUUID()}@demo.vn`, name: "[DỮ LIỆU MẪU]", passwordHash } });
    try {
      await ops.ghostGrant.create({ data: { id: grantId, platformAdminId: admin.id, targetTenantId: s.tenantId, reason: "[DỮ LIỆU MẪU]", tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 3600_000), sessionExpiresAt: new Date(Date.now() + 3600_000), usedAt: new Date() } });
      await s.repo.siteSession.create({ id: sessionId, kind: "ghost", audience: "admin", ghostGrantId: grantId, tokenHash: randomUUID(), expiresAt: new Date(Date.now() + 3600_000) });
      const ghost: Session = { ...s.session, id: sessionId, kind: "ghost", accountId: undefined, permissions: effectivePermissions({ role: "owner", kind: "ghost", audience: "admin" }) };
      await s.service.setLocked(ghost, s.tenantId, target.id, true);
      const audit = await s.repo.auditLog.first({ where: { action: "staff.locked" } }); assert.equal(audit?.actorType, "platform_admin"); assert.equal(audit?.ghostGrantId, grantId);
      for (const run of [() => s.service.remove(ghost, s.tenantId, target.id), () => s.service.transferOwner(ghost, s.tenantId, target.id), () => s.service.sessions(ghost, s.tenantId)]) await assert.rejects(run(), { status: 403 });
      await assert.rejects(s.service.setLocked(ghost, s.tenantId, s.owner.id, true), { status: 409 });
      await assert.rejects(s.service.changeRole(ghost, s.tenantId, s.owner.id, "admin"), { status: 409 });
    } finally { await ops.platformAdmin.delete({ where: { id: admin.id } }); }
  });
});
