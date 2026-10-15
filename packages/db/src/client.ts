import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client.ts";
import { assertNoCrossTenantConnect, assertNoPlatformTraversal } from "./tenantGuard.ts";
import { assertTenantScoped, optionalTenantModels, tenantModels } from "./tenantScope.ts";

const scopedModels = new Set<string>([...tenantModels, ...optionalTenantModels]);

// Internal only: no unscoped client is exposed through the package exports.
const platformClients = new WeakMap<object, ReturnType<typeof connectClient>>();

// Secrets are opt-in per query (`omit: { passwordHash: false }`), so list/get never leak them by default.
const secret = { passwordHash: true, totpSecret: true } as const;
function baseClient(url: string, pool: number) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: pool }), omit: { siteUser: secret, platformAdmin: secret } });
}

function connectClient(base: ReturnType<typeof baseClient>) {
  return base.$extends({
    name: "tenant-connect-guard",
    query: { $allModels: { $allOperations({ model, operation, args, query }) {
      assertNoCrossTenantConnect(model, operation, args);
      return query(args);
    } } },
  });
}

export function platformClient(db: Db) {
  const client = platformClients.get(db);
  if (!client) throw new Error("forPlatform requires a client returned by createDb");
  return client;
}

export function platformDomainLookup(db: Db, hostname: string) {
  return platformClient(db).domain.findUnique({ where: { hostname } });
}

export async function platformDomainResolve(db: Db, hostname: string) {
  const domain = await platformClient(db).domain.findUnique({
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
  const base = baseClient(url, pool);
  const platform = connectClient(base);
  const db = base.$extends({
    name: "tenant-scope-guard",
    query: {
      $allOperations({ model, operation, args, query }) {
        assertTenantScoped(model, operation, args);
        if (model) assertNoCrossTenantConnect(model, operation, args);
        if (model && scopedModels.has(model)) assertNoPlatformTraversal(model, args);
        return query(args);
      },
    },
  });
  platformClients.set(db, platform);
  return db;
}

export type Db = ReturnType<typeof createDb>;
