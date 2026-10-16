import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { withTenantTransaction, type Db, type SiteTokenPurpose } from "@solar/db";
import { checkPasswordPolicy, hashPassword, parseLoginId, type createRealm, type LoginLimiter, type Session } from "@solar/auth";
import { authorize } from "./gate.ts";

export class AccountInputError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}
const invalidToken = () => new AccountInputError("Link không hợp lệ, đã dùng hoặc đã hết hạn. Vui lòng yêu cầu link mới.");
const digest = (raw: string) => createHash("sha256").update(raw).digest("hex");
const tokenShape = /^[A-Za-z0-9_-]{43}$/;
const genericMail = "Nếu tài khoản tồn tại và có email đã xác minh, chúng tôi đã gửi link. Nếu chỉ dùng số điện thoại, hãy nhờ chủ site, quản trị viên hoặc bộ phận hỗ trợ cấp link đặt lại.";
const inviteSchema = z.object({ email: z.email().max(254).transform(v => v.trim().toLowerCase()), name: z.string().trim().min(1).max(100), role: z.enum(["admin", "editor", "staff", "viewer"]) });

export function createAccounts({ db, realm, limiter, now = Date.now }: { db: Db; realm: ReturnType<typeof createRealm>; limiter: LoginLimiter; now?: () => number }) {
  async function requestLink(tenantId: string, identifier: string, purpose: "reset_password" | "magic_link", origin: string, ip: string) {
    let id: ReturnType<typeof parseLoginId>;
    try { id = parseLoginId(identifier); } catch { return genericMail; }
    const attempt = { realm: "site" as const, tenantId, identifier: `mail:${id.value}`, ip };
    if (!(await limiter.check(attempt)).ok) return genericMail;
    // Count every request, including successful mail enqueue, to bound email flooding.
    await limiter.fail(attempt);
    await withTenantTransaction(db, tenantId, async repo => {
      const user = await repo.siteUser.first({ where: { [id.kind]: id.value }, include: { tenant: true } });
      if (!user || user.role === "client" || user.status !== "active" || !["active", "trial"].includes(user.tenant.status) || !user.email || !user.emailVerifiedAt) return;
      const raw = randomBytes(32).toString("base64url");
      const token = await repo.siteToken.create({ siteUserId: user.id, purpose, tokenHash: digest(raw), expiresAt: new Date(now() + (purpose === "reset_password" ? 3600_000 : 900_000)) });
      const path = purpose === "reset_password" ? "/dat-lai-mat-khau" : "/auth/magic";
      await repo.outbox.create({ topic: "mail.send", idempotencyKey: `auth:${token.id}`, payload: { to: user.email, template: purpose, url: `${origin}${path}?token=${raw}` } });
    });
    return genericMail;
  }
  async function setPassword(tenantId: string, raw: string, password: string, purpose: "reset_password" | "invite", ip = "unknown") {
    if (!tokenShape.test(raw)) throw invalidToken();
    const attempt = { realm: "site" as const, tenantId, identifier: `${purpose}:${digest(raw)}`, ip };
    if (!(await limiter.check(attempt)).ok) throw new AccountInputError("Tạm khóa yêu cầu, vui lòng thử lại sau 15 phút", 429);
    await limiter.fail(attempt);
    // Hash outside the transaction, then compare-and-swap both token and account inside it.
    const policy = checkPasswordPolicy(password);
    if (!policy.ok) throw new AccountInputError(policy.reason);
    const passwordHash = await hashPassword(password);
    return withTenantTransaction(db, tenantId, async repo => {
      const token = await repo.siteToken.first({ where: { tokenHash: digest(raw), purpose, usedAt: null, expiresAt: { gt: new Date(now()) } } });
      if (!token) throw invalidToken();
      const user = await repo.siteUser.first({ where: { id: token.siteUserId }, include: { tenant: true } });
      if (!user || user.role === "client" || user.status !== (purpose === "invite" ? "invited" : "active") || !["active", "trial"].includes(user.tenant.status)) throw invalidToken();
      const identifiers = [user.email, user.phone, user.username].filter((s): s is string => !!s);
      const checked = checkPasswordPolicy(password, { identifiers });
      if (!checked.ok) throw new AccountInputError(checked.reason);
      if (!(await repo.siteToken.update(token.id, { usedAt: new Date(now()) }, { usedAt: null, expiresAt: { gt: new Date(now()) } })).count) throw invalidToken();
      if (!(await repo.siteUser.update(user.id, { passwordHash, mustChangePassword: false, tempPasswordExpiresAt: null,
        ...(purpose === "invite" ? { status: "active", emailVerifiedAt: new Date(now()) } : {}) }, { updatedAt: user.updatedAt, status: user.status })).count) throw invalidToken();
      for (const row of await repo.siteSession.list({ where: { siteUserId: user.id }, select: { id: true } })) await repo.siteSession.delete(row.id);
      for (const row of await repo.siteToken.list({ where: { siteUserId: user.id, usedAt: null }, select: { id: true } })) await repo.siteToken.delete(row.id);
      return user.email ?? user.username ?? user.phone!;
    });
  }
  async function redeemMagic(tenantId: string, raw: string, totp: string | undefined, info: { ip: string; userAgent: string }) {
    const invalid = { ok: false as const, reason: "invalid_credentials" as const, message: "Link không hợp lệ, đã dùng hoặc đã hết hạn" };
    if (!tokenShape.test(raw)) return invalid;
    const token = await withTenantTransaction(db, tenantId, repo => repo.siteToken.first({ where: { tokenHash: digest(raw), purpose: "magic_link", usedAt: null, expiresAt: { gt: new Date(now()) } } }));
    if (!token) return invalid;
    return realm.loginWithToken({ accountId: token.siteUserId, tenantId, totp, ...info }, () => withTenantTransaction(db, tenantId, async repo =>
      (await repo.siteToken.update(token.id, { usedAt: new Date(now()) }, { purpose: "magic_link", usedAt: null, expiresAt: { gt: new Date(now()) } })).count === 1));
  }
  async function createSiteInvite(session: Session, tenantId: string, input: z.input<typeof inviteSchema>, origin: string) {
    authorize(session, tenantId, "users.manage");
    const value = inviteSchema.parse(input);
    return withTenantTransaction(db, tenantId, async repo => {
      const user = await repo.siteUser.create({ ...value, source: "invite", status: "invited" });
      const raw = randomBytes(32).toString("base64url");
      const token = await repo.siteToken.create({ siteUserId: user.id, purpose: "invite" satisfies SiteTokenPurpose, tokenHash: digest(raw), expiresAt: new Date(now() + 72 * 3600_000) });
      await repo.outbox.create({ topic: "mail.send", idempotencyKey: `auth:${token.id}`, payload: { to: value.email, template: "invite", url: `${origin}/moi?token=${raw}` } });
      return raw;
    });
  }
  return { requestLink, setPassword, redeemMagic, createSiteInvite };
}
