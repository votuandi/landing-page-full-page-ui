import { sectionLimitIssues, sectionRegistry } from "@solar/sections";
import { PAGE_TYPES, PAGE_TYPE_IDS, isPageType, type PageTypeId } from "./pages";
import type { Preset } from "./schema";

/** Kiểm quyền theo gói của site (plan + addons + override, E6-S02). */
export type Can = (feature: string) => boolean;
const allowed = (entitlement: string | undefined, can: Can) => !entitlement || can(entitlement);
/** Section trang hệ thống dùng variant chuẩn t15 (tự khoác theme, E2-S07), giống bản seed trước E5-S11. */
const SYSTEM_SECTION_VARIANT = "t15";

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

export type StructureSection = { id: string; type: string; variant: string; enabled: boolean };
export type SitePage = { slug: string; sections: readonly StructureSection[] };
export type SiteStructure = { pageTypes: readonly string[]; pages: readonly SitePage[] };

/** Disabled catalog pages retain their records, but do not participate in active site structure. */
export function siteStructureOf(site: { pageTypes: readonly string[] }, pages: readonly SitePage[]): SiteStructure {
  return { pageTypes: site.pageTypes, pages: pages.filter(page => {
    const type = PAGE_TYPE_IDS.find(id => PAGE_TYPES[id].kind === "page" && PAGE_TYPES[id].slug === page.slug);
    return !type || site.pageTypes.includes(type);
  }) };
}

/**
 * Cấu trúc đầy đủ của site tạo từ preset theo gói: home lấy section của preset, trang hệ thống lấy section mặc định
 * trong danh mục; mọi trang đều bỏ section ngoài gói. Đây cũng là cấu trúc cố định khi gói không cho tùy biến.
 */
export function presetStructure<S extends StructureSection>(preset: { id: string; pages?: Preset["pages"]; sections: readonly S[] }, can: Can) {
  const { pageTypes, sections } = applyPlanToPreset(preset, can);
  const system = (type: PageTypeId) => (PAGE_TYPES[type].sections ?? [])
    .filter((section) => allowed(sectionRegistry.getType(section)?.meta.entitlement, can))
    .map((section, index) => ({ id: `${preset.id}-${section}-${index}`, type: section, variant: SYSTEM_SECTION_VARIANT, enabled: true }));
  const pages = pageTypes.filter((type) => PAGE_TYPES[type].kind === "page")
    .map((type) => ({ type, slug: PAGE_TYPES[type].slug, sections: type === "home" ? sections : system(type) }));
  return { pageTypes, pages };
}

const catalogPageSlugs = new Set(PAGE_TYPE_IDS.filter((id) => PAGE_TYPES[id].kind === "page").map((id) => PAGE_TYPES[id].slug));
/** Trang landing = Page có slug ngoài danh mục trang (D21). */
export const isLandingSlug = (slug: string) => !catalogPageSlugs.has(slug);

// Every field is required so a caller cannot skip a check by omission; no page limit = Infinity.
export type StructurePolicy = {
  can: Can;
  /** Limit `pages` của gói: home + landing (E6). */
  pagesLimit: number;
  /** Cấu trúc chuẩn (`presetStructure`) — bắt buộc giữ nguyên phần gói không cho tùy biến. */
  baseline: SiteStructure;
};

const order = (page: SitePage) => page.sections.map(({ id, type, enabled }) => `${id}:${type}:${enabled}`).join("|");

/** Một chính sách cho wizard, CMS, builder và API (D21): trả danh sách lỗi tiếng Việt, rỗng = hợp lệ. */
export function validateSiteStructure({ pageTypes, pages }: SiteStructure, { can, pagesLimit, baseline }: StructurePolicy): string[] {
  const issues: string[] = [];
  for (const id of PAGE_TYPE_IDS) {
    if (PAGE_TYPES[id].required === true && !pageTypes.includes(id)) issues.push(`Thiếu trang bắt buộc: ${id}`);
  }
  for (const id of pageTypes) {
    if (!isPageType(id)) issues.push(`Loại trang không tồn tại: ${id}`);
    else if (!allowed(PAGE_TYPES[id].entitlement, can) && !baseline?.pageTypes.includes(id)) issues.push(`Trang ngoài gói: ${id}`);
  }
  // Page types with sections need their Page record; catalog pages need their type in the structure.
  for (const id of pageTypes) {
    if (isPageType(id) && PAGE_TYPES[id].kind === "page" && !pages.some((page) => page.slug === PAGE_TYPES[id].slug)) {
      issues.push(`Thiếu trang: /${PAGE_TYPES[id].slug}`);
    }
  }
  for (const page of pages) {
    issues.push(...sectionLimitIssues(page.sections).map(message => `${message} (trang /${page.slug})`));
    const type = PAGE_TYPE_IDS.find((id) => PAGE_TYPES[id].kind === "page" && PAGE_TYPES[id].slug === page.slug);
    if (type && !pageTypes.includes(type)) issues.push(`Trang không có trong cấu trúc: /${page.slug}`);
    const original = baseline?.pages.find(item => item.slug === page.slug);
    if (isLandingSlug(page.slug) && !can("landingPages") && !original) issues.push(`Trang landing ngoài gói: /${page.slug}`);
    for (const section of page.sections) {
      const { type } = section;
      const def = sectionRegistry.getType(type);
      if (!def) issues.push(`Section không tồn tại: ${type} (trang /${page.slug})`);
      else if (!allowed(def.meta.entitlement, can) && !original?.sections.some(item =>
        item.id === section.id && item.type === type && item.variant === section.variant && item.enabled === section.enabled)) {
        issues.push(`Section ngoài gói: ${type} (trang /${page.slug})`);
      }
    }
  }
  const counted = pages.filter((page) => page.slug === "" || isLandingSlug(page.slug)).length;
  // `!(a <= b)` also rejects a missing or NaN limit instead of silently skipping the check.
  const baselineCounted = baseline?.pages.filter(page => page.slug === "" || isLandingSlug(page.slug)).length ?? 0;
  if (!(counted <= pagesLimit) && !(Number.isFinite(pagesLimit) && pagesLimit >= 0 && counted <= baselineCounted)) issues.push(`Vượt số trang của gói: ${counted}/${pagesLimit}`);
  // JS callers can omit the baseline; never treat that as "anything goes".
  if (!baseline) return [...issues, "Thiếu cấu trúc chuẩn để đối chiếu"];
  if (!can("pageStructure") && [...pageTypes].sort().join() !== [...baseline.pageTypes].sort().join()) {
    issues.push("Gói không cho đổi cấu trúc trang");
  }
  for (const base of baseline.pages) {
    const page = pages.find((item) => item.slug === base.slug);
    if (!page) continue;
    if (!can("sectionReorder") && order(page) !== order(base)) issues.push(`Gói không cho thêm, bớt, bật/tắt hoặc sắp xếp section: /${base.slug}`);
    if (!can("variantSwitch") && page.sections.some((section) => {
      const original = base.sections.find((item) => item.id === section.id);
      return original !== undefined && original.variant !== section.variant;
    })) issues.push(`Gói không cho đổi kiểu hiển thị section: /${base.slug}`);
  }
  return issues;
}
