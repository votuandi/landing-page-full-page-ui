import { collectRefs, collectionSchemas, migrateSectionData, sectionRegistry } from "@solar/sections";
import type { Prisma } from "../generated/client.ts";
import { platformClient, resolveTenantHost, isPlatformDb, type Db, type PlatformDb } from "./client.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import type { DomainStatus, TenantStatus } from "../generated/enums.ts";
import { assertRefsBelongToTenant, CrossTenantRefError } from "./refs.ts";
import { tenantModels, optionalTenantModels } from "./tenantScope.ts";
import { Prisma as PrismaValues } from "../generated/client.ts";
import { outboxRepository } from "./outbox.ts";
import { changeTenantPlan, scanExpiredOverrides, type TenantPlanChange } from "./tenantPlan.ts";
import { runBillingCron } from "./billing.ts";

const repositoryModels = [...tenantModels, ...optionalTenantModels];
type DelegateName = Uncapitalize<(typeof repositoryModels)[number]>;
// Transaction delegates retain the extensions; client lifecycle methods are not required.
type DbClient = Pick<Db, DelegateName>;
type WithoutTenant<A> = Omit<A, "tenantId" | "tenant"> & { tenantId?: never; tenant?: never };
type ScopedArgs<A> = Omit<A, "where"> & { where?: WithoutTenant<A extends { where?: infer W } ? W : never> };
type WriteData<D, O extends "create" | "updateMany"> = WithoutTenant<O extends "create"
  ? Extract<Prisma.Args<D, O>["data"], { tenantId?: string | null }>
  : Prisma.Args<D, O>["data"]>;
type Repository<D> = {
  list<A extends ScopedArgs<Prisma.Args<D, "findMany">>>(args?: A): Promise<Prisma.Result<D, A, "findMany">>;
  first<A extends ScopedArgs<Prisma.Args<D, "findFirst">>>(args?: A): Promise<Prisma.Result<D, A, "findFirst">>;
  get(id: string): Promise<Prisma.Result<D, object, "findFirst">>;
  count<A extends ScopedArgs<Prisma.Args<D, "count">>>(args?: A): Promise<Prisma.Result<D, A, "count">>;
  create(data: WriteData<D, "create">): Promise<Prisma.Result<D, object, "create">>;
  update(id: string, data: WriteData<D, "updateMany">): Promise<{ count: number }>;
  delete(id: string): Promise<{ count: number }>;
};
type SectionCreate = Omit<WriteData<Db["sectionContent"], "create">, "schemaVersion"> & { schemaVersion?: number };
type SectionUpdate = Omit<WriteData<Db["sectionContent"], "updateMany">, "type"> & { type?: never };
export type TenantRepo = { [K in DelegateName]: K extends "sectionContent"
  ? Omit<Repository<Db[K]>, "create" | "update"> & {
    create(data: SectionCreate): Promise<Prisma.Result<Db[K], object, "create">>;
    update(id: string, data: SectionUpdate): Promise<{ count: number }>;
  }
  : K extends "auditLog" ? Omit<Repository<Db[K]>, "update" | "delete"> : Repository<Db[K]> };

type Input = Record<string, unknown>;
type RuntimeDelegate = Record<"findMany" | "findFirst" | "count" | "create" | "updateMany" | "deleteMany", (args: Input) => Promise<unknown>>;
const collectionNames = {
  project: "projects", story: "stories", testimonial: "testimonials", post: "posts", product: "products", branch: "branches",
} as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function forTenant(db: Db | PlatformDb, tenantId: string): TenantRepo {
  if (!uuid.test(tenantId)) throw new Error("tenantId must be a UUID");
  return Object.fromEntries(repositoryModels.map(model => {
    const name = (model[0].toLowerCase() + model.slice(1)) as DelegateName;
    return [name, Object.fromEntries(["list", "first", "get", "count", "create", "update", "delete"].map(method => [method,
      (...args: unknown[]) => method === "get" && !uuid.test(String(args[0])) ? Promise.resolve(null)
        : withTenantTransaction(db, tenantId, repo => {
          const call = (repo[name] as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[method];
          return call(...args);
        }),
    ]))];
  })) as unknown as TenantRepo;
}

// Internal builder: only tenantTransaction can bind delegates to initialized context.
export function createTenantRepo(db: DbClient, tenantId: string): TenantRepo {
  if (!uuid.test(tenantId)) throw new Error("tenantId must be a UUID");
  tenantId = tenantId.toLowerCase();
  const clean = (data: Input): Input => {
    const { tenantId: _tenantId, tenant: _tenant, ...rest } = data;
    return rest;
  };
  async function checkRefs(name: DelegateName, data: Input) {
    if (name === "sectionContent") {
      const type = typeof data.type === "string" ? sectionRegistry.getType(data.type) : null;
      if (!type) throw new CrossTenantRefError([{ kind: "sectionType", ids: [String(data.type)] }]);
      for (const value of [data.data, data.draftData]) await assertRefsBelongToTenant(db, tenantId, collectRefs(type.schema, value));
    } else if (Object.hasOwn(collectionNames, name)) {
      const collection = collectionNames[name as keyof typeof collectionNames];
      await assertRefsBelongToTenant(db, tenantId, collectRefs(collectionSchemas[collection], data.data));
    }
  }
  function repository(name: DelegateName) {
    // Prisma delegates have different generic call signatures; keep the cast at this single runtime boundary.
    const delegate = db[name] as unknown as RuntimeDelegate;
    const scoped = (args: Input = {}) => ({ ...args, where: { ...args.where as Input, tenantId } });
    return {
      list: (args?: Input) => delegate.findMany(scoped(args)),
      first: (args?: Input) => delegate.findFirst(scoped(args)),
      get: (id: string) => uuid.test(id) ? delegate.findFirst({ where: { id, tenantId } }) : Promise.resolve(null),
      count: (args?: Input) => delegate.count(scoped(args)),
      async create(input: Input) {
        const data = clean(input);
        if (name === "sectionContent" && data.schemaVersion === undefined) {
          data.schemaVersion = sectionRegistry.getType(String(data.type))?.schemaVersion;
        }
        await checkRefs(name, data);
        return delegate.create({ data: { ...data, tenantId } });
      },
      async update(id: string, input: Input) {
        const data = clean(input);
        if (name === "sectionContent") {
          if (Object.hasOwn(data, "type")) throw new Error("Section type is immutable; create a new section to change type");
          for (let attempt = 0; attempt < 5; attempt++) {
            const existing = await db.sectionContent.findFirst({ where: { id, tenantId }, select: { type: true, schemaVersion: true, data: true, draftData: true } });
            if (!existing) return { count: 0 };
            const next = { ...data };
            const where: Input = { id, tenantId };
            if (data.data !== undefined || data.draftData !== undefined) {
              const def = sectionRegistry.getType(existing.type);
              if (!def) throw new Error(`[sections] unknown section type ${existing.type}`);
              // Do not relabel current/future rows from a stale caller version.
              delete next.schemaVersion;
              if (existing.schemaVersion < def.schemaVersion) {
                next.schemaVersion = def.schemaVersion;
                // Only migrate retained fields; full replacements can repair corrupt JSON.
                if (data.data === undefined) next.data = migrateSectionData(def, existing.schemaVersion, existing.data).data;
                if (data.draftData === undefined) next.draftData = existing.draftData == null ? PrismaValues.DbNull
                  : migrateSectionData(def, existing.schemaVersion, existing.draftData).data;
                // The upgraded pair must still match what we read, including concurrent content edits.
                Object.assign(where, {
                  schemaVersion: existing.schemaVersion,
                  data: { equals: existing.data ?? PrismaValues.AnyNull },
                  draftData: { equals: existing.draftData ?? PrismaValues.AnyNull },
                });
              }
            }
            await checkRefs(name, { ...existing, ...next });
            const result = await delegate.updateMany({ where, data: next }) as { count: number };
            if (result.count || where.schemaVersion === undefined) return result;
          }
          throw new Error(`SectionContent ${id} changed during migration; retry saving`);
        } else await checkRefs(name, data);
        return delegate.updateMany({ where: { id, tenantId }, data });
      },
      delete: (id: string) => delegate.deleteMany({ where: { id, tenantId } }),
    };
  }
  return Object.fromEntries(repositoryModels.map((model) => {
    const name = (model[0].toLowerCase() + model.slice(1)) as DelegateName;
    return [name, repository(name)];
  })) as unknown as TenantRepo;
}

// Platform tables (D17–D19). Console writes must also record AuditLog (enforced with the console actor in E15-S02).
export function forPlatform(db: PlatformDb): ReturnType<typeof platformRepository>;
export function forPlatform(db: Db): { domains: { resolve(hostname: string): Promise<HostRecord | null> } };
export function forPlatform(db: Db | PlatformDb) {
  if (!isPlatformDb(db)) return { domains: { resolve: (hostname: string) => resolveTenantHost(db, hostname) } };
  return platformRepository(db);
}
function platformRepository(db: PlatformDb) {
  const client = platformClient(db);
  return {
    domains: {
      findByHostname: (hostname: string) => client.domain.findUnique({ where: { hostname } }),
      resolve: (hostname: string): Promise<HostRecord | null> => resolveTenantHost(db, hostname),
    },
    customer: client.customer, platformAdmin: client.platformAdmin, platformSession: client.platformSession,
    ghostGrant: client.ghostGrant, platformSetting: client.platformSetting,
    outbox: outboxRepository(db),
    billing: { run: (options?: { now?: Date }) => runBillingCron(db, options) },
    tenants: {
      changePlan: (input: TenantPlanChange) => changeTenantPlan(db, input),
      scanExpiredOverrides: (options?: { now?: Date }) => scanExpiredOverrides(db, options),
    },
  };
}

export type HostRecord = {
  hostname: string; tenantId: string; siteId: string; status: DomainStatus;
  isPrimary: boolean; tenantStatus: TenantStatus; primaryHost: string | null;
};
