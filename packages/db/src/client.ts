import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.ts";
import { assertNoCrossTenantConnect } from "./tenantGuard.ts";
import { assertTenantScoped } from "./tenantScope.ts";

// Internal only: no unscoped client is exposed through the package exports.
const platformClients = new WeakMap<object, ReturnType<typeof connectClient>>();

function connectClient(base: PrismaClient) {
  return base.$extends({
    name: "tenant-connect-guard",
    query: { $allModels: { $allOperations({ model, operation, args, query }) {
      assertNoCrossTenantConnect(model, operation, args);
      return query(args);
    } } },
  });
}

export function platformDomainLookup(db: Db, hostname: string) {
  const client = platformClients.get(db);
  if (!client) throw new Error("forPlatform requires a client returned by createDb");
  return client.domain.findUnique({ where: { hostname } });
}

export async function platformDomainResolve(db: Db, hostname: string) {
  const client = platformClients.get(db);
  if (!client) throw new Error("forPlatform requires a client returned by createDb");
  const domain = await client.domain.findUnique({
    where: { hostname },
    select: {
      hostname: true, tenantId: true, siteId: true, status: true, isPrimary: true,
      tenant: { select: { status: true } },
      site: { select: { domains: {
        where: { isPrimary: true, status: { in: ["verified", "active"] } },
        select: { hostname: true }, orderBy: { hostname: "asc" }, take: 1,
      } } },
    },
  });
  if (!domain) return null;
  const { tenant, site, ...record } = domain;
  return { ...record, tenantStatus: tenant.status, primaryHost: site.domains[0]?.hostname ?? null };
}

// Across all instances: total < max_connections - 20 (reserve for operations).
export const POOL_BUDGET = { web: 10, admin: 5, worker: 5 } as const;

export function createDb({ url = process.env.DATABASE_URL, pool }: { url?: string; pool: number }) {
  if (!url) throw new Error("DATABASE_URL is required to connect to Postgres");
  if (!Number.isInteger(pool) || pool < 1) throw new Error("pool must be a positive integer");
  const base = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: pool }) });
  const platform = connectClient(base);
  const db = base.$extends({
    name: "tenant-scope-guard",
    query: {
      $allOperations({ model, operation, args, query }) {
        assertTenantScoped(model, operation, args);
        if (model) assertNoCrossTenantConnect(model, operation, args);
        return query(args);
      },
    },
  });
  platformClients.set(db, platform);
  return db;
}

export type Db = ReturnType<typeof createDb>;
