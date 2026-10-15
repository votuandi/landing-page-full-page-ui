// schema.test.ts forces every new tenant model to be classified here.
export const tenantModels = [
  "SiteUser", "SiteSession", "SiteToken", "Domain", "Site", "Page", "PageVersion", "SectionContent", "Product", "ProductCategory",
  "Project", "Story", "Post", "Faq", "Testimonial", "Branch", "Certificate", "Brand", "PressItem",
  "Service", "Media", "Lead", "LeadIntegration",
] as const;
export const optionalTenantModels = ["Outbox", "AuditLog"] as const;

export class MissingTenantError extends Error {
  constructor(readonly model: string | undefined, readonly operation: string) {
    super(`Missing tenant scope: ${model ?? "raw"}.${operation}. Use forTenant/forPlatform from @solar/db`);
    this.name = "MissingTenantError";
  }
}

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const string = (value: unknown): value is string => typeof value === "string" && value.length > 0;

type TenantId = string | null;
const tenantValue = (value: unknown, optional: boolean): value is TenantId => string(value) || (optional && value === null);

function filterTenants(value: unknown, optional: boolean): TenantId[] | undefined {
  if (tenantValue(value, optional)) return [value];
  const filter = object(value);
  if (Object.keys(filter).length !== 1) return;
  if (Object.hasOwn(filter, "equals") && tenantValue(filter.equals, optional)) return [filter.equals];
  if (Object.hasOwn(filter, "in") && Array.isArray(filter.in) && filter.in.length > 0 && Array.from(filter.in).every(string)) return filter.in;
}

function scopedTenants(value: unknown, optional: boolean): TenantId[] | undefined {
  const where = object(value);
  const tenants: TenantId[] = [];
  if (Object.hasOwn(where, "tenantId")) {
    const ids = filterTenants(where.tenantId, optional);
    if (!ids) return;
    tenants.push(...ids);
  }
  for (const [key, selector] of Object.entries(where)) {
    if (!key.startsWith("tenantId_")) continue;
    const id = object(selector).tenantId;
    if (!string(id)) return;
    tenants.push(id);
  }
  return tenants.length ? tenants : undefined;
}

function writtenTenants(value: unknown, optional: boolean): TenantId[] | undefined {
  const data = object(value);
  const tenants: TenantId[] = [];
  if (Object.hasOwn(data, "tenantId")) {
    // Write inputs are scalar IDs, not query filters or field update operators.
    if (!tenantValue(data.tenantId, optional)) return;
    tenants.push(data.tenantId);
  }
  if (Object.hasOwn(data, "tenant")) {
    const id = object(object(data.tenant).connect).id;
    if (!string(id)) return;
    tenants.push(id);
  }
  return tenants;
}

function matchesScope(data: unknown, scope: TenantId[], optional: boolean, creating = false): boolean {
  const tenants = writtenTenants(data, optional);
  return tenants !== undefined && (!creating || tenants.length > 0)
    && tenants.every((id) => scope.every((scopedId) => scopedId === id));
}

export function assertTenantScoped(model: string | undefined, operation: string, args: unknown): void {
  if (!model) throw new MissingTenantError(model, operation);
  const optional = (optionalTenantModels as readonly string[]).includes(model);
  if (!optional && !(tenantModels as readonly string[]).includes(model)) return;
  const input = object(args);
  const scope = scopedTenants(input.where, optional);
  const valid = operation === "upsert" ? scope && matchesScope(input.create, scope, optional, true) && matchesScope(input.update, scope, optional)
    : ["create", "createMany", "createManyAndReturn"].includes(operation)
      ? (Array.isArray(input.data) ? input.data : [input.data]).every((data) => {
        const tenants = writtenTenants(data, optional);
        return tenants && tenants.length > 0 && tenants.every((id) => id === tenants[0]);
      })
      : scope && (!["update", "updateMany", "updateManyAndReturn"].includes(operation) || matchesScope(input.data, scope, optional));
  if (!valid) throw new MissingTenantError(model, operation);
}
