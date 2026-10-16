import { forPlatform, withTenantTransaction, isGhostSessionActive, type Db, type PlatformDb, type TenantRepo } from "@solar/db";
import type { Account, AccountExpected, SessionStore, StoredSession } from "./realm.ts";
import type { Audience } from "./permissions.ts";

const credentials = { passwordHash: false, totpSecret: false, totpBackupCodes: false } as const;
function expectedWhere(expected: AccountExpected = {}) {
  const { totpBackupCodes, ...rest } = expected;
  return { ...rest, ...(totpBackupCodes ? { totpBackupCodes: { equals: totpBackupCodes } } : {}) };
}

/** The caller owns the connection lifecycle; constructing a store never opens a pool. */
export function siteStore(db: Db, { audience }: { audience: Audience }): SessionStore {
  function scoped<T>(tenantId: string | undefined, work: (repo: TenantRepo) => Promise<T>): Promise<T> {
    if (!tenantId) throw new Error("tenantId is required");
    return withTenantTransaction(db, tenantId, work);
  }
  async function account(repo: TenantRepo, where: { id?: string; email?: string; phone?: string; username?: string }): Promise<Account | null> {
    const row = await repo.siteUser.first({ where, omit: credentials, include: { tenant: true } });
    if (!row || audience === "admin" && row.role === "client") return null;
    return { id: row.id, tenantId: row.tenantId, email: row.email, phone: row.phone, username: row.username, name: row.name,
      status: ["active", "trial"].includes(row.tenant.status) ? row.status : "disabled", role: row.role,
      passwordHash: row.passwordHash, totpSecret: row.totpSecret, totpLastStep: row.totpLastStep, totpBackupCodes: row.totpBackupCodes,
      mustChangePassword: row.mustChangePassword, tempPasswordExpiresAt: row.tempPasswordExpiresAt };
  }
  return {
    realm: "site", audience,
    findAccount: (id, tenantId) => scoped(tenantId, repo => account(repo, { [id.kind]: id.value })),
    getAccount: (id, tenantId) => scoped(tenantId, repo => account(repo, { id })),
    updateAccount: (id, data, tenantId, expected) => scoped(tenantId, async repo => (await repo.siteUser.update(id, data, expectedWhere(expected))).count === 1),
    async createSession(input) {
      if (input.audience !== audience || input.kind !== "user" || !input.accountId) throw new Error("Invalid site session audience/account");
      const row = await scoped(input.tenantId, repo => repo.siteSession.create({
        siteUserId: input.accountId, kind: "user", audience, tokenHash: input.tokenHash, expiresAt: input.expiresAt,
        lastSeenAt: input.lastSeenAt, ip: input.ip, userAgent: input.userAgent,
      }));
      return { ...input, id: row.id };
    },
    async findSession(tokenHash, tenantId) {
      const row = await scoped(tenantId, repo => repo.siteSession.first({ where: { tokenHash, audience }, include: { tenant: true } }));
      if (!row || !["active", "trial"].includes(row.tenant.status)) return null;
      return { id: row.id, tokenHash: row.tokenHash, tenantId: row.tenantId, accountId: row.siteUserId ?? undefined,
        kind: row.kind, audience: row.audience, expiresAt: row.expiresAt, lastSeenAt: row.lastSeenAt,
        ip: row.ip ?? undefined, userAgent: row.userAgent ?? undefined, policy: row.tenant.permissionPolicy,
        ghostValid: row.kind === "ghost" ? await isGhostSessionActive(db, row.tenantId, row.id) : undefined };
    },
    updateSession: (id, { tokenHash, lastSeenAt }, tenantId, expectedHash) => scoped(tenantId, async repo =>
      (await repo.siteSession.update(id, { tokenHash, lastSeenAt }, { audience, ...(expectedHash ? { tokenHash: expectedHash } : {}) })).count === 1),
    async deleteSession(id, tenantId) {
      await scoped(tenantId, async repo => {
        const row = await repo.siteSession.first({ where: { id, audience } });
        if (row) await repo.siteSession.delete(id);
      });
    },
    async revokeAll(accountId, { tenantId, except }) {
      // Revoke every audience of this account, including storefront, after a security change.
      await scoped(tenantId, async repo => {
        const rows = await repo.siteSession.list({ where: { siteUserId: accountId, ...(except ? { id: { not: except } } : {}) }, select: { id: true } });
        for (const row of rows) await repo.siteSession.delete(row.id);
      });
    },
  };
}

export function platformStore(db: PlatformDb): SessionStore {
  // Repository acquisition is lazy too; importing @solar/auth/db needs no environment variables.
  const repo = () => forPlatform(db);
  async function account(where: { id?: string; email?: string }): Promise<Account | null> {
    const row = await repo().platformAdmin.findFirst({ where, omit: credentials });
    return row ? { id: row.id, email: row.email, name: row.name, status: row.status, passwordHash: row.passwordHash,
      totpSecret: row.totpSecret, totpLastStep: row.totpLastStep, totpBackupCodes: row.totpBackupCodes, mustChangePassword: false, tempPasswordExpiresAt: null } : null;
  }
  function session(row: { id: string; platformAdminId: string; tokenHash: string; expiresAt: Date; lastSeenAt: Date; ip: string | null; userAgent: string | null }): StoredSession {
    return { id: row.id, accountId: row.platformAdminId, kind: "user", tokenHash: row.tokenHash, expiresAt: row.expiresAt, lastSeenAt: row.lastSeenAt, ip: row.ip ?? undefined, userAgent: row.userAgent ?? undefined };
  }
  return {
    realm: "platform",
    findAccount: id => id.kind === "email" ? account({ email: id.value }) : Promise.resolve(null),
    getAccount: id => account({ id }),
    async updateAccount(id, data, _tenantId, expected) {
      const { passwordHash, totpSecret, totpLastStep, totpBackupCodes, status } = data;
      if (data.role || data.mustChangePassword || data.tempPasswordExpiresAt) throw new Error("Unsupported platform account fields");
      if (status && !["active", "locked", "disabled"].includes(status)) throw new Error("Invalid platform status");
      if (expected?.passwordHash === null) return false;
      return (await repo().platformAdmin.updateMany({ where: { id, ...expectedWhere(expected), passwordHash: expected?.passwordHash ?? undefined }, data: {
        passwordHash: passwordHash ?? undefined, totpSecret, totpLastStep, totpBackupCodes, status: status as "active" | "locked" | "disabled" | undefined,
      } })).count === 1;
    },
    async createSession(input) {
      if (!input.accountId || input.tenantId || input.audience || input.kind !== "user") throw new Error("Invalid platform session");
      return session(await repo().platformSession.create({ data: { platformAdminId: input.accountId, tokenHash: input.tokenHash,
        expiresAt: input.expiresAt, lastSeenAt: input.lastSeenAt, ip: input.ip, userAgent: input.userAgent } }));
    },
    async findSession(tokenHash) { const row = await repo().platformSession.findUnique({ where: { tokenHash } }); return row ? session(row) : null; },
    async updateSession(id, { tokenHash, lastSeenAt }, _tenantId, expectedHash) {
      return (await repo().platformSession.updateMany({ where: { id, ...(expectedHash ? { tokenHash: expectedHash } : {}) }, data: { tokenHash, lastSeenAt } })).count === 1;
    },
    async deleteSession(id) { await repo().platformSession.deleteMany({ where: { id } }); },
    async revokeAll(accountId, { except }) { await repo().platformSession.deleteMany({ where: { platformAdminId: accountId, ...(except ? { id: { not: except } } : {}) } }); },
  };
}
