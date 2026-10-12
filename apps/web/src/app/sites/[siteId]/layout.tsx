import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PageRenderer, SiteWidgets, createCollectionLoader, widgetRegistry } from "@solar/sections";
import TenantSiteShell from "@/components/TenantSiteShell";
import { loadPublishedPage, loadTenantSite, planCanUse } from "@/lib/tenant/siteData";
import { tenantCollections } from "@/lib/tenant/collections";

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const request = await headers();
  if (request.get("x-site-id") !== siteId) notFound();
  const site = await loadTenantSite(request.get("x-tenant-id") ?? "", siteId);
  if (!site) notFound();
  const home = await loadPublishedPage(site.tenantId, siteId, "");
  if (!home) notFound();
  const canUse = planCanUse(site.planId);
  const collections = tenantCollections(site.tenantId, site.locale);
  const loadData = createCollectionLoader(collections.source);
  const cartEnabled = Boolean(site.widgets["quote-cart"]?.enabled && canUse("quoteCart"));
  const chrome = (type: string) => <PageRenderer site={site.context} canUse={canUse} loadData={loadData}
    page={{ sections: home.config.sections.filter((section) => section.type === type).map((section) => {
      if (type !== "site-header") return section;
      const data = section.data as { controls?: object };
      return { ...section, data: { ...data, controls: { ...data.controls, cart: cartEnabled, language: site.locales.length > 1, theme: site.theme.meta.supportsDark && site.profile.theme.switcher } } };
    }) }} />;
  const widgets = (slot: "inline" | "overlay") => <SiteWidgets widgets={site.widgets} site={site.context} slot={slot} canUse={canUse} loadData={createCollectionLoader(collections.source, widgetRegistry)} />;
  return <TenantSiteShell header={chrome("site-header")} footer={chrome("site-footer")} inlineWidgets={widgets("inline")} overlayWidgets={widgets("overlay")}
    defaultLocale={site.locale} locales={site.locales} validSkus={cartEnabled ? (await collections.products()).map((item) => item.slug) : []} cartEnabled={cartEnabled}
    calculatorHref={home.config.sections.some((section) => section.type === "calculator" && section.enabled) && canUse("calculator") ? "/#du-toan" : null}>
    {children}
  </TenantSiteShell>;
}
