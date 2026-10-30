import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { after, before, describe, test } from "node:test";
import { createDb, createPlatformDb, forTenant, forPlatform } from "@solar/db";
import { createRealm, hashPassword, totp, createLoginLimiter } from "@solar/auth";
import { siteStore } from "@solar/auth/db";
import { authorize } from "../lib/gate.ts";
import { createAccounts } from "../lib/accounts.ts";
import { createStaff } from "../lib/staff.ts";

describe("admin authentication with PostgreSQL and RLS", { skip: !process.env.DATABASE_URL || !process.env.PLATFORM_DATABASE_URL ? "requires DATABASE_URL and PLATFORM_DATABASE_URL; Claude chạy cuối PR" : false }, () => {
  let db: ReturnType<typeof createDb>, ops: ReturnType<typeof createPlatformDb>;
  let realm: ReturnType<typeof createRealm>, accounts: ReturnType<typeof createAccounts>;
  let time = Date.now();
  let aUser: string, editor: string, temporary: string, client: string;
  const a = randomUUID(), b = randomUUID(), suffix = randomUUID().slice(0, 8), planId = `admin-${suffix}`;
  const email = "owner@demo.vn", password = "Solar!Strong-password-a", otherPassword = "Solar!Strong-password-b";
  const info = { ip: "integration", userAgent: "node:test" }, secret = "s".repeat(32);
  const host = { tenantOfHost: a };
  const login = (identifier = email, pass = password, tenantId = a, totp?: string) => realm.login({ identifier, password: pass, tenantId, totp, ...info });
  before(async () => {
    db = createDb({ pool: 2 }); ops = createPlatformDb({ pool: 2 });
    await ops.plan.create({ data: { id: planId, name: "[DỮ LIỆU MẪU] Admin test", features: [], limits: {} } });
    for (const [id, pass] of [[a, password], [b, otherPassword]]) {
      await ops.tenant.create({ data: { id, slug: `admin-${suffix}-${id.slice(0, 8)}`, name: "[DỮ LIỆU MẪU]", planId } });
      const user = await forTenant(db, id).siteUser.create({ email, phone: "0901234567", name: "[DỮ LIỆU MẪU]", role: "owner", status: "active", emailVerifiedAt: new Date(), passwordHash: await hashPassword(pass) });
      if (id === a) aUser = user.id;
    }
    await forPlatform(ops).platformAdmin.create({ data: { email: `admin-${suffix}@demo.vn`, name: "[DỮ LIỆU MẪU]", passwordHash: await hashPassword(otherPassword + "-platform") } });
    for (const [role, username] of [["editor", "editor_admin"], ["owner", "nangluongsolar_admin"], ["client", "customer_client"]] as const) {
      const user = await forTenant(db, a).siteUser.create({ name: "[DỮ LIỆU MẪU]", username, role, status: "active", passwordHash: await hashPassword(password),
        mustChangePassword: username === "nangluongsolar_admin", tempPasswordExpiresAt: username === "nangluongsolar_admin" ? new Date(Date.now() + 7 * 86400_000) : null });
      if (role === "editor") editor = user.id; else if (role === "client") client = user.id; else temporary = user.id;
    }
    const limiter = createLoginLimiter({ ipLimit: 500 });
    realm = createRealm({ name: "site", store: siteStore(db, { audience: "admin" }), secret, secure: false, sessionTtl: 7 * 86400_000, idleTtl: 12 * 3600_000, limiter, now: () => time });
    accounts = createAccounts({ db, realm, limiter });
  });
  after(async () => {
    try {
      if (ops) {
        await ops.tenant.deleteMany({ where: { id: { in: [a, b] } } });
        await ops.plan.deleteMany({ where: { id: planId } });
        await forPlatform(ops).platformAdmin.deleteMany({ where: { email: `admin-${suffix}@demo.vn` } });
      }
    } finally { await Promise.all([db?.$disconnect(), ops?.$disconnect()]); }
  });
  test("tenant passwords, platform passwords, client and storefront cookies cannot enter admin", async () => {
    assert.equal((await login(email, otherPassword)).ok, false);
    for (const id of [a, b]) assert.equal((await login(`admin-${suffix}@demo.vn`, otherPassword + "-platform", id)).ok, false);
    assert.equal((await login("customer_client")).ok, false);
    const logged = await login(); assert.equal(logged.ok, true);
    assert.equal(await realm.getSession(logged.cookie.value, { tenantOfHost: b }), null);
    const storefront = createRealm({ name: "site", store: siteStore(db, { audience: "storefront" }), secret, secure: false, sessionTtl: 3600_000, idleTtl: 3600_000 });
    const customer = await storefront.login({ identifier: "customer_client", password, tenantId: a, ...info });
    assert.equal(customer.ok, true); assert.equal(customer.session.accountId, client);
    assert.equal(await realm.getSession(customer.cookie.value, host), null);
    assert.throws(() => authorize(customer.session, a, "dashboard.view"), { status: 401 });
    for (const identifier of ["0901234567", "+84901234567"]) {
      const phone = await login(identifier); assert.equal(phone.ok, true); assert.equal(phone.session.accountId, aUser);
    }
  });
  test("forced password and editor gates fail on the server; expired temporary password is refused", async () => {
    const forced = await login("nangluongsolar_admin"); assert.equal(forced.ok, true);
    assert.ok(authorize(forced.session, a, "account.password"));
    assert.throws(() => authorize(forced.session, a, "dashboard.view"), { status: 403 });
    await forTenant(db, a).siteUser.update(temporary, { tempPasswordExpiresAt: new Date(time - 1) });
    const expired = await login("nangluongsolar_admin"); assert.equal(expired.ok, false); assert.equal(expired.reason, "temp_password_expired");
    assert.equal(await realm.getSession(forced.cookie.value, host), null);
    const edit = await login("editor_admin"); assert.equal(edit.ok, true); assert.equal(edit.session.accountId, editor);
    for (const permission of ["domains.manage", "billing.view", "users.view"] as const) assert.throws(() => authorize(edit.session, a, permission), { status: 403 });
    await ops.tenant.update({ where: { id: a }, data: { permissionPolicy: { deny: ["pages.edit"] } } });
    assert.equal((await realm.getSession(edit.cookie.value, host))!.permissions.has("pages.edit"), false);
    await ops.tenant.update({ where: { id: a }, data: { permissionPolicy: {} } });
  });
  async function issuedToken(purpose: "reset_password" | "magic_link") {
    await accounts.requestLink(a, email, purpose, "http://a.admin.solar.localhost:3300", "mail-test");
    const jobs = await forTenant(db, a).outbox.list({ where: { topic: "mail.send" }, orderBy: { createdAt: "desc" } });
    const payload = jobs[0].payload as { url: string };
    return new URL(payload.url).searchParams.get("token")!;
  }
  test("mail is tenant-scoped and generic; reset is atomic, one-use and revokes all audiences", async () => {
    const generic = await accounts.requestLink(a, "missing@demo.vn", "reset_password", "http://a.admin.solar.localhost:3300", "mail-test");
    assert.equal(await accounts.requestLink(a, "customer_client", "reset_password", "http://a.admin.solar.localhost:3300", "mail-test"), generic);
    const current = await login(); assert.equal(current.ok, true);
    const storefront = createRealm({ name: "site", store: siteStore(db, { audience: "storefront" }), secret, secure: false, sessionTtl: 3600_000, idleTtl: 3600_000 });
    const customerSession = await storefront.login({ identifier: email, password, tenantId: a, ...info });
    assert.equal(customerSession.ok, true);
    const raw = await issuedToken("reset_password");
    const row = await forTenant(db, a).siteToken.first({ where: { tokenHash: createHash("sha256").update(raw).digest("hex") } });
    assert.ok(row); assert.notEqual(row.tokenHash, raw);
    await assert.rejects(accounts.setPassword(b, raw, "Next!Strong-password", "reset_password"));
    const results = await Promise.allSettled([1, 2].map(() => accounts.setPassword(a, raw, "Next!Strong-password", "reset_password")));
    assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
    assert.equal(await realm.getSession(current.cookie.value, host), null);
    assert.equal(await storefront.getSession(customerSession.cookie.value, host), null);
    const changed = await login(email, "Next!Strong-password"); assert.equal(changed.ok, true);
    const restored = await realm.changePassword(changed.session, { current: "Next!Strong-password", next: password });
    assert.ok(await realm.getSession(restored.cookie.value, host));
  });
  test("invite is 72h, tenant-bound, one-use; privileged invite helper rejects editor", async () => {
    const owner = await login(); assert.equal(owner.ok, true);
    const edit = await login("editor_admin"); assert.equal(edit.ok, true);
    const staff = createStaff({ db, realm, limiter: createLoginLimiter() });
    // This auth fixture uses a custom plan; give it a supported users limit and a site.
    await ops.tenant.update({ where: { id: a }, data: { planId: "premium" } });
    await forTenant(db, a).site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const input = { identifier: "staff@demo.vn", name: "[DỮ LIỆU MẪU]", role: "staff" as const };
    await assert.rejects(staff.invite(edit.session, a, input, "http://a.admin.solar.localhost:3300"), { status: 403 });
    await staff.invite(owner.session, a, input, "http://a.admin.solar.localhost:3300");
    const job = await forTenant(db, a).outbox.first({ where: { topic: "mail.send", payload: { path: ["to"], equals: input.identifier } }, orderBy: { createdAt: "desc" } });
    const raw = new URL((job!.payload as { url: string }).url).searchParams.get("token")!;
    const token = await forTenant(db, a).siteToken.first({ where: { purpose: "invite" } });
    assert.ok(Math.abs(token!.expiresAt.getTime() - Date.now() - 72 * 3600_000) < 5000);
    await assert.rejects(accounts.setPassword(b, raw, password, "invite"));
    await accounts.setPassword(a, raw, password, "invite");
    await assert.rejects(accounts.setPassword(a, raw, password, "invite"));
    assert.equal((await login("staff@demo.vn")).ok, true);
  });
  test("reset/invite attempts are rate limited before expensive password hashing", async () => {
    const limited = createAccounts({ db, realm, limiter: createLoginLimiter({ maxFailures: 1 }) });
    const raw = "a".repeat(43);
    await assert.rejects(limited.setPassword(a, raw, password, "reset_password", "reset-limit"), { status: 400 });
    await assert.rejects(limited.setPassword(a, raw, password, "reset_password", "reset-limit"), { status: 429 });
  });
  test("owner enables optional TOTP; magic requires second factor; backup and magic are one-use", async () => {
    const owner = await login(); assert.equal(owner.ok, true);
    const pending = await realm.beginTotp(owner.session);
    const enabled = await realm.enableTotp(owner.session, pending.secret, totp(pending.secret, time));
    time += 30_000;
    const challenge = await login(); assert.equal(challenge.ok, false); assert.equal(challenge.reason, "totp_required");
    assert.equal((await login(email, password, a, totp(pending.secret, time))).ok, true);
    const raw = await issuedToken("magic_link");
    const magic = await accounts.redeemMagic(a, raw, undefined, info); assert.equal(magic.ok, false); assert.equal(magic.reason, "totp_required");
    assert.equal((await accounts.redeemMagic(b, raw, totp(pending.secret, time), info)).ok, false);
    assert.equal((await accounts.redeemMagic(a, raw, enabled.codes[0], info)).ok, true);
    assert.equal((await accounts.redeemMagic(a, raw, totp(pending.secret, time), info)).ok, false);
    assert.equal((await login(email, password, a, enabled.codes[0])).ok, false);
    await realm.disableTotp(enabled.session, enabled.codes[1]);
  });
});
