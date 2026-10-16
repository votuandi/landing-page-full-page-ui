import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { before, test } from "node:test";
import { createRealm, UnauthenticatedError, MustChangePasswordError } from "../realm.ts";
import { memoryStore } from "../memoryStore.ts";
import { hashPassword } from "../password.ts";
import { createLoginLimiter, memoryCounter } from "../rateLimit.ts";
import { ForbiddenError } from "../permissions.ts";
import { totp } from "../totp.ts";

let passwordHash: string;
const password = "Solar!password-strong", secret = "s".repeat(32);
before(async () => { passwordHash = await hashPassword(password); });
function setup(options: { forced?: boolean; role?: "owner" | "client"; audience?: "admin" | "storefront" } = {}) {
  let time = 1_900_000_000_000;
  const accounts = ["a", "b"].map(tenantId => ({ id: `user-${tenantId}`, tenantId, email: "a@x.vn", phone: "0901234567", username: "solar_admin", name: "[DỮ LIỆU MẪU]", role: options.role ?? "owner" as const,
    status: "active" as const, passwordHash, totpSecret: null, totpLastStep: null, totpBackupCodes: [], mustChangePassword: options.forced ?? false, tempPasswordExpiresAt: null }));
  const store = memoryStore({ realm: "site", audience: options.audience ?? "admin", accounts });
  const realm = createRealm({ name: "site", secret, sessionTtl: 86_400_000, idleTtl: 300_000, store,
    limiter: createLoginLimiter({ fallback: memoryCounter(() => time) }), now: () => time });
  const input = { identifier: "A@X.vn", password, tenantId: "a", ip: "ip", userAgent: "test" };
  const host = { tenantOfHost: "a" };
  async function login() { const result = await realm.login(input); assert.equal(result.ok, true); return result; }
  return { realm, store, input, host, login, now: () => time, advance: (ms: number) => { time += ms; } };
}

test("verified one-use token login checks tenant, status, TOTP and atomic consumption before issuing a session", async () => {
  const t = setup();
  const input = { accountId: "user-a", tenantId: "a", ip: "ip", userAgent: "test" };
  const denied = await t.realm.loginWithToken(input, async () => false);
  assert.equal(denied.ok, false);
  const logged = await t.login();
  const pending = await t.realm.beginTotp(logged.session);
  await t.realm.enableTotp(logged.session, pending.secret, totp(pending.secret, t.now()));
  t.advance(30_000);
  let used = false;
  const consume = async () => { if (used) return false; used = true; return true; };
  const challenge = await t.realm.loginWithToken(input, consume);
  assert.equal(challenge.ok, false);
  if (!challenge.ok) assert.equal(challenge.reason, "totp_required");
  assert.equal(used, false);
  assert.equal((await t.realm.loginWithToken({ ...input, totp: "bad" }, consume)).ok, false);
  assert.equal(used, false);
  assert.equal((await t.realm.loginWithToken({ ...input, totp: totp(pending.secret, t.now()) }, consume)).ok, true);
  assert.equal((await t.realm.loginWithToken({ ...input, totp: totp(pending.secret, t.now()) }, consume)).ok, false);
  assert.equal((await t.realm.loginWithToken({ ...input, tenantId: "b" }, async () => true)).ok, false);
  const client = setup({ role: "client" });
  assert.equal((await client.realm.loginWithToken(input, async () => true)).ok, false);
});

test("cookie is host-only and signed; realm/secret/host/audience confusion fails closed", async () => {
  const t = setup(), logged = await t.login();
  assert.deepEqual(t.realm.cookieOptions(), { name: "__Host-site_sid", httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 86400 });
  assert.equal(t.realm.cookieOptions({ secure: false }).name, "site_sid");
  assert.equal("domain" in t.realm.cookieOptions(), false);
  const token = logged.cookie.value.split(".")[0];
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  const hash = createHash("sha256").update(token).digest("hex");
  assert.ok(await t.store.findSession(hash, "a"));
  assert.equal(await t.realm.getSession(logged.cookie.value), null);
  assert.equal(await t.realm.getSession(logged.cookie.value, { tenantOfHost: "b" }), null);
  assert.equal(await t.realm.getSession(logged.cookie.value + "x", t.host), null);
  const platform = createRealm({ name: "platform", secret, sessionTtl: 3600_000, idleTtl: 600_000,
    store: memoryStore({ realm: "platform", accounts: [{ id: "ops", email: "ops@x.vn", name: "Ops", status: "active", passwordHash, totpSecret: null, totpLastStep: null, totpBackupCodes: [], mustChangePassword: false, tempPasswordExpiresAt: null }] }) });
  assert.equal(await platform.getSession(logged.cookie.value), null);
  const ops = await platform.login({ identifier: "ops@x.vn", password, ip: "ip", userAgent: "test" });
  assert.equal(ops.ok, true);
  if (!ops.ok) return;
  assert.equal(await t.realm.getSession(ops.cookie.value, t.host), null);
  // Even a correctly re-signed foreign token has no row in the other realm's store.
  const foreignToken = ops.cookie.value.split(".")[0];
  const signedForSite = `${foreignToken}.${createHmac("sha256", secret).update(`site:${foreignToken}`).digest("base64url")}`;
  assert.equal(await t.realm.getSession(signedForSite, t.host), null);
  const wrongSecret = createRealm({ name: "site", secret: "z".repeat(32), sessionTtl: 3600_000, idleTtl: 300_000, store: t.store });
  assert.equal(await wrongSecret.getSession(logged.cookie.value, t.host), null);
  assert.throws(() => createRealm({ name: "site", secret: "", sessionTtl: 1, idleTtl: 1, store: t.store }));
  assert.throws(() => createRealm({ name: "platform", secret, sessionTtl: 1, idleTtl: 1, store: t.store }));
});

test("sessions expire, touch at most once per minute, rotate and revoke", async () => {
  const t = setup(), logged = await t.login();
  const tokenHash = createHash("sha256").update(logged.cookie.value.split(".")[0]).digest("hex");
  const initial = (await t.store.findSession(tokenHash, "a"))!.lastSeenAt.getTime();
  t.advance(59_000);
  assert.ok(await t.realm.getSession(logged.cookie.value, t.host));
  assert.equal((await t.store.findSession(tokenHash, "a"))!.lastSeenAt.getTime(), initial);
  t.advance(1000);
  assert.ok(await t.realm.getSession(logged.cookie.value, t.host));
  assert.equal((await t.store.findSession(tokenHash, "a"))!.lastSeenAt.getTime(), t.now());
  const rotated = await t.realm.rotate(logged.cookie.value, t.host);
  assert.equal(await t.realm.getSession(logged.cookie.value, t.host), null);
  assert.ok(await t.realm.getSession(rotated.cookie.value, t.host));
  t.advance(300_000);
  assert.equal(await t.realm.getSession(rotated.cookie.value, t.host), null);
  const first = await t.login(), second = await t.login();
  await t.realm.revokeAll("user-a", { tenantId: "a", except: first.session.id });
  assert.equal(await t.realm.getSession(second.cookie.value, t.host), null);
  await t.realm.logout(first.cookie.value, t.host);
  assert.equal(await t.realm.getSession(first.cookie.value, t.host), null);
  const expiry = await t.login();
  t.advance(86_400_000);
  assert.equal(await t.realm.getSession(expiry.cookie.value, t.host), null);
});

test("bad MAC never reads storage; parallel rotation issues only one usable token", async () => {
  const t = setup(), logged = await t.login();
  const find = t.store.findSession;
  let reads = 0;
  t.store.findSession = async (...args) => { reads++; return find(...args); };
  assert.equal(await t.realm.getSession(logged.cookie.value.slice(0, -2) + "!!", t.host), null);
  assert.equal(reads, 0);
  const rotations = await Promise.allSettled([1, 2].map(() => t.realm.rotate(logged.cookie.value, t.host)));
  assert.equal(rotations.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(await t.realm.getSession(logged.cookie.value, t.host), null);
});

test("five incorrect logins lock A, B still logs in; unknown/disabled/invalid IDs have generic errors", async () => {
  const t = setup();
  for (let i = 0; i < 5; i++) assert.deepEqual(await t.realm.login({ ...t.input, password: "wrong" }), { ok: false, reason: "invalid_credentials", message: "Thông tin đăng nhập không đúng" });
  const locked = await t.realm.login(t.input);
  assert.equal(locked.ok, false);
  if (!locked.ok) assert.equal(locked.reason, "locked");
  assert.equal((await t.realm.login({ ...t.input, tenantId: "b" })).ok, true);
  t.advance(900_000);
  assert.equal((await t.realm.login(t.input)).ok, true);
  for (const identifier of ["unknown@x.vn", "!invalid", ""]) {
    const result = await t.realm.login({ ...t.input, identifier });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.message, "Thông tin đăng nhập không đúng");
  }
  await t.store.updateAccount("user-a", { status: "disabled" }, "a");
  assert.equal((await t.realm.login(t.input)).ok, false);
});

test("40 parallel incorrect logins reserve at most five password verifications", async () => {
  const t = setup();
  let verifications = 0;
  // Password is read only when passed to scrypt verification, after reserving both counters.
  const input = { ...t.input, get password() { verifications++; return "wrong"; } };
  const results = await Promise.all(Array.from({ length: 40 }, () => t.realm.login(input)));
  assert.equal(results.filter(r => !r.ok && r.reason === "invalid_credentials").length, 5);
  assert.equal(results.filter(r => !r.ok && r.reason === "locked").length, 35);
  assert.equal(verifications, 5);
});

test("email, phone and username share one account budget; unknown identifiers still lock", async () => {
  const t = setup();
  for (const identifier of ["a@x.vn", "solar_admin", "0901234567", "+84901234567", "A@X.VN"]) {
    const result = await t.realm.login({ ...t.input, identifier, password: "wrong" });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "invalid_credentials");
  }
  for (const identifier of ["a@x.vn", "solar_admin", "0901234567"]) {
    const result = await t.realm.login({ ...t.input, identifier });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.reason, "locked");
  }
  const results = await Promise.all(Array.from({ length: 20 }, () => t.realm.login({ ...t.input, identifier: "missing@x.vn" })));
  assert.equal(results.filter(r => !r.ok && r.reason === "invalid_credentials").length, 5);
  assert.equal(results.filter(r => !r.ok && r.reason === "locked").length, 15);
});

test("TOTP rejects replay, older steps and concurrent reuse across password/token login", async () => {
  const t = setup(), logged = await t.login();
  const pending = await t.realm.beginTotp(logged.session);
  const code = () => totp(pending.secret, t.now());
  const enabled = await t.realm.enableTotp(logged.session, pending.secret, code());
  assert.equal((await t.realm.login({ ...t.input, totp: code() })).ok, false);
  await assert.rejects(t.realm.disableTotp(enabled.session, code()), ForbiddenError);
  t.advance(30_000);
  let consumed = 0;
  const results = await Promise.all([
    t.realm.login({ ...t.input, totp: code() }),
    t.realm.loginWithToken({ accountId: "user-a", tenantId: "a", ip: "ip", userAgent: "test", totp: code() }, async () => { consumed++; return true; }),
  ]);
  assert.equal(results.filter(r => r.ok).length, 1);
  assert.equal(consumed, results[1].ok ? 1 : 0);
  assert.equal((await t.realm.login({ ...t.input, totp: code() })).ok, false);
  assert.equal((await t.realm.login({ ...t.input, totp: totp(pending.secret, t.now() - 30_000) })).ok, false);
  t.advance(30_000);
  assert.equal((await t.realm.login({ ...t.input, totp: code() })).ok, true);
});

test("client cannot log in to admin; existing sessions observe account status and role", async () => {
  assert.equal((await setup({ role: "client" }).realm.login(setup().input)).ok, false);
  const storefront = setup({ role: "client", audience: "storefront" });
  const sf = await storefront.login();
  assert.deepEqual([...sf.session.permissions], ["storefront.account", "storefront.cart", "storefront.booking"]);
  const t = setup(), logged = await t.login();
  await t.store.updateAccount("user-a", { role: "client" }, "a");
  assert.equal(await t.realm.getSession(logged.cookie.value, t.host), null);
});

test("forced password change blocks other calls, rotates current session and revokes others", async () => {
  const t = setup({ forced: true }), a = await t.login(), b = await t.login();
  await assert.rejects(t.realm.requireSession(a.cookie.value, t.host), MustChangePasswordError);
  const session = await t.realm.requireSession(a.cookie.value, { ...t.host, allowMustChange: true });
  await assert.rejects(t.realm.beginTotp(session), MustChangePasswordError);
  await assert.rejects(t.realm.rotate(a.cookie.value, t.host), MustChangePasswordError);
  await assert.rejects(t.realm.changePassword(session, { current: "", next: "password123" }));
  const changed = await t.realm.changePassword(session, { current: "", next: "New!password-strong" });
  assert.equal(await t.realm.getSession(a.cookie.value, t.host), null);
  assert.equal(await t.realm.getSession(b.cookie.value, t.host), null);
  assert.equal((await t.realm.requireSession(changed.cookie.value, t.host)).mustChangePassword, false);
  assert.equal((await t.realm.login({ ...t.input, password: "New!password-strong" })).ok, true);
  await assert.rejects(t.realm.changePassword(changed.session, { current: "wrong", next: "Another!password-strong" }));
  await t.store.updateAccount("user-a", { tempPasswordExpiresAt: new Date(t.now() - 1) }, "a");
  const expired = await t.realm.login({ ...t.input, password: "New!password-strong" });
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.reason, "temp_password_expired");
});

test("TOTP setup/login, atomic one-use backup recovery, disable and revoked handles", async () => {
  const t = setup(), logged = await t.login();
  const pending = await t.realm.beginTotp(logged.session);
  assert.equal((await t.store.getAccount("user-a", "a"))!.totpSecret, null);
  const enabled = await t.realm.enableTotp(logged.session, pending.secret, totp(pending.secret, t.now()));
  assert.equal(await t.realm.getSession(logged.cookie.value, t.host), null);
  const missing = await t.realm.login(t.input);
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.reason, "totp_required");
  assert.equal((await t.realm.login({ ...t.input, totp: "bad" })).ok, false);
  const results = await Promise.all([1, 2].map(() => t.realm.login({ ...t.input, totp: enabled.codes[0] })));
  assert.equal(results.filter(r => r.ok).length, 1);
  const current = await t.realm.requireSession(enabled.cookie.value, t.host);
  await assert.rejects(t.realm.enableTotp(current, pending.secret, totp(pending.secret, t.now())), ForbiddenError);
  const disabled = await t.realm.disableTotp(current, enabled.codes[1]);
  assert.equal((await t.store.getAccount("user-a", "a"))!.totpSecret, null);
  assert.equal((await t.realm.login(t.input)).ok, true);
  await t.realm.logout(disabled.cookie.value, t.host);
  await assert.rejects(t.realm.beginTotp(disabled.session), UnauthenticatedError);
});

test("ghost grants are read-only auth handles; expired or revoked grants fail closed", async () => {
  const t = setup();
  const token = "a".repeat(43), tokenHash = createHash("sha256").update(token).digest("hex");
  const row = await t.store.createSession({ tokenHash, tenantId: "a", kind: "ghost", audience: "admin", ghostValid: true, expiresAt: new Date(t.now() + 600_000), lastSeenAt: new Date(t.now()) });
  const cookie = `${token}.${createHmac("sha256", secret).update(`site:${token}`).digest("base64url")}`;
  const session = await t.realm.requireSession(cookie, t.host);
  assert.equal(session.permissions.has("account.password"), false);
  await assert.rejects(t.realm.changePassword(session, { current: password, next: "Changed!password" }), ForbiddenError);
  await assert.rejects(t.realm.beginTotp(session), ForbiddenError);
  await assert.rejects(t.realm.rotate(cookie, t.host), ForbiddenError);
  await t.store.updateSession(row.id, { ghostValid: false }, "a");
  assert.equal(await t.realm.getSession(cookie, t.host), null);
});
