import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { parseLoginId, type LoginId } from "./loginId.ts";
import { hashPassword, verifyPassword, dummyVerify, checkPasswordPolicy } from "./password.ts";
import { consumeBackupCode, generateBackupCodes, generateTotpSecret, otpauthUri, verifyTotp } from "./totp.ts";
import { effectivePermissions, ForbiddenError, type Audience, type Permission, type Role, type SessionKind } from "./permissions.ts";
import { createLoginLimiter, type LoginLimiter } from "./rateLimit.ts";

export type RealmName = "site" | "platform";
export interface Account {
  id: string; tenantId?: string; email?: string | null; phone?: string | null; username?: string | null; name: string;
  status: "active" | "invited" | "unverified" | "locked" | "disabled"; role?: Role; passwordHash: string | null; totpSecret: string | null; totpBackupCodes: string[];
  mustChangePassword: boolean; tempPasswordExpiresAt: Date | null;
}
export type AccountPatch = Partial<Pick<Account, "passwordHash" | "totpSecret" | "totpBackupCodes" | "mustChangePassword" | "tempPasswordExpiresAt" | "status" | "role">>;
export type AccountExpected = Partial<Pick<Account, "passwordHash" | "totpSecret" | "totpBackupCodes">>;
export interface StoredSession {
  id: string; tokenHash: string; tenantId?: string; accountId?: string; kind: SessionKind; audience?: Audience;
  expiresAt: Date; lastSeenAt: Date; ip?: string; userAgent?: string; policy?: unknown; ghostValid?: boolean;
}
export interface SessionStore {
  readonly realm: RealmName;
  readonly audience?: Audience;
  findAccount(loginId: LoginId, tenantId?: string): Promise<Account | null>;
  getAccount(id: string, tenantId?: string): Promise<Account | null>;
  updateAccount(id: string, data: AccountPatch, tenantId?: string, expected?: AccountExpected): Promise<boolean>;
  createSession(input: Omit<StoredSession, "id">): Promise<StoredSession>;
  findSession(tokenHash: string, tenantId?: string): Promise<StoredSession | null>;
  updateSession(id: string, data: Partial<Pick<StoredSession, "tokenHash" | "lastSeenAt" | "ghostValid">>, tenantId?: string, expectedHash?: string): Promise<boolean>;
  deleteSession(id: string, tenantId?: string): Promise<void>;
  revokeAll(accountId: string, options: { tenantId?: string; except?: string }): Promise<void>;
}
export interface Session {
  id: string; realm: RealmName; tenantId?: string; accountId?: string; kind: SessionKind; audience?: Audience; role?: Role;
  mustChangePassword: boolean; permissions: ReadonlySet<Permission>; expiresAt: Date;
}
export class UnauthenticatedError extends Error {
  readonly status = 401;
  constructor() { super("Vui lòng đăng nhập lại"); }
}
export class MustChangePasswordError extends Error {
  readonly status = 403;
  constructor() { super("Vui lòng đổi mật khẩu trước khi tiếp tục"); }
}
export type HostContext = { tenantOfHost?: string };
type LoginFailure = { ok: false; reason: "invalid_credentials" | "locked" | "totp_required" | "temp_password_expired"; message: string; retryAfterSec?: number };
const invalid = (): LoginFailure => ({ ok: false, reason: "invalid_credentials", message: "Thông tin đăng nhập không đúng" });
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function createRealm({ name, cookieName, secret, sessionTtl, idleTtl, store, limiter = createLoginLimiter(), now = Date.now, secure = true }: {
  name: RealmName; cookieName?: string; secret: string; sessionTtl: number; idleTtl: number; store: SessionStore;
  limiter?: LoginLimiter; now?: () => number; secure?: boolean;
}) {
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("Session secret cần ít nhất 32 byte");
  if (name !== "site" && name !== "platform" || store.realm !== name || name === "site" && !store.audience) throw new Error("Session store realm/audience mismatch");
  if (![sessionTtl, idleTtl].every(n => Number.isSafeInteger(n) && n > 0)) throw new Error("Invalid session TTL");
  if (cookieName && !/^(?:__Host-)?[A-Za-z0-9_-]+$/.test(cookieName)) throw new Error("Invalid cookie name");
  const handles = new WeakMap<Session, { cookie: string; host: HostContext }>();
  function cookieOptions(options: { secure?: boolean } = {}) {
    const isSecure = options.secure ?? secure;
    const base = (cookieName ?? `${name}_sid`).replace(/^__Host-/, "");
    return { name: isSecure ? `__Host-${base}` : base, httpOnly: true as const, secure: isSecure, sameSite: "lax" as const, path: "/" as const, maxAge: Math.floor(sessionTtl / 1000) };
  }
  function sign(token: string) { return `${token}.${createHmac("sha256", secret).update(`${name}:${token}`).digest("base64url")}`; }
  function tokenHash(value: string | null | undefined): string | null {
    if (!value || !/^[A-Za-z0-9_-]{43}\.[A-Za-z0-9_-]{43}$/.test(value)) return null;
    const [token, mac] = value.split(".");
    const expected = sign(token).split(".")[1];
    return timingSafeEqual(Buffer.from(expected), Buffer.from(mac)) ? sha256(token) : null;
  }
  function eligible(account: Account) {
    return account.status === "active" && (name === "platform" || !!account.role && !(store.audience === "admin" && account.role === "client"));
  }
  async function read(cookie: string | null | undefined, host: HostContext = {}) {
    const hash = tokenHash(cookie);
    if (!hash || name === "site" && !host.tenantOfHost) return null;
    const row = await store.findSession(hash, name === "site" ? host.tenantOfHost : undefined);
    if (!row || row.tokenHash !== hash || name === "site" && (row.tenantId !== host.tenantOfHost || row.audience !== store.audience)) return null;
    if (row.expiresAt.getTime() <= now() || row.lastSeenAt.getTime() + idleTtl <= now() || row.kind === "ghost" && (name !== "site" || !row.ghostValid)) {
      await store.deleteSession(row.id, row.tenantId);
      return null;
    }
    const account = row.accountId ? await store.getAccount(row.accountId, row.tenantId) : null;
    if (row.kind === "user" && (!account || !eligible(account) || account.tempPasswordExpiresAt && account.tempPasswordExpiresAt.getTime() <= now())) return null;
    return { row, account };
  }
  async function getSession(cookie: string | null | undefined, host: HostContext = {}): Promise<Session | null> {
    const found = await read(cookie, host);
    if (!found) return null;
    const { row, account } = found;
    if (row.lastSeenAt.getTime() + 60_000 <= now()) {
      if (!await store.updateSession(row.id, { lastSeenAt: new Date(now()) }, row.tenantId, row.tokenHash)) return null;
    }
    const session: Session = {
      id: row.id, realm: name, tenantId: row.tenantId, accountId: row.accountId, kind: row.kind, audience: row.audience,
      role: account?.role ?? (row.kind === "ghost" ? "owner" : undefined), mustChangePassword: account?.mustChangePassword ?? false,
      permissions: name === "site" ? effectivePermissions({ role: account?.role ?? "owner", kind: row.kind, audience: row.audience!, policy: row.policy }) : new Set(),
      expiresAt: row.expiresAt,
    };
    handles.set(session, { cookie: cookie!, host });
    return session;
  }
  async function requireSession(cookie: string | null | undefined, options: HostContext & { allowMustChange?: boolean } = {}): Promise<Session> {
    const session = await getSession(cookie, options);
    if (!session) throw new UnauthenticatedError();
    if (session.mustChangePassword && !options.allowMustChange) throw new MustChangePasswordError();
    return session;
  }
  function cookie(value: string, expiresAt: Date) {
    return { ...cookieOptions(), maxAge: Math.max(0, Math.floor((expiresAt.getTime() - now()) / 1000)), value };
  }
  async function issued(value: string, host: HostContext) {
    const session = await getSession(value, host);
    if (!session) throw new UnauthenticatedError();
    return { cookie: cookie(value, session.expiresAt), session };
  }
  async function login(input: { identifier: string; password: string; totp?: string; tenantId?: string; ip: string; userAgent: string }): Promise<LoginFailure | ({ ok: true } & Awaited<ReturnType<typeof issued>>)> {
    let id: LoginId | undefined;
    try { id = parseLoginId(input.identifier); } catch { /* Invalid identifiers share the generic login response and limiter. */ }
    const attempt = { realm: name, tenantId: name === "site" ? input.tenantId : undefined, identifier: id?.value ?? input.identifier.trim().toLowerCase().slice(0, 254), ip: input.ip };
    const limit = await limiter.check(attempt);
    if (!limit.ok) return { ok: false, reason: "locked", retryAfterSec: limit.retryAfterSec, message: `Tạm khóa đăng nhập, thử lại sau ${Math.ceil(limit.retryAfterSec / 60)} phút` };
    async function fail() { await limiter.fail(attempt); return invalid(); }
    const account = id && (name === "site" ? !!input.tenantId : id.kind === "email") ? await store.findAccount(id, attempt.tenantId) : null;
    if (!account?.passwordHash) { await dummyVerify(); return fail(); }
    const passwordOk = await verifyPassword(input.password, account.passwordHash);
    if (!passwordOk || !eligible(account)) return fail();
    if (account.tempPasswordExpiresAt && account.tempPasswordExpiresAt.getTime() <= now()) return { ok: false, reason: "temp_password_expired", message: "Mật khẩu tạm đã hết hạn, vui lòng liên hệ hỗ trợ" };
    if (account.totpSecret) {
      if (!input.totp) return { ok: false, reason: "totp_required", message: "Vui lòng nhập mã xác thực hai bước" };
      if (!verifyTotp(account.totpSecret, input.totp, now())) {
        const codes = consumeBackupCode(account.totpBackupCodes, input.totp);
        if (!codes || !await store.updateAccount(account.id, { totpBackupCodes: codes }, account.tenantId, { totpSecret: account.totpSecret, totpBackupCodes: account.totpBackupCodes })) return fail();
      }
    }
    const token = randomBytes(32).toString("base64url");
    await store.createSession({ tokenHash: sha256(token), tenantId: account.tenantId, accountId: account.id, kind: "user", audience: store.audience,
      expiresAt: new Date(now() + sessionTtl), lastSeenAt: new Date(now()), ip: input.ip, userAgent: input.userAgent });
    await limiter.succeed(attempt);
    return { ok: true, ...await issued(sign(token), { tenantOfHost: account.tenantId }) };
  }
  async function logout(value: string | null | undefined, host: HostContext = {}) {
    const hash = tokenHash(value);
    if (!hash || name === "site" && !host.tenantOfHost) return;
    const row = await store.findSession(hash, name === "site" ? host.tenantOfHost : undefined);
    if (row) await store.deleteSession(row.id, row.tenantId);
  }
  async function securitySession(session: Session, permission: "account.password" | "account.totp", allowMustChange = false) {
    // Only handles returned by this realm are accepted; reload status, permissions and revocation for every mutation.
    const handle = handles.get(session);
    if (!handle) throw new UnauthenticatedError();
    const current = await requireSession(handle.cookie, { ...handle.host, allowMustChange });
    const required = current.audience === "storefront" ? "storefront.account" : permission;
    if (current.kind === "ghost" || name === "site" && !current.permissions.has(required)) throw new ForbiddenError();
    const found = await read(handle.cookie, handle.host);
    if (!found?.account) throw new UnauthenticatedError();
    return { ...found, account: found.account, handle };
  }
  async function rotateRow(row: StoredSession) {
    const token = randomBytes(32).toString("base64url");
    if (!await store.updateSession(row.id, { tokenHash: sha256(token), lastSeenAt: new Date(now()) }, row.tenantId, row.tokenHash)) throw new UnauthenticatedError();
    return issued(sign(token), { tenantOfHost: row.tenantId });
  }
  async function rotate(value: string, host: HostContext = {}) {
    const session = await requireSession(value, host);
    if (session.kind === "ghost") throw new ForbiddenError();
    const found = await read(value, host);
    if (!found) throw new UnauthenticatedError();
    return rotateRow(found.row);
  }
  async function revokeAll(accountId: string, options: { tenantId?: string; except?: string } = {}) {
    if (name === "site" && !options.tenantId) throw new Error("tenantId is required");
    return store.revokeAll(accountId, options);
  }
  async function changePassword(session: Session, input: { current: string; next: string }) {
    const { row, account } = await securitySession(session, "account.password", true);
    const attempt = { realm: name, tenantId: row.tenantId, identifier: `security:${account.id}`, ip: row.ip ?? "unknown" };
    if (!(await limiter.check(attempt)).ok) throw new ForbiddenError();
    if (!account.mustChangePassword && (!account.passwordHash || !await verifyPassword(input.current, account.passwordHash))) { await limiter.fail(attempt); throw new ForbiddenError(); }
    const policy = checkPasswordPolicy(input.next, { identifiers: [account.email, account.phone, account.username].filter((s): s is string => !!s) });
    if (!policy.ok) throw new Error(policy.reason);
    if (!await store.updateAccount(account.id, { passwordHash: await hashPassword(input.next), mustChangePassword: false, tempPasswordExpiresAt: null }, row.tenantId, { passwordHash: account.passwordHash })) throw new UnauthenticatedError();
    await revokeAll(account.id, { tenantId: row.tenantId, except: row.id });
    await limiter.succeed(attempt);
    return rotateRow(row);
  }
  async function beginTotp(session: Session) {
    const { account } = await securitySession(session, "account.totp");
    if (account.totpSecret) throw new ForbiddenError();
    const secret = generateTotpSecret();
    return { secret, uri: otpauthUri({ issuer: `Solar ${name}`, account: account.email ?? account.username ?? account.phone ?? account.id, secret }) };
  }
  async function enableTotp(session: Session, secret: string, code: string) {
    const { row, account } = await securitySession(session, "account.totp");
    if (account.totpSecret || !/^[A-Z2-7]{32}$/.test(secret) || !verifyTotp(secret, code, now())) throw new ForbiddenError();
    const { codes, hashes } = generateBackupCodes();
    if (!await store.updateAccount(account.id, { totpSecret: secret, totpBackupCodes: hashes }, row.tenantId, { totpSecret: null })) throw new ForbiddenError();
    await revokeAll(account.id, { tenantId: row.tenantId, except: row.id });
    return { codes, ...await rotateRow(row) };
  }
  async function disableTotp(session: Session, code: string) {
    const { row, account } = await securitySession(session, "account.totp");
    const attempt = { realm: name, tenantId: row.tenantId, identifier: `security:${account.id}`, ip: row.ip ?? "unknown" };
    if (!(await limiter.check(attempt)).ok) throw new ForbiddenError();
    if (!account.totpSecret || !verifyTotp(account.totpSecret, code, now()) && !consumeBackupCode(account.totpBackupCodes, code)) { await limiter.fail(attempt); throw new ForbiddenError(); }
    if (!await store.updateAccount(account.id, { totpSecret: null, totpBackupCodes: [] }, row.tenantId, { totpSecret: account.totpSecret, totpBackupCodes: account.totpBackupCodes })) throw new ForbiddenError();
    await revokeAll(account.id, { tenantId: row.tenantId, except: row.id });
    await limiter.succeed(attempt);
    return rotateRow(row);
  }
  return { cookieOptions, login, logout, getSession, requireSession, rotate, revokeAll, changePassword, beginTotp, enableTotp, disableTotp };
}
