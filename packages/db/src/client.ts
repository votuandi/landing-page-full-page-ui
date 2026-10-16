import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.ts";
import { assertNoCrossTenantConnect, assertNoPlatformTraversal } from "./tenantGuard.ts";
import { assertTenantScoped, MissingTenantError, optionalTenantModels, tenantModels } from "./tenantScope.ts";
import type { HostRecord } from "./repository.ts";

const scopedModels = new Set<string>([...tenantModels, ...optionalTenantModels]);
const secret = { passwordHash: true, totpSecret: true, totpBackupCodes: true } as const;
// SQL-capable clients stay internal to this package.
// Next keeps its pool across hot reloads and server bundles; keep the matching client registry alongside it.
const state = globalThis as typeof globalThis & { solarDbConnections?: {
  clients: WeakMap<object, ReturnType<typeof connectClient>>; platforms: WeakSet<object>;
} };
const { clients, platforms } = state.solarDbConnections ??= { clients: new WeakMap(), platforms: new WeakSet() };

function connectClient(url: string, pool: number, role: "app_runtime" | "app_platform") {
  const base = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: pool }), omit: { siteUser: secret, platformAdmin: secret } });
  let checked: Promise<void> | undefined;
  const ready = () => checked ??= (async () => {
    const [row] = await base.$queryRaw<{ valid: boolean }[]>`
      SELECT (current_user = ${role} AND session_user = ${role} AND NOT r.rolsuper AND NOT r.rolbypassrls
        AND NOT r.rolcreatedb AND NOT r.rolcreaterole
        AND NOT EXISTS (SELECT FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relowner=r.oid)
        AND (${role} <> 'app_runtime' OR (NOT pg_catalog.pg_has_role(current_user,'app_owner','MEMBER')
          AND NOT pg_catalog.pg_has_role(current_user,'app_platform','MEMBER')))) AS valid
      FROM pg_catalog.pg_roles r WHERE r.rolname=current_user`;
    if (!row?.valid) throw new Error(`Database connection requires isolated ${role} credentials (no ownership or bypass)`);
  })();
  const client = base.$extends({
    name: "database-role-and-tenant-guard",
    query: { async $allOperations({ model, operation, args, query }) {
      if (!model) { await ready(); return query(args); }
      if (role === "app_runtime") {
        assertTenantScoped(model, operation, args);
        if (scopedModels.has(model)) assertNoPlatformTraversal(model, args);
      }
      assertNoCrossTenantConnect(model, operation, args);
      await ready();
      return query(args);
    } },
  });
  return { client, ready };
}

export const POOL_BUDGET = { web: 10, admin: 5, worker: 5 } as const;
function validate(url: string | undefined, pool: number, variable: string): asserts url is string {
  if (!url) throw new Error(`${variable} is required to connect to Postgres`);
  if (!Number.isInteger(pool) || pool < 1) throw new Error("pool must be a positive integer");
}

export function createDb({ url = process.env.DATABASE_URL, pool }: { url?: string; pool: number }) {
  validate(url, pool, "DATABASE_URL");
  const entry = connectClient(url, pool, "app_runtime");
  const db = guardRaw(entry);
  clients.set(db, entry);
  return db;
}
function guardRaw(entry: ReturnType<typeof connectClient>) {
  const guarded = entry.client.$extends({ query: { $allOperations({ model, args, query, operation }) {
    if (!model) throw new MissingTenantError(model, operation);
    return query(args);
  } } });
  return new Proxy(guarded, { get(target, key, receiver) {
    if (key !== "$transaction") return Reflect.get(target, key, receiver);
    return async (...args: unknown[]) => {
      // Validate before acquiring the transaction connection, including when the pool has only one slot.
      await entry.ready();
      return Reflect.apply(target.$transaction, target, args);
    };
  } });
}
export type Db = ReturnType<typeof createDb>;

declare const platformBrand: unique symbol;
export type PlatformDb = ReturnType<typeof guardRaw> & { readonly [platformBrand]: true };
export function createPlatformDb({ url = process.env.PLATFORM_DATABASE_URL, pool }: { url?: string; pool: number }): PlatformDb {
  validate(url, pool, "PLATFORM_DATABASE_URL");
  const entry = connectClient(url, pool, "app_platform");
  const db = guardRaw(entry) as PlatformDb;
  clients.set(db, entry); platforms.add(db);
  return db;
}

export function internalClient(db: Db | PlatformDb) {
  const entry = clients.get(db);
  if (!entry) throw new Error("Requires a client returned by createDb/createPlatformDb");
  return entry.client;
}
export function checkConnection(db: Db | PlatformDb) {
  const entry = clients.get(db);
  if (!entry) throw new Error("Unknown database client");
  return entry.ready();
}
export function platformClient(db: PlatformDb) {
  if (!platforms.has(db)) throw new Error("forPlatform requires createPlatformDb credentials");
  return internalClient(db);
}
export function isPlatformDb(db: Db | PlatformDb): db is PlatformDb { return platforms.has(db); }

export async function resolveTenantHost(db: Db | PlatformDb, hostname: string): Promise<HostRecord | null> {
  await checkConnection(db);
  const rows = await internalClient(db).$queryRaw<HostRecord[]>`SELECT * FROM public.resolve_tenant_host(${hostname})`;
  return rows[0] ?? null;
}

// Kill switch names (D19) through the SECURITY DEFINER bridge; callers filter unknown features.
export async function loadDisabledFeatures(db: Db | PlatformDb): Promise<string[]> {
  await checkConnection(db);
  const rows = await internalClient(db).$queryRaw<{ features: string[] }[]>`SELECT public.platform_disabled_features() AS features`;
  return rows[0]?.features ?? [];
}
