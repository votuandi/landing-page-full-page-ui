import { sectionRegistry, type SectionTypeDef } from "@solar/sections";

/** Type section có form trong CMS: có trong registry và (nếu thu phí) nằm trong gói của site. */
export function sectionFormTypes(can: (feature: string) => boolean): SectionTypeDef[] {
  return Object.values(sectionRegistry.types).filter((def: SectionTypeDef) => !def.meta.entitlement || can(def.meta.entitlement));
}

export function sectionFormType(type: string, can: (feature: string) => boolean): SectionTypeDef | null {
  const def = sectionRegistry.getType(type);
  return def && (!def.meta.entitlement || can(def.meta.entitlement)) ? def : null;
}

type FormDeps = {
  requirePermission(permission: "content.edit"): Promise<unknown>;
  entitlements(): Promise<(feature: string) => boolean>;
};

/** Logic của trang /noi-dung/form/[type]: kiểm quyền trước, rồi gói; null → trang gọi notFound(). */
export async function loadSectionForm(type: string, deps: FormDeps): Promise<{ def: SectionTypeDef; bilingual: boolean } | null> {
  await deps.requirePermission("content.edit");
  const can = await deps.entitlements();
  const def = sectionFormType(type, can);
  return def ? { def, bilingual: can("bilingual") } : null;
}
