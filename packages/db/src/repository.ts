import { collectRefs, collectionSchemas, sectionRegistry } from "@solar/sections";
import type { Prisma } from "../generated/client.ts";
import { platformDomainLookup, platformDomainResolve, type Db } from "./client.ts";
import type { DomainStatus, TenantStatus } from "../generated/enums.ts";
import { assertRefsBelongToTenant, CrossTenantRefError } from "./refs.ts";
import { tenantModels } from "./tenantScope.ts";

type DelegateName = Uncapitalize<(typeof tenantModels)[number]>;
// Transaction delegates retain the extensions; client lifecycle methods are not required.
export type DbClient = Pick<Db, DelegateName>;
type WithoutTenant<A> = Omit<A, "tenantId" | "tenant"> & { tenantId?: never; tenant?: never };
type ScopedArgs<A> = Omit<A, "where"> & { where?: WithoutTenant<A extends { where?: infer W } ? W : never> };
type WriteData<D, O extends "create" | "updateMany"> = WithoutTenant<O extends "create"
  ? Extract<Prisma.Args<D, O>["data"], { tenantId: string }>
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
export type TenantRepo = { [K in DelegateName]: Repository<Db[K]> };

type Input = Record<string, unknown>;
type RuntimeDelegate = Record<"findMany" | "findFirst" | "count" | "create" | "updateMany" | "deleteMany", (args: Input) => Promise<unknown>>;
const collectionNames = {
  project: "projects", story: "stories", testimonial: "testimonials", post: "posts", product: "products", branch: "branches",
} as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function forTenant(db: DbClient, tenantId: string): TenantRepo {
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
        await checkRefs(name, data);
        return delegate.create({ data: { ...data, tenantId } });
      },
      async update(id: string, input: Input) {
        const data = clean(input);
        if (name === "sectionContent") {
          const existing = await db.sectionContent.findFirst({ where: { id, tenantId }, select: { type: true, data: true, draftData: true } });
          if (!existing) return { count: 0 };
          await checkRefs(name, { ...existing, ...data });
        } else await checkRefs(name, data);
        return delegate.updateMany({ where: { id, tenantId }, data });
      },
      delete: (id: string) => delegate.deleteMany({ where: { id, tenantId } }),
    };
  }
  return Object.fromEntries(tenantModels.map((model) => {
    const name = (model[0].toLowerCase() + model.slice(1)) as DelegateName;
    return [name, repository(name)];
  })) as TenantRepo;
}

export function forPlatform(db: Db) {
  return { domains: {
    findByHostname: (hostname: string) => platformDomainLookup(db, hostname),
    resolve: (hostname: string): Promise<HostRecord | null> => platformDomainResolve(db, hostname),
  } };
}

export type HostRecord = {
  hostname: string; tenantId: string; siteId: string; status: DomainStatus;
  isPrimary: boolean; tenantStatus: TenantStatus; primaryHost: string | null;
};
