import { checkConnection, internalClient, type Db, type PlatformDb } from "./client.ts";
import { createTenantRepo, type TenantRepo } from "./repository.ts";

// Internal callback accepts SQL for the ghost bridge; public callers only receive TenantRepo.
export async function tenantTransaction<T>(db: Db | PlatformDb, tenantId: string,
  work: (tx: Parameters<Parameters<ReturnType<typeof internalClient>["$transaction"]>[0]>[0]) => Promise<T>): Promise<T> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) throw new Error("tenantId must be a UUID");
  await checkConnection(db);
  return internalClient(db).$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_catalog.set_config('app.tenant_id', ${tenantId.toLowerCase()}, true)`;
    return work(tx);
  });
}

export function withTenantTransaction<T>(db: Db | PlatformDb, tenantId: string, work: (repo: TenantRepo) => Promise<T>): Promise<T> {
  return tenantTransaction(db, tenantId, async tx => {
    const repo = createTenantRepo(tx, tenantId);
    let active = true;
    const pending: Promise<unknown>[] = [];
    const bound = Object.fromEntries(Object.entries(repo).map(([name, delegate]) => [name, new Proxy(delegate, {
      get(target, key) {
        const method = Reflect.get(target, key) as (...args: unknown[]) => Promise<unknown>;
        if (typeof method !== "function") return method;
        return (...args: unknown[]) => {
          if (!active) return Promise.reject(new Error("Tenant transaction has ended"));
          const result = method(...args);
          pending.push(result);
          return result;
        };
      },
    })])) as TenantRepo;
    try {
      const result = await work(bound);
      await Promise.all(pending);
      return result;
    } finally { active = false; }
  });
}
