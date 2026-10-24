import type { ReactNode } from "react";
import type { TenantRenderKey as Key } from "@/lib/tenant/renderKey";
import { cacheLife, cacheTag } from "next/cache";
import { PageRenderer, SiteWidgets, createCollectionLoader, type BranchItem } from "@solar/sections";
import TenantSiteShell from "@/components/TenantSiteShell";
import { loadPublishedPage, loadDraftPage, loadTenantSite, siteCanUse, type TenantSite } from "@/lib/tenant/siteData";
import { tenantCollections, createTenantWidgetLoader } from "@/lib/tenant/collections";
import { applyPreviewTheme } from "@/lib/tenant/previewTheme";
import { organizationJsonLd, siteOrigin, matchRedirect } from "@/lib/tenant/seo";
import { text } from "@/lib/tenant/contentSchemas";
import { resolveRoute, routeEnabled } from "@/lib/tenant/routes";
import { TENANT_CACHE_LIFE, tenantPageTags } from "@/lib/tenant/cacheTags";
import { JsonLd, loadSystemPage, SystemContent, SystemFrame } from "@/components/tenant/SystemPages";
import { tenantMediaResolver } from "@/lib/tenant/media";

async function cachedSite({ tenantId, siteId, locale, disabled, preview, themeId }: Key) {
  const site = await loadTenantSite(tenantId, siteId, locale);
  if (!site) throw new Error(`[tenant] site ${siteId} vanished inside a cached render`);
  const snapshot = { ...site, entitlements: { ...site.entitlements, disabled: JSON.parse(disabled) as TenantSite["entitlements"]["disabled"] } };
  return preview ? applyPreviewTheme(snapshot, themeId) : snapshot;
}

/** Page lookup without throwing, so `notFound()`/`permanentRedirect()` stay outside cache scopes. */
async function loadTenantPage(site: TenantSite, slug: string, preview: boolean) {
  const route = resolveRoute(slug ? slug.split("/") : []);
  // Pages outside the site structure or plan are not served at all (E5-S11), not even via legacy redirects.
  const canUse = siteCanUse(site);
  if (route && !routeEnabled(route, site.pageTypes, canUse)) return { kind: "notFound" as const };
  const loaded = route?.kind === "page" ? await (preview ? loadDraftPage : loadPublishedPage)(site.tenantId, site.siteId, slug, site.locale) : null;
  // Landing pages need landingPages (D21); without it they act as missing, so legacy redirects below still apply.
  const page = loaded?.kind === "landing" && !canUse("landingPages") ? null : loaded;
  const system = route && route.kind !== "page" ? await loadSystemPage(site, route) : null;
  if (page || system) return { kind: "ok" as const, page, system };
  // Legacy slugs configured per tenant (Site.seo.redirects) → 308.
  const target = matchRedirect(site.seo.redirects, `/${slug}`);
  return target ? { kind: "redirect" as const, target } : { kind: "notFound" as const };
}

/** One snapshot supplies routing, metadata and JSX; callers throw 404/308 outside this scope. */
export async function tenantPage(key: Key, slug: string) {
  "use cache";
  cacheLife(TENANT_CACHE_LIFE);
  cacheTag(...tenantPageTags(key.tenantId, slug));
  const site = await cachedSite(key);
  const result = await loadTenantPage(site, slug, key.preview);
  if (result.kind !== "ok") return result;
  const { page, system } = result;
  let content: ReactNode;
  if (system) content = <SystemFrame title={system.title} description={system.description}>{system.content}</SystemFrame>;
  else if (page) {
    const config = { sections: page.config.sections.filter((section) => !["site-header", "site-footer"].includes(section.type)) };
    content = page.kind === "system"
      ? <SystemFrame title={page.title}><SystemContent site={site} slug={slug} config={config} /></SystemFrame>
      : <main><PageRenderer page={config} site={site.context} canUse={siteCanUse(site)} resolveData={tenantMediaResolver(site)} loadData={createCollectionLoader(tenantCollections(site.tenantId, site.locale, site.siteId).source)} /></main>;
  }
  return { kind: "ok" as const, title: page?.title || system?.title, description: system?.description,
    image: system && "image" in system ? system.image as string | undefined : undefined, content };
}

/** Header, footer, widgets and Organization JSON-LD of the home page; `children` passes through uncached. */
export async function TenantChrome({ children, ...key }: Key & { children: ReactNode }) {
  "use cache";
  cacheLife(TENANT_CACHE_LIFE);
  cacheTag(...tenantPageTags(key.tenantId, ""));
  const site = await cachedSite(key);
  const home = await (key.preview ? loadDraftPage : loadPublishedPage)(site.tenantId, site.siteId, "", site.locale);
  if (!home) return children;
  const canUse = siteCanUse(site);
  const collections = tenantCollections(site.tenantId, site.locale, site.siteId);
  const loadData = createCollectionLoader(collections.source);
  const cartEnabled = Boolean(site.widgets["quote-cart"]?.enabled && canUse("quoteCart"));
  const chrome = (type: string) => <PageRenderer site={site.context} canUse={canUse} loadData={loadData} resolveData={tenantMediaResolver(site)}
    page={{ sections: home.config.sections.filter((section) => section.type === type).map((section) => {
      if (type !== "site-header") return section;
      const data = section.data as { controls?: object };
      return { ...section, data: { ...data, controls: { ...data.controls, cart: cartEnabled, language: site.locales.length > 1, theme: site.theme.meta.supportsDark && site.profile.theme.switcher } } };
    }) }} />;
  const organization = organizationJsonLd(siteOrigin(site), { name: text(site.profile.name, site.locale) || site.name,
    description: text(site.profile.description, site.locale), email: site.profile.email, hotline: site.profile.hotline, logo: site.profile.brand?.logo }, (await collections.source.branches?.(site.context) ?? []) as BranchItem[]);
  const widgetConfig = { ...site.widgets, "theme-switch": site.theme.meta.supportsDark && site.profile.theme.switcher ? site.widgets["theme-switch"] : undefined };
  const widgets = (slot: "inline" | "overlay") => <SiteWidgets widgets={widgetConfig} site={site.context} slot={slot} canUse={canUse} loadData={createTenantWidgetLoader(collections.source)} />;
  return <TenantSiteShell header={chrome("site-header")} footer={chrome("site-footer")} inlineWidgets={widgets("inline")} overlayWidgets={widgets("overlay")}
    defaultLocale={site.locale} locales={site.locales} validSkus={cartEnabled ? (await collections.products()).map((item) => item.slug) : []} cartEnabled={cartEnabled}
    calculatorHref={home.config.sections.some((section) => section.type === "calculator" && section.enabled) && canUse("calculator") ? "/#du-toan" : null}>
    <JsonLd value={organization} />
    {/* Lead forms render Turnstile only when the platform enables it; the API then requires its token (E11-S01). */}
    {process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY ? <meta name="turnstile-site-key" content={process.env.TURNSTILE_SITE_KEY} /> : null}
    {children}
  </TenantSiteShell>;
}
