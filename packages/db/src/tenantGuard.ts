import { CrossTenantRefError } from "./refs.ts";

// schema.test.ts checks every relation so new fields must be classified here.
export const globalRelations: Record<string, Record<string, string>> = {
  Plan: { tenants: "Tenant" }, Tenant: { plan: "Plan", customer: "Customer", ghostGrants: "GhostGrant" },
  Customer: { tenants: "Tenant" },
  PlatformAdmin: { sessions: "PlatformSession", ghostGrants: "GhostGrant", settings: "PlatformSetting" },
  PlatformSession: { platformAdmin: "PlatformAdmin" }, GhostGrant: { platformAdmin: "PlatformAdmin", targetTenant: "Tenant" },
  PlatformSetting: { updatedBy: "PlatformAdmin" },
  SiteUser: { tenant: "Tenant" }, SiteSession: { ghostGrant: "GhostGrant", tenant: "Tenant" }, SiteToken: { tenant: "Tenant" },
  PreviewToken: { tenant: "Tenant" }, Domain: { tenant: "Tenant" }, Site: { tenant: "Tenant" }, Page: { tenant: "Tenant" },
  PageVersion: { publishedByPlatformAdmin: "PlatformAdmin", tenant: "Tenant" }, SectionContent: { tenant: "Tenant" },
  Product: { tenant: "Tenant" }, ProductCategory: { tenant: "Tenant" }, Project: { tenant: "Tenant" },
  Story: { tenant: "Tenant" }, Post: { tenant: "Tenant" }, Faq: { tenant: "Tenant" },
  Testimonial: { tenant: "Tenant" }, Branch: { tenant: "Tenant" }, Certificate: { tenant: "Tenant" },
  Brand: { tenant: "Tenant" }, PressItem: { tenant: "Tenant" }, Service: { tenant: "Tenant" },
  Media: { tenant: "Tenant" }, Lead: { tenant: "Tenant" }, Outbox: { tenant: "Tenant" },
  LeadIntegration: { tenant: "Tenant" }, AuditLog: { tenant: "Tenant" },
};

export const tenantRelations: Record<string, Record<string, string>> = {
  Tenant: {
    siteUsers: "SiteUser", siteSessions: "SiteSession", siteTokens: "SiteToken", previewTokens: "PreviewToken",
    domains: "Domain", sites: "Site", pages: "Page", pageVersions: "PageVersion",
    sectionContents: "SectionContent", products: "Product", productCategories: "ProductCategory", projects: "Project",
    storys: "Story", posts: "Post", faqs: "Faq", testimonials: "Testimonial", branchs: "Branch", certificates: "Certificate",
    brands: "Brand", pressItems: "PressItem", services: "Service", media: "Media", leads: "Lead", outbox: "Outbox",
    leadIntegrations: "LeadIntegration", auditLogs: "AuditLog",
  },
  // Platform rows have no tenant, so nested tenant connects from them are always rejected.
  PlatformAdmin: { pageVersions: "PageVersion" }, GhostGrant: { sessions: "SiteSession" },
  SiteUser: { sessions: "SiteSession", tokens: "SiteToken", pageVersions: "PageVersion", assignedLeads: "Lead" },
  SiteSession: { siteUser: "SiteUser" }, SiteToken: { siteUser: "SiteUser" },
  PreviewToken: { site: "Site" }, Domain: { site: "Site" }, Site: { domains: "Domain", previewTokens: "PreviewToken", pages: "Page", sectionContents: "SectionContent", leads: "Lead" },
  Page: { site: "Site", versions: "PageVersion", sectionContents: "SectionContent" },
  PageVersion: { page: "Page", publishedBySiteUser: "SiteUser" },
  SectionContent: { site: "Site", page: "Page" }, Product: { category: "ProductCategory", brand: "Brand" },
  ProductCategory: { parent: "ProductCategory", children: "ProductCategory", products: "Product" },
  Project: { coverMedia: "Media" }, Story: { posterMedia: "Media" }, Post: { coverMedia: "Media" },
  Brand: { logoMedia: "Media", products: "Product" },
  Media: { projects: "Project", stories: "Story", posts: "Post", brands: "Brand" }, Lead: { site: "Site", assignee: "SiteUser", branch: "Branch" },
  Branch: { leads: "Lead" },
};

type Input = Record<string, unknown>;
const object = (value: unknown): Input => value && typeof value === "object" && !Array.isArray(value) ? value as Input : {};
const many = (value: unknown): unknown[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const string = (value: unknown): string | undefined => typeof value === "string" ? value : undefined;
const scalar = (value: unknown) => string(value) ?? string(object(value).set);

function reject(path: string, selector: unknown): never {
  throw new CrossTenantRefError([{ kind: path, ids: [JSON.stringify(selector) ?? "unknown"] }]);
}

function writeTenant(model: string, data: Input, where: Input, inherited: string | undefined, path: string) {
  const candidates = model === "Tenant"
    ? [inherited, scalar(data.id), string(where.id)]
    : [inherited, scalar(data.tenantId), string(object(object(data.tenant).connect).id),
      string(where.tenantId), string(object(where.tenantId_id).tenantId)];
  const ids = candidates.filter((id): id is string => id !== undefined);
  if (ids.some((id) => id !== ids[0])) reject(`${path}.tenant`, ids);
  return ids[0];
}

function checkSelector(value: unknown, tenantId: string | undefined, path: string, tenantRelation: boolean) {
  for (const entry of many(value)) {
    const selector = object(entry);
    const identity = tenantRelation ? selector : object(selector.tenantId_id);
    if (!tenantId || (tenantRelation ? identity.id !== tenantId
      : identity.tenantId !== tenantId || !string(identity.id))) reject(path, entry);
  }
}

function walk(model: string, value: unknown, where: Input, inherited: string | undefined, path: string): void {
  for (const entry of many(value)) {
    const data = object(entry);
    const tenantId = writeTenant(model, data, where, inherited, path);
    const relations = { ...globalRelations[model], ...tenantRelations[model] };
    // Only schema relations are traversed; JSON content may legitimately contain connect/create keys.
    for (const [field, target] of Object.entries(relations)) {
      const relation = object(data[field]);
      const childPath = `${path}.${field}`;
      const isTenant = field === "tenant" && target === "Tenant";
      const scoped = tenantRelations[model]?.[field] !== undefined;
      if (scoped || isTenant) {
        checkSelector(relation.connect, tenantId, `${childPath}.connect`, isTenant);
        checkSelector(relation.set, tenantId, `${childPath}.set`, isTenant);
        for (const item of many(relation.connectOrCreate)) {
          checkSelector(object(item).where, tenantId, `${childPath}.connectOrCreate.where`, isTenant);
        }
      }
      const childTenant = scoped || isTenant ? tenantId : undefined;
      walk(target, relation.create, {}, childTenant, `${childPath}.create`);
      walk(target, object(relation.createMany).data, {}, childTenant, `${childPath}.createMany`);
      for (const item of many(relation.connectOrCreate)) {
        const input = object(item);
        walk(target, input.create, object(input.where), childTenant, `${childPath}.connectOrCreate.create`);
      }
      for (const operation of ["update", "updateMany"]) {
        for (const item of many(relation[operation])) {
          const input = object(item);
          walk(target, input.data ?? input, object(input.where), childTenant, `${childPath}.${operation}`);
        }
      }
      for (const item of many(relation.upsert)) {
        const input = object(item);
        for (const branch of ["create", "update"]) {
          walk(target, input[branch], object(input.where), childTenant, `${childPath}.upsert.${branch}`);
        }
      }
    }
  }
}

export function assertNoCrossTenantConnect(model: string, operation: string, args: unknown): void {
  const input = object(args);
  if (operation === "upsert") {
    for (const branch of ["create", "update"]) walk(model, input[branch], object(input.where), undefined, model);
  } else if (["create", "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn"].includes(operation)) {
    walk(model, input.data, object(input.where), undefined, model);
  }
}

// Reads through a tenant model may only follow tenant relations (and `tenant` itself). Platform relations
// such as Tenant.customer, Tenant.plan or SiteSession.ghostGrant lead to other tenants' rows (D17).
export function assertNoPlatformTraversal(model: string, args: unknown, path = model): void {
  const input = object(args);
  for (const key of ["include", "select"]) visitRead(model, input[key], `${path}.${key}`);
}

function visitRead(model: string, tree: unknown, path: string) {
  for (const [field, value] of Object.entries(object(tree))) {
    if (!value) continue;
    if (field === "_count") { visitRead(model, object(value).select, `${path}._count`); continue; }
    const tenantTarget = tenantRelations[model]?.[field];
    const target = tenantTarget ?? globalRelations[model]?.[field];
    if (!target) continue;
    if (!tenantTarget && !(field === "tenant" && target === "Tenant")) reject(`${path}.${field}`, field);
    assertNoPlatformTraversal(target, value, `${path}.${field}`);
  }
}
