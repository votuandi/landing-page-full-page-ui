import { sectionRegistry } from "@solar/sections";
import { PAGE_TYPES, PAGE_TYPE_IDS, isPageType, type PageTypeId } from "./pages";
import type { Preset } from "./schema";

/** Kiểm quyền theo gói của site (plan + addons + override, E6-S02). */
export type Can = (feature: string) => boolean;
const allowed = (entitlement: string | undefined, can: Can) => !entitlement || can(entitlement);

/** Trang của preset: khai báo trong `pages`, thiếu thì mọi loại trang; trang bắt buộc luôn có. */
export function presetPageTypes(preset: Pick<Preset, "pages">): PageTypeId[] {
  const pages = preset.pages ?? PAGE_TYPE_IDS;
  return PAGE_TYPE_IDS.filter((id) => pages.includes(id) || PAGE_TYPES[id].required === true);
}

/** Cấu hình lúc tạo site (D21 §1): bỏ trang và section có entitlement ngoài gói. */
export function applyPlanToPreset<S extends { type: string }>(preset: { pages?: Preset["pages"]; sections: readonly S[] }, can: Can) {
  return {
    pageTypes: presetPageTypes(preset).filter((id) => allowed(PAGE_TYPES[id].entitlement, can)),
    sections: preset.sections.filter((section) => allowed(sectionRegistry.getType(section.type)?.meta.entitlement, can)),
  };
}

export type SiteStructure = {
  pageTypes: readonly string[];
  pages: readonly { slug: string; sections: readonly { type: string }[] }[];
};

/** Một chính sách cho wizard, CMS, builder và API (D21): trả danh sách lỗi tiếng Việt, rỗng = hợp lệ. */
export function validateSiteStructure({ pageTypes, pages }: SiteStructure, can: Can): string[] {
  const issues: string[] = [];
  for (const id of PAGE_TYPE_IDS) {
    if (PAGE_TYPES[id].required === true && !pageTypes.includes(id)) issues.push(`Thiếu trang bắt buộc: ${id}`);
  }
  for (const id of pageTypes) {
    if (!isPageType(id)) issues.push(`Loại trang không tồn tại: ${id}`);
    else if (!allowed(PAGE_TYPES[id].entitlement, can)) issues.push(`Trang ngoài gói: ${id}`);
  }
  for (const page of pages) {
    for (const { type } of page.sections) {
      const def = sectionRegistry.getType(type);
      if (!def) issues.push(`Section không tồn tại: ${type} (trang /${page.slug})`);
      else if (!allowed(def.meta.entitlement, can)) issues.push(`Section ngoài gói: ${type} (trang /${page.slug})`);
    }
  }
  return issues;
}
