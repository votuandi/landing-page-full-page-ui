// schema.test.ts forces every new tenant model to be classified here.
export const tenantModels = [
  "Membership", "Domain", "Site", "Page", "PageVersion", "SectionContent", "Product", "ProductCategory",
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
const string = (value: unknown) => typeof value === "string" && value.length > 0;

function scoped(value: unknown, optional: boolean): boolean {
  const input = object(value);
  if (optional && Object.hasOwn(input, "tenantId") && input.tenantId !== undefined) return true;
  const filter = object(input.tenantId);
  return string(input.tenantId) || string(filter.equals)
    || (Array.isArray(filter.in) && filter.in.length > 0 && filter.in.every(string))
    || Object.entries(input).some(([key, value]) => key.startsWith("tenantId_") && string(object(value).tenantId));
}
function created(value: unknown, optional: boolean): boolean {
  const data = object(value);
  return (optional && Object.hasOwn(data, "tenantId") && data.tenantId !== undefined)
    || string(data.tenantId) || string(object(object(data.tenant).connect).id);
}

export function assertTenantScoped(model: string | undefined, operation: string, args: unknown): void {
  if (!model) throw new MissingTenantError(model, operation);
  const optional = (optionalTenantModels as readonly string[]).includes(model);
  if (!optional && !(tenantModels as readonly string[]).includes(model)) return;
  const input = object(args);
  const valid = operation === "upsert" ? scoped(input.where, optional) && created(input.create, optional)
    : ["create", "createMany", "createManyAndReturn"].includes(operation)
      ? (Array.isArray(input.data) ? input.data : [input.data]).every((data) => created(data, optional))
      : scoped(input.where, optional);
  if (!valid) throw new MissingTenantError(model, operation);
}
