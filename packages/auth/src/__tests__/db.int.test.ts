import assert from "node:assert/strict";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { createDb, createPlatformDb, forPlatform, forTenant, isGhostSessionActive } from "@solar/db";
import { siteStore, platformStore } from "../db.ts";
import { createRealm } from "../realm.ts";
import { hashPassword } from "../password.ts";
import { totp } from "../totp.ts";

describe("durable realm isolation under Postgres RLS", { skip: !process.env.DATABASE_URL || !process.env.PLATFORM_DATABASE_URL ? "requires DATABASE_URL and PLATFORM_DATABASE_URL" : false }, () => {
  let db: ReturnType<typeof createDb>, ops: ReturnType<typeof createPlatformDb>;
  let aUser: string, bUser: string, adminId: string;
  let site: ReturnType<typeof createRealm>, platform: ReturnType<typeof createRealm>, storefront: ReturnType<typeof createRealm>;
  let hash: string;
  const a = randomUUID(), b = randomUUID(), tag = randomUUID().slice(0, 8), planId = `auth-${tag}`;
  const password = "Solar!password-strong", secret = "a".repeat(32), email = `auth-${tag}@x.vn`;
  const input = { identifier: email, password, ip: "127.0.0.1", userAgent: "node:test" };
  const host = { tenantOfHost: a };
  before(async () => {
    db = createDb({ pool: 2 }); ops = createPlatformDb({ pool: 2 });
    hash = await hashPassword(password);
    await ops.plan.create({ data: { id: planId, name: "[DỮ LIỆU MẪU] Auth test", features: [], limits: {} } });
    for (const id of [a, b]) {
      await ops.tenant.create({ data: { id, slug: `auth-${tag}-${id.slice(0, 8)}`, name: "[DỮ LIỆU MẪU]", planId } });
      const user = await forTenant(db, id).siteUser.create({ email, name: "[DỮ LIỆU MẪU]", role: "owner", status: "active", passwordHash: hash });
      if (id === a) aUser = user.id; else bUser = user.id;
    }
    adminId = (await forPlatform(ops).platformAdmin.create({ data: { email, name: "[DỮ LIỆU MẪU]", passwordHash: hash } })).id;
    const config = { secret, sessionTtl: 3600_000, idleTtl: 900_000 };
    site = createRealm({ ...config, name: "site", store: siteStore(db, { audience: "admin" }) });
    storefront = createRealm({ ...config, name: "site", store: siteStore(db, { audience: "storefront" }) });
    platform = createRealm({ ...config, name: "platform", store: platformStore(ops) });
  });
  after(async () => {
    try {
      if (ops) {
        await ops.tenant.deleteMany({ where: { id: { in: [a, b] } } });
        await ops.plan.deleteMany({ where: { id: planId } });
        await forPlatform(ops).platformAdmin.deleteMany({ where: { email } });
      }
    } finally { await Promise.all([db?.$disconnect(), ops?.$disconnect()]); }
  });
  async function login(realm = site, tenantId: string | undefined = a) {
    const result = await realm.login({ ...input, tenantId });
    assert.equal(result.ok, true);
    return result;
  }
  test("real table sessions cannot cross realms or tenants even if re-signed for the target realm", async () => {
    const s = await login(), p = await login(platform, undefined);
    assert.equal(await platform.getSession(s.cookie.value), null);
    assert.equal(await site.getSession(p.cookie.value, host), null);
    assert.equal(await site.getSession(s.cookie.value, { tenantOfHost: b }), null);
    const token = p.cookie.value.split(".")[0];
    const reSigned = `${token}.${createHmac("sha256", secret).update(`site:${token}`).digest("base64url")}`;
    assert.equal(await site.getSession(reSigned, host), null);
    const siteToken = s.cookie.value.split(".")[0];
    assert.equal(await platform.getSession(`${siteToken}.${createHmac("sha256", secret).update(`platform:${siteToken}`).digest("base64url")}`), null);
    assert.equal(await storefront.getSession(s.cookie.value, host), null);
    assert.equal((await login(site, b)).session.accountId, bUser);
    const row = await forTenant(db, a).siteSession.first({ where: { id: s.session.id } });
    assert.equal(row!.tokenHash, createHash("sha256").update(siteToken).digest("hex"));
  });
  test("adapter reads current tenant deny/status and hides every authentication secret by default", async () => {
    const s = await login();
    await ops.tenant.update({ where: { id: a }, data: { permissionPolicy: { deny: ["pages.edit"] } } });
    assert.equal((await site.requireSession(s.cookie.value, host)).permissions.has("pages.edit"), false);
    await ops.tenant.update({ where: { id: a }, data: { permissionPolicy: {} } });
    for (const row of [await forTenant(db, a).siteUser.get(aUser), await forPlatform(ops).platformAdmin.findUnique({ where: { id: adminId } })]) {
      for (const key of ["passwordHash", "totpSecret", "totpBackupCodes"]) assert.equal(key in row!, false, key);
    }
    await forTenant(db, a).siteUser.update(aUser, { status: "disabled" });
    assert.equal(await site.getSession(s.cookie.value, host), null);
    await forTenant(db, a).siteUser.update(aUser, { status: "active" });
  });
  test("database backup recovery is one-use under concurrent logins; security mutations rotate and revoke", async () => {
    const s = await login(), other = await login();
    const pending = await site.beginTotp(s.session);
    const enabled = await site.enableTotp(s.session, pending.secret, totp(pending.secret));
    assert.equal(await site.getSession(other.cookie.value, host), null);
    const results = await Promise.all([1, 2].map(() => site.login({ ...input, tenantId: a, totp: enabled.codes[0] })));
    assert.equal(results.filter(r => r.ok).length, 1);
    const disabled = await site.disableTotp(enabled.session, enabled.codes[1]);
    const changed = await site.changePassword(disabled.session, { current: password, next: "Next!password-strong" });
    assert.equal(await site.getSession(disabled.cookie.value, host), null);
    assert.ok(await site.getSession(changed.cookie.value, host));
    await siteStore(db, { audience: "admin" }).updateAccount(aUser, { passwordHash: hash }, a);
    const opsSession = await login(platform, undefined);
    const opsPending = await platform.beginTotp(opsSession.session);
    const opsEnabled = await platform.enableTotp(opsSession.session, opsPending.secret, totp(opsPending.secret));
    const opsResults = await Promise.all([1, 2].map(() => platform.login({ ...input, totp: opsEnabled.codes[0] })));
    assert.equal(opsResults.filter(r => r.ok).length, 1);
    await platform.disableTotp(opsEnabled.session, opsEnabled.codes[1]);
  });
  test("ghost bridge is scoped, detects revoked/expired grants and never exposes platform rows", async () => {
    const token = randomBytes(32).toString("base64url");
    const grant = await forPlatform(ops).ghostGrant.create({ data: { platformAdminId: adminId, targetTenantId: a, reason: "[DỮ LIỆU MẪU]", tokenHash: randomUUID(),
      expiresAt: new Date(Date.now() - 60_000), usedAt: new Date(), sessionExpiresAt: new Date(Date.now() + 600_000) } });
    const ghost = await forTenant(db, a).siteSession.create({ kind: "ghost", audience: "admin", ghostGrantId: grant.id,
      tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: grant.sessionExpiresAt });
    const cookie = `${token}.${createHmac("sha256", secret).update(`site:${token}`).digest("base64url")}`;
    const session = await site.requireSession(cookie, host);
    assert.equal(session.kind, "ghost");
    assert.equal(session.permissions.has("account.password"), false);
    assert.equal(await site.getSession(cookie, { tenantOfHost: b }), null);
    assert.equal(await isGhostSessionActive(db, b, ghost.id), false);
    await forPlatform(ops).ghostGrant.update({ where: { id: grant.id }, data: { sessionExpiresAt: new Date(Date.now() - 1) } });
    assert.equal(await isGhostSessionActive(db, a, ghost.id), false);
    await forPlatform(ops).ghostGrant.update({ where: { id: grant.id }, data: { sessionExpiresAt: grant.sessionExpiresAt } });
    await forPlatform(ops).platformAdmin.update({ where: { id: adminId }, data: { status: "disabled" } });
    assert.equal(await isGhostSessionActive(db, a, ghost.id), false);
    await forPlatform(ops).platformAdmin.update({ where: { id: adminId }, data: { status: "active" } });
    assert.equal(await isGhostSessionActive(db, a, ghost.id), true);
    await forPlatform(ops).ghostGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date() } });
    assert.equal(await site.getSession(cookie, host), null);
  });

  test("both database realms reject concurrent TOTP replay and older steps atomically", async () => {
    for (const [name, store, accountId, tenantId] of [
      ["site", siteStore(db, { audience: "admin" }), aUser, a],
      ["platform", platformStore(ops), adminId, undefined],
    ] as const) {
      let time = 1_900_000_000_000;
      const totpSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
      await store.updateAccount(accountId, { totpSecret, totpLastStep: null }, tenantId);
      const realm = createRealm({ name, store, secret, sessionTtl: 3600_000, idleTtl: 900_000, now: () => time });
      const get = store.getAccount;
      let reads = 0, release!: () => void;
      const ready = new Promise<void>(resolve => { release = resolve; });
      store.getAccount = async (...args) => {
        const account = await get(...args);
        if (++reads <= 5) { if (reads === 5) release(); await ready; }
        return account;
      };
      const attempt = { accountId, tenantId, ip: "totp-race", userAgent: "test" };
      try {
        const results = await Promise.all(Array.from({ length: 5 }, () => realm.loginWithToken({ ...attempt, totp: totp(totpSecret, time) }, async () => true)));
        assert.equal(results.filter(r => r.ok).length, 1, name);
        assert.equal((await get(accountId, tenantId))!.totpLastStep, Math.floor(time / 30_000));
        // An older, never-used code must also fail even though it is inside the skew window.
        assert.equal((await realm.loginWithToken({ ...attempt, totp: totp(totpSecret, time - 30_000) }, async () => true)).ok, false);
        // The previous step is still inside the permitted clock-skew window, but is already obsolete.
        time += 30_000;
        assert.equal((await realm.loginWithToken({ ...attempt, totp: totp(totpSecret, time - 30_000) }, async () => true)).ok, false);
        assert.equal((await realm.loginWithToken({ ...attempt, totp: totp(totpSecret, time) }, async () => true)).ok, true);
        const future = totp(totpSecret, time + 30_000);
        assert.equal((await realm.loginWithToken({ ...attempt, totp: future }, async () => true)).ok, true);
        assert.equal((await realm.loginWithToken({ ...attempt, totp: totp(totpSecret, time) }, async () => true)).ok, false);
        assert.equal((await realm.loginWithToken({ ...attempt, totp: future }, async () => true)).ok, false);
      } finally {
        store.getAccount = get;
        await store.updateAccount(accountId, { totpSecret: null, totpLastStep: null }, tenantId);
      }
    }
  });
});
