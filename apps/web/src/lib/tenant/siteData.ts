import { cache } from "react";
import { cookies } from "next/headers";
import { forTenant, type TenantRepo } from "@solar/db";
import { getTheme } from "@solar/themes";
import { ThemeOverridesSchema } from "@solar/tokens";
import { getPlan, isFeature } from "@solar/plans";
import { migrateSectionData, pageConfigSchema, pageSectionSchema, sectionRegistry, siteWidgetsSchema } from "@solar/sections";
import { getWebDb } from "./db";
import { parseContent, profileSchema, seoSchema, text } from "./contentSchemas";
import { normalizeHost } from "./host";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function planCanUse(planId: string, addons: readonly string[] = []) {
  const plan = getPlan(planId);
  if (!plan) console.error("[tenant] gói không tồn tại", { planId });
  // Addons buy single features on top of the plan (D8); E6-S02 adds overrides and kill switches.
  return (feature: string) => isFeature(feature) && Boolean(plan?.features.has(feature) || addons.includes(feature));
}
export const siteCanUse = (site: { planId: string; addons: readonly string[] }) => planCanUse(site.planId, site.addons);
export function createSiteData(repository: (tenantId: string) => TenantRepo) {
  async function loadTenantSite(tenantId: string, siteId: string) {
    if (!uuid.test(tenantId) || !uuid.test(siteId)) return null;
    const repo = repository(tenantId);
    const row = await repo.site.first({ where: { id: siteId }, include: { tenant: true } });
    if (!row || row.tenantId !== tenantId || row.id !== siteId) return null;
    const theme = getTheme(row.themeId);
    if (!theme) { console.error("[tenant] theme không tồn tại", { tenantId, siteId }); return null; }
    const domain = await repo.domain.first({ where: { siteId, isPrimary: true, status: { in: ["verified", "active"] } } });
    if (!domain || normalizeHost(domain.hostname) !== domain.hostname) return null;
    const context = { tenantId, siteId };
    const profile = parseContent(profileSchema, row.profile, context) ?? profileSchema.parse({});
    const seo = parseContent(seoSchema, row.seo, context) ?? seoSchema.parse({});
    const widgets = parseContent(siteWidgetsSchema, row.widgets, context) ?? {};
    const overrides = parseContent(ThemeOverridesSchema, row.themeOverrides, context) ?? {};
    const locales = row.locales.filter((locale): locale is "vi" | "en" => locale === "vi" || locale === "en");
    if (!locales.length) locales.push("vi");
    const locale = selectSiteLocale(locales, row.defaultLocale);
    return { tenantId, siteId, name: row.name, profile, seo, widgets, overrides, theme, primaryHost: domain.hostname,
      locales, locale, planId: row.tenant.planId, addons: row.tenant.addons, pageTypes: row.pageTypes,
      context: { tenantId, locale, themeId: theme.meta.id } };
  }
  async function loadPublishedPage(tenantId: string, siteId: string, slug: string, locale: "vi" | "en" = "vi") {
    if (!uuid.test(tenantId) || !uuid.test(siteId)) return null;
    const repo = repository(tenantId);
    const row = await repo.page.first({ where: { siteId, slug, publishedAt: { not: null } } });
    if (!row) return null;
    const context = { tenantId, siteId, pageId: row.id };
    if (!Array.isArray(row.sections)) { console.error("[tenant] cấu hình page lỗi", context); return null; }
    const contents = await repo.sectionContent.list({ where: { siteId, pageId: row.id } });
    const sections = [];
    for (const raw of row.sections) {
      const descriptor = pageSectionSchema.safeParse({ ...raw as object, data: undefined });
      if (!descriptor.success) { console.error("[tenant] mô tả section lỗi", context); continue; }
      const section = descriptor.data;
      const def = sectionRegistry.getType(section.type);
      const detail = { ...context, sectionId: section.id, type: section.type };
      if (!def) { console.error("[tenant] type section lạ", detail); continue; }
      const content = contents.find((item) => item.sectionId === section.id && item.type === section.type);
      let data: unknown = def.defaults;
      try {
        if (!content) throw new Error("Missing published content");
        data = def.schema.parse(migrateSectionData(def, content.schemaVersion, content.data).data);
      } catch { console.error("[tenant] dùng defaults section", detail); }
      sections.push({ ...section, data });
    }
    const config = parseContent(pageConfigSchema, { sections }, context);
    return config ? { id: row.id, kind: row.kind, title: text(row.title, locale), config } : null;
  }
  async function listPublishedPages(tenantId: string, siteId: string) {
    if (!uuid.test(tenantId) || !uuid.test(siteId)) return [];
    return repository(tenantId).page.list({ where: { siteId, publishedAt: { not: null } }, select: { slug: true, kind: true }, orderBy: { slug: "asc" } });
  }
  return { loadTenantSite, loadPublishedPage, listPublishedPages };
}
export const tenantRepository = (tenantId: string) => forTenant(getWebDb(), tenantId);
const data = createSiteData(tenantRepository);
export function selectSiteLocale(locales: ("vi" | "en")[], defaultLocale: string, requested?: string) {
  if ((requested === "vi" || requested === "en") && locales.includes(requested)) return requested;
  return locales.includes(defaultLocale as "vi" | "en") ? defaultLocale as "vi" | "en" : locales[0] ?? "vi";
}
export const loadTenantSite = cache(async (tenantId: string, siteId: string) => {
  const site = await data.loadTenantSite(tenantId, siteId);
  if (!site) return null;
  const locale = selectSiteLocale(site.locales, site.locale, (await cookies()).get("solar-locale")?.value);
  return { ...site, locale, context: { ...site.context, locale } };
});
export const loadPublishedPage = cache(data.loadPublishedPage);
export const listPublishedPages = data.listPublishedPages;
export type TenantSite = NonNullable<Awaited<ReturnType<typeof loadTenantSite>>>;
