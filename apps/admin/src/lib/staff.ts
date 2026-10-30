import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { withTenantTransaction, type Db, type TenantRepo } from "@solar/db";
import { effectivePermissions, ForbiddenError, type createRealm, type LoginLimiter, type Permission, type Session } from "@solar/auth";
import { assertWithinLimit, EntitlementError, limit } from "@solar/plans";
import { AccountInputError } from "./accounts.ts";
import { authorize } from "./gate.ts";
import { leadActor } from "./leadInbox.ts";
import { inviteSchema, roleSchema, type StaffRole } from "./staffInput.ts";

const missing = () => new AccountInputError("Không tìm thấy nhân viên", 404);
const conflict = () => new AccountInputError("Dữ liệu vừa thay đổi. Vui lòng thử lại.", 409);
const duplicate = () => new AccountInputError("Email hoặc số điện thoại đã có tài khoản trong site này", 409);
const staffWhere = { role: { not: "client" as const }, status: { not: "disabled" as const } };
const rowSelect = { id: true, name: true, email: true, phone: true, role: true, status: true, lastLoginAt: true, totpSecret: true } as const;
type SiteUser = NonNullable<Awaited<ReturnType<TenantRepo["siteUser"]["get"]>>>;
type StaffRow = Pick<SiteUser, "id" | "name" | "email" | "phone" | "role" | "status"> & { lastLoginAt: string | null; hasTotp: boolean };
type Access = { repo: TenantRepo; actor: Session; ghostGrantId?: string };

export function createStaff({ db, limiter, now = Date.now }: { db: Db; realm: ReturnType<typeof createRealm>; limiter: LoginLimiter; now?: () => number }) {
  async function transaction<T>(session: Session, tenantId: string, permission: Permission, work: (access: Access) => Promise<T>): Promise<T> {
    authorize(session, tenantId, permission);
    for (let attempt = 0; ; attempt++) {
      try {
        return await withTenantTransaction(db, tenantId, async repo => {
          const stored = await repo.siteSession.get(session.id);
          if (!stored || stored.kind !== session.kind || stored.audience !== "admin" || stored.expiresAt.getTime() <= now()) throw new ForbiddenError();
          let actor = session;
          if (session.kind === "ghost") {
            if (!stored.ghostGrantId || session.accountId) throw new ForbiddenError();
            const site = await repo.site.first({ include: { tenant: true } });
            if (!site || !["active", "trial"].includes(site.tenant.status)) throw new ForbiddenError();
            actor = { ...session, role: "owner", permissions: effectivePermissions({ role: "owner", kind: "ghost", audience: "admin", policy: site.tenant.permissionPolicy }) };
          } else {
            const user = session.accountId ? await repo.siteUser.first({ where: { id: session.accountId }, include: { tenant: true } }) : null;
            if (!user || stored.siteUserId !== user.id || user.status !== "active" || !["active", "trial"].includes(user.tenant.status)
              || user.mustChangePassword || user.tempPasswordExpiresAt && user.tempPasswordExpiresAt.getTime() <= now()) throw new ForbiddenError();
            actor = { ...session, role: user.role, permissions: effectivePermissions({ role: user.role, audience: "admin", policy: user.tenant.permissionPolicy }) };
          }
          authorize(actor, tenantId, permission);
          return work({ repo, actor, ghostGrantId: stored.ghostGrantId ?? undefined });
        }, { isolationLevel: "Serializable" });
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
        if (code === "P2034" && attempt < 3) continue;
        if (code === "P2034") throw conflict();
        if (code === "P2002") throw duplicate();
        throw error;
      }
    }
  }
  function ownerOnly(actor: Session) { if (actor.kind === "ghost" || actor.role !== "owner") throw new ForbiddenError(); }
  async function target({ repo, actor }: Access, id: string, allowSelf = false) {
    if (!z.uuid().safeParse(id).success) throw new AccountInputError("Mã nhân viên không hợp lệ");
    const row = await repo.siteUser.get(id);
    if (!row || row.role === "client") throw missing();
    if (row.role === "owner" && actor.role !== "owner") throw new ForbiddenError();
    if (!allowSelf && row.id === actor.accountId) throw new AccountInputError("Không thể thực hiện thao tác này với chính mình");
    return row;
  }
  async function protectOwner(repo: TenantRepo, row: SiteUser) {
    if (row.role === "owner" && row.status === "active" && await repo.siteUser.count({ where: { role: "owner", status: "active", id: { not: row.id } } }) === 0) {
      throw new AccountInputError("Site phải còn ít nhất một chủ sở hữu đang hoạt động", 409);
    }
  }
  async function checkLimit(repo: TenantRepo) {
    const site = await repo.site.first({ include: { tenant: true } });
    if (!site) throw new AccountInputError("Không tìm thấy website", 404);
    try { assertWithinLimit(site.tenant, "users", await repo.siteUser.count({ where: staffWhere }), 1, { now: new Date(now()) }); }
    catch (error) {
      if (error instanceof EntitlementError) throw new AccountInputError(error.message, error.status, { limit: true });
      throw error;
    }
  }
  async function revoke(repo: TenantRepo, id: string, except?: string) {
    for (const row of await repo.siteSession.list({ where: { siteUserId: id, ...(except ? { id: { not: except } } : {}) }, select: { id: true } })) await repo.siteSession.delete(row.id);
  }
  async function clearTokens(repo: TenantRepo, id: string) {
    for (const row of await repo.siteToken.list({ where: { siteUserId: id, usedAt: null }, select: { id: true } })) await repo.siteToken.delete(row.id);
  }
  async function audit(access: Access, action: string, id: string, data?: { role: string }) {
    const by = leadActor(access.actor, access.ghostGrantId);
    await access.repo.auditLog.create({ actorType: by.type, actorId: by.id, ghostGrantId: by.ghostGrantId, action, entity: "SiteUser", entityId: id, ...(data ? { data } : {}) });
  }
  async function issueInvite(repo: TenantRepo, user: SiteUser, origin: string) {
    for (const old of await repo.siteToken.list({ where: { siteUserId: user.id, purpose: "invite", usedAt: null }, select: { id: true } })) await repo.siteToken.delete(old.id);
    const raw = randomBytes(32).toString("base64url"), url = `${origin}/moi?token=${raw}`;
    const token = await repo.siteToken.create({ siteUserId: user.id, purpose: "invite", tokenHash: createHash("sha256").update(raw).digest("hex"), expiresAt: new Date(now() + 72 * 3600_000) });
    if (user.email) {
      await repo.outbox.create({ topic: "mail.send", idempotencyKey: `auth:${token.id}`, payload: { to: user.email, template: "invite", url } });
      return { message: "Đã gửi lời mời qua email.", url: undefined };
    }
    return { message: "Sao chép link mời và gửi riêng cho nhân viên. Link có hiệu lực 72 giờ, dùng một lần.", url };
  }
  function parseRole(input: StaffRole) {
    const result = roleSchema.safeParse(input);
    if (!result.success) throw new AccountInputError("Vai trò không hợp lệ");
    return result.data;
  }
  async function list(session: Session, tenantId: string) {
    return transaction(session, tenantId, "users.view", async ({ repo }) => {
      const site = await repo.site.first({ include: { tenant: true } });
      if (!site) throw new AccountInputError("Không tìm thấy website", 404);
      const rows = await repo.siteUser.list({ where: { role: { not: "client" } }, select: rowSelect, orderBy: [{ createdAt: "asc" }, { id: "asc" }] });
      const users: StaffRow[] = rows.map(({ totpSecret, lastLoginAt, ...row }) => ({ ...row, hasTotp: !!totpSecret, lastLoginAt: lastLoginAt?.toISOString() ?? null }));
      return { users, used: await repo.siteUser.count({ where: staffWhere }), max: limit(site.tenant, "users", { now: new Date(now()) }) };
    });
  }
  async function invite(session: Session, tenantId: string, input: z.input<typeof inviteSchema>, origin: string) {
    authorize(session, tenantId, "users.manage");
    const parsed = inviteSchema.safeParse(input);
    if (!parsed.success) throw new AccountInputError("Vui lòng kiểm tra tên, email/SĐT và vai trò (tên tối đa 100 ký tự)");
    const { loginId, name, role } = parsed.data;
    return transaction(session, tenantId, "users.manage", async access => {
      const existing = await access.repo.siteUser.first({ where: { [loginId.kind]: loginId.value } });
      if (existing?.role === "client") throw new AccountInputError(access.actor.role === "owner" && access.actor.kind !== "ghost"
        ? "Đã có tài khoản khách hàng. Xác nhận chuyển thành nhân viên?" : "Đã có tài khoản khách hàng. Vui lòng nhờ chủ site chuyển thành nhân viên.", 409,
        access.actor.role === "owner" && access.actor.kind !== "ghost" ? { clientId: existing.id } : undefined);
      if (existing) throw duplicate();
      await checkLimit(access.repo);
      const user = await access.repo.siteUser.create({ [loginId.kind]: loginId.value, name, role, status: "invited", source: "invite" });
      const result = await issueInvite(access.repo, user, origin);
      await audit(access, "staff.invited", user.id, { role });
      return result;
    });
  }
  async function resendInvite(session: Session, tenantId: string, id: string, origin: string) {
    authorize(session, tenantId, "users.manage");
    const attempt = { realm: "site" as const, tenantId, identifier: `staff-invite:${id}`, ip: `actor:${session.accountId ?? session.id}` };
    if (!(await limiter.reserve(attempt)).ok) throw new AccountInputError("Gửi lại quá nhiều lần. Vui lòng thử lại sau 15 phút.", 429);
    return transaction(session, tenantId, "users.manage", async access => {
      const user = await target(access, id, true);
      if (user.status !== "invited") throw new AccountInputError("Chỉ gửi lại lời mời cho tài khoản đang chờ kích hoạt");
      const result = await issueInvite(access.repo, user, origin);
      await audit(access, "staff.invite_resent", user.id);
      return result;
    });
  }
  async function changeRole(session: Session, tenantId: string, id: string, input: StaffRole) {
    return transaction(session, tenantId, "users.manage", async access => {
      const role = parseRole(input), user = await target(access, id);
      await protectOwner(access.repo, user);
      if (!(await access.repo.siteUser.update(id, { role }, { role: user.role, status: user.status })).count) throw conflict();
      await revoke(access.repo, id); await audit(access, "staff.role_changed", id, { role });
    });
  }
  async function setLocked(session: Session, tenantId: string, id: string, locked: boolean) {
    return transaction(session, tenantId, "users.manage", async access => {
      const user = await target(access, id);
      if (user.status !== (locked ? "active" : "locked")) throw new AccountInputError("Trạng thái tài khoản không phù hợp. Vui lòng tải lại danh sách.", 409);
      if (locked) await protectOwner(access.repo, user);
      if (!(await access.repo.siteUser.update(id, { status: locked ? "locked" : "active" }, { status: user.status })).count) throw conflict();
      await clearTokens(access.repo, id);
      await revoke(access.repo, id); await audit(access, locked ? "staff.locked" : "staff.unlocked", id);
    });
  }
  async function remove(session: Session, tenantId: string, id: string) {
    return transaction(session, tenantId, "users.delete", async access => {
      const user = await target(access, id); await protectOwner(access.repo, user);
      await revoke(access.repo, id);
      if (!(await access.repo.siteUser.delete(id)).count) throw conflict();
      await audit(access, "staff.removed", id);
    });
  }
  async function transferOwner(session: Session, tenantId: string, id: string) {
    return transaction(session, tenantId, "users.transferOwner", async access => {
      ownerOnly(access.actor);
      const user = await target(access, id);
      if (user.status !== "active" || user.role === "owner") throw new AccountInputError("Chọn nhân viên đang hoạt động chưa là chủ sở hữu");
      if (!(await access.repo.siteUser.update(id, { role: "owner" }, { role: user.role, status: "active" })).count
        || !(await access.repo.siteUser.update(access.actor.accountId!, { role: "admin" }, { role: "owner", status: "active" })).count) throw conflict();
      await revoke(access.repo, id); await revoke(access.repo, access.actor.accountId!);
      await audit(access, "staff.owner_transferred", id);
    });
  }
  async function convertClient(session: Session, tenantId: string, id: string, input: StaffRole) {
    return transaction(session, tenantId, "users.manage", async access => {
      ownerOnly(access.actor); const role = parseRole(input);
      const user = await access.repo.siteUser.get(id);
      if (!user || user.role !== "client") throw missing();
      if (user.status !== "active") throw new AccountInputError("Chỉ chuyển tài khoản khách hàng đã kích hoạt");
      await checkLimit(access.repo);
      if (!(await access.repo.siteUser.update(id, { role }, { role: "client", status: "active" })).count) throw conflict();
      await clearTokens(access.repo, id);
      await revoke(access.repo, id); await audit(access, "staff.client_converted", id, { role });
    });
  }
  async function convertToClient(session: Session, tenantId: string, id: string) {
    return transaction(session, tenantId, "users.manage", async access => {
      ownerOnly(access.actor); const user = await target(access, id);
      if (user.status !== "active") throw new AccountInputError("Chỉ chuyển nhân viên đang hoạt động");
      await protectOwner(access.repo, user);
      if (!(await access.repo.siteUser.update(id, { role: "client" }, { role: user.role, status: "active" })).count) throw conflict();
      await clearTokens(access.repo, id);
      await revoke(access.repo, id); await audit(access, "staff.client_converted", id, { role: "client" });
    });
  }
  async function sessions(session: Session, tenantId: string) {
    return transaction(session, tenantId, "account.totp", async ({ repo, actor }) => {
      if (!actor.accountId || actor.kind === "ghost") throw new ForbiddenError();
      const rows = await repo.siteSession.list({ where: { siteUserId: actor.accountId, expiresAt: { gt: new Date(now()) } }, orderBy: { lastSeenAt: "desc" },
        select: { id: true, audience: true, ip: true, userAgent: true, lastSeenAt: true, createdAt: true } });
      return rows.map(row => ({ ...row, current: row.id === actor.id, createdAt: row.createdAt.toISOString(), lastSeenAt: row.lastSeenAt.toISOString() }));
    });
  }
  async function logoutOtherSessions(session: Session, tenantId: string) {
    return transaction(session, tenantId, "account.totp", async access => {
      if (!access.actor.accountId || access.actor.kind === "ghost") throw new ForbiddenError();
      await revoke(access.repo, access.actor.accountId, access.actor.id);
      await audit(access, "staff.sessions_revoked", access.actor.accountId);
    });
  }
  return { list, invite, resendInvite, changeRole, setLocked, remove, transferOwner, convertClient, convertToClient, sessions, logoutOtherSessions };
}
