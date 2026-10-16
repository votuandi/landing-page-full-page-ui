import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { Account, RealmName, SessionStore, StoredSession } from "./realm.ts";
import type { Audience } from "./permissions.ts";

/** Test/local adapter. Applications use @solar/auth/db for durable sessions. */
export function memoryStore({ realm, audience, accounts: initial = [] }: { realm: RealmName; audience?: Audience; accounts?: Account[] }): SessionStore {
  const accounts = new Map(initial.map(a => [a.id, structuredClone(a)]));
  const sessions = new Map<string, StoredSession>();
  const scoped = (row: { tenantId?: string }, tenantId?: string) => realm === "platform" ? !row.tenantId : !!tenantId && row.tenantId === tenantId;
  const clone = <T>(row: T | undefined): T | null => row === undefined ? null : structuredClone(row);
  return {
    realm, audience,
    async findAccount(id, tenantId) { return clone([...accounts.values()].find(a => scoped(a, tenantId) && a[id.kind] === id.value)); },
    async getAccount(id, tenantId) { const row = accounts.get(id); return row && scoped(row, tenantId) ? clone(row) : null; },
    async updateAccount(id, data, tenantId, expected = {}) {
      const row = accounts.get(id);
      if (!row || !scoped(row, tenantId) || !Object.entries(expected).every(([key, value]) => isDeepStrictEqual(row[key as keyof Account], value))) return false;
      Object.assign(row, structuredClone(data));
      return true;
    },
    async createSession(input) {
      if (realm === "site" && (!input.tenantId || input.audience !== audience) || realm === "platform" && (input.tenantId || input.kind !== "user")) throw new Error("Invalid session scope");
      const row = { ...structuredClone(input), id: randomUUID() };
      sessions.set(row.id, row);
      return structuredClone(row);
    },
    async findSession(hash, tenantId) { return clone([...sessions.values()].find(s => s.tokenHash === hash && scoped(s, tenantId) && s.audience === audience)); },
    async updateSession(id, data, tenantId, expectedHash) {
      const row = sessions.get(id);
      if (!row || !scoped(row, tenantId) || expectedHash && row.tokenHash !== expectedHash) return false;
      Object.assign(row, structuredClone(data));
      return true;
    },
    async deleteSession(id, tenantId) { const row = sessions.get(id); if (row && scoped(row, tenantId)) sessions.delete(id); },
    async revokeAll(accountId, { tenantId, except }) {
      for (const [id, row] of sessions) if (scoped(row, tenantId) && row.accountId === accountId && id !== except) sessions.delete(id);
    },
  };
}
