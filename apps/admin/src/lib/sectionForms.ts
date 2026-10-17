import { sectionRegistry, type SectionTypeDef } from "@solar/sections";

/** Type section có form trong CMS: có trong registry và (nếu thu phí) nằm trong gói của site. */
export function sectionFormTypes(can: (feature: string) => boolean): SectionTypeDef[] {
  return Object.values(sectionRegistry.types).filter((def: SectionTypeDef) => !def.meta.entitlement || can(def.meta.entitlement));
}

export function sectionFormType(type: string, can: (feature: string) => boolean): SectionTypeDef | null {
  const def = sectionRegistry.getType(type);
  return def && (!def.meta.entitlement || can(def.meta.entitlement)) ? def : null;
}
