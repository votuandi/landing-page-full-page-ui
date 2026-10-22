import { cached, cacheKey, tenantTag, siteTag, pageTag, type ContentCache } from "@solar/cache";
import { cache } from "react";
import { forTenant, withTenantTransaction, loadDisabledFeatures, type TenantRepo } from "@solar/db";
import { getTheme, themes } from "@solar/themes";
import { ThemeOverridesSchema, validateBrandOverrides } from "@solar/tokens";
import { canUse, disabledFeaturesSchema, themeAllowed, type EntitlementSubject } from "@solar/plans";
import { migrateSectionData, pageConfigSchema, pageSectionSchema, sectionRegistry, siteWidgetsSchema } from "@solar/sections";
import { getWebDb } from "./db";
import { parseContent, profileSchema, seoSchema, text } from "./contentSchemas";
import { normalizeHost } from "./host";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type SiteEntitlements = EntitlementSubject & { disabled: readonly string[] };
// D19 for every render/API entry point: kill switch → tenant override → plan + addons + trial.
export const siteCanUse = (site: { entitlements: SiteEntitlements }) => canUse(site.entitlements, { disabled: site.entitlements.disabled });
export type PageSnapshot = <T>(tenantId: string, work: (repo: TenantRepo) => Promise<T>) => Promise<T>;
export function createSiteData(repository: (tenantId: string) => TenantRepo, loadDisabled: () => Promise<readonly string[]> = async () => [], contentCache?: Pick<ContentCache, "cached">,
  snapshot: PageSnapshot = (tenantId, work) => withTenantTransaction(getWebDb(), tenantId, work, { isolationLevel: "RepeatableRead" })) {
  async function loadTenantSite(tenantId: string, siteId: string) {
    if (!uuid.test(tenantId) || !uuid.test(siteId)) return null;
    const repo = repository(tenantId);
    const row = await repo.site.first({ where: { id: siteId }, include: { tenant: true } });
    if (!row || row.tenantId !== tenantId || row.id !== siteId) return null;
    const storedTheme = getTheme(row.themeId);
    if (!storedTheme) { console.error("[tenant] theme không tồn tại", { tenantId, siteId }); return null; }
    const theme = themeAllowed(row.tenant.planId, storedTheme.meta.group) ? storedTheme : themes.find(item => themeAllowed(row.tenant.planId, item.meta.group));
    if (!theme) return null;
    const domain = await repo.domain.first({ where: { siteId, isPrimary: true, status: { in: ["verified", "active"] } } });
    if (!domain || normalizeHost(domain.hostname) !== domain.hostname) return null;
    const context = { tenantId, siteId };
    const profile = parseContent(profileSchema, row.profile, context) ?? profileSchema.parse({});
    const seo = parseContent(seoSchema, row.seo, context) ?? seoSchema.parse({});
    const widgets = parseContent(siteWidgetsSchema, row.widgets, context) ?? {};
    const parsedOverrides = parseContent(ThemeOverridesSchema, row.themeOverrides, context) ?? {};
    const overrides = theme !== storedTheme && validateBrandOverrides(theme, parsedOverrides).length ? {} : parsedOverrides;
    const locales = row.locales.filter((locale): locale is "vi" | "en" => locale === "vi" || locale === "en");
    if (!locales.length) locales.push("vi");
    const locale = selectSiteLocale(locales, row.defaultLocale);
    return { tenantId, siteId, name: row.name, profile, seo, widgets, overrides, theme, primaryHost: domain.hostname,
      locales, locale, pageTypes: row.pageTypes,
      entitlements: { planId: row.tenant.planId, addons: row.tenant.addons, status: row.tenant.status, createdAt: row.tenant.createdAt,
        featureOverrides: row.tenant.featureOverrides, limitOverrides: row.tenant.limitOverrides,
        disabled: [] } satisfies SiteEntitlements,
      context: { tenantId, locale, themeId: theme.meta.id } };
  }
  async function loadPage(tenantId: string, siteId: string, slug: string, locale: "vi" | "en" = "vi", draft = false) {
    if (!uuid.test(tenantId) || !uuid.test(siteId)) return null;
    const loaded = await snapshot(tenantId, async repo => {
      const row = await repo.page.first({ where: { siteId, slug, ...(!draft ? { publishedAt: { not: null } } : {}) } });
      return row ? { row, contents: await repo.sectionContent.list({ where: { siteId, pageId: row.id } }) } : null;
    });
    if (!loaded) return null;
    const { row, contents } = loaded;
    const context = { tenantId, siteId, pageId: row.id };
    const layout = draft ? row.draftSections ?? row.sections : row.sections;
    if (!Array.isArray(layout)) { console.error("[tenant] cấu hình page lỗi", context); return null; }
    const sections = [];
    for (const raw of layout) {
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
        data = def.schema.parse(migrateSectionData(def, content.schemaVersion, draft ? content.draftData ?? content.data : content.data).data);
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
  const read = <T>(fn: () => Promise<T>, keyParts: string, tags: string[]) => contentCache ? contentCache.cached(fn, { keyParts, tags }) : fn();
  return {
    loadTenantSite: async (tenantId: string, siteId: string) => {
      const site = await read(() => loadTenantSite(tenantId, siteId), cacheKey({ siteId, locale: "vi", mode: "published", parts: ["site", tenantId] }), [tenantTag(tenantId), siteTag(tenantId)]);
      // Platform kill switches must not be embedded in a tenant's long-lived site entry.
      if (!site) return null;
      const result = { ...site, entitlements: { ...site.entitlements, disabled: disabledFeaturesSchema.parse(await loadDisabled()) } };
      return { ...result, overrides: siteCanUse(result)("themeOverride") ? result.overrides : {} };
    },
    loadPublishedPage: (tenantId: string, siteId: string, slug: string, locale: "vi" | "en" = "vi") => read(() => loadPage(tenantId, siteId, slug, locale), cacheKey({ siteId, locale, mode: "published", parts: ["page", tenantId, slug] }), [tenantTag(tenantId), pageTag(tenantId, slug)]),
    loadDraftPage: (tenantId: string, siteId: string, slug: string, locale: "vi" | "en" = "vi") => loadPage(tenantId, siteId, slug, locale, true),
    listPublishedPages: (tenantId: string, siteId: string) => read(() => listPublishedPages(tenantId, siteId), cacheKey({ siteId, locale: "vi", mode: "published", parts: ["pages", tenantId] }), [tenantTag(tenantId), siteTag(tenantId)]),
  };
}
export const tenantRepository = (tenantId: string) => forTenant(getWebDb(), tenantId);
// Nothing publishes `platform:entitlements` yet (console E15); a short TTL keeps the kill switch effective within a minute.
export const KILL_SWITCH_TTL_MS = 60_000;
const data = createSiteData(tenantRepository, cache(() => cached(() => loadDisabledFeatures(getWebDb()), { keyParts: ["disabled"], tags: ["platform:entitlements"], ttlMs: KILL_SWITCH_TTL_MS })), { cached });
export function selectSiteLocale(locales: ("vi" | "en")[], defaultLocale: string, requested?: string) {
  if ((requested === "vi" || requested === "en") && locales.includes(requested)) return requested;
  return locales.includes(defaultLocale as "vi" | "en") ? defaultLocale as "vi" | "en" : locales[0] ?? "vi";
}
/** `requestedLocale` comes from the proxy's path segment (E5-S06), never from cookies, so callers can be cached. */
export const loadTenantSite = cache(async (tenantId: string, siteId: string, requestedLocale?: string) => {
  const site = await data.loadTenantSite(tenantId, siteId);
  if (!site) return null;
  const locale = selectSiteLocale(site.locales, site.locale, requestedLocale);
  return { ...site, locale, context: { ...site.context, locale } };
});
export const loadPublishedPage = cache(data.loadPublishedPage);
export const loadDraftPage = cache(data.loadDraftPage);
export const listPublishedPages = cache(data.listPublishedPages);
export type TenantSite = NonNullable<Awaited<ReturnType<typeof loadTenantSite>>>;
