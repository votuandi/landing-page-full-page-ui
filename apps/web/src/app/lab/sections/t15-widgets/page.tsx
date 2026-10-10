import { PageRenderer, pageConfigSchema, sectionRegistry, SiteWidgets, siteWidgetsSchema, widgetRegistry, createCollectionLoader, type Locale, type SiteContext } from "@solar/sections";
import { staticCollectionSource } from "../../../../lib/sectionCollections";

export default async function WidgetsLabPage({ searchParams }: { searchParams: Promise<{ lang?: string; plan?: string; popup?: string; dock?: string }> }) {
  const params = await searchParams;
  const locale: Locale = params.lang === "en" ? "en" : "vi";
  const site: SiteContext = { tenantId: "lab-demo", locale, themeId: "t15" };
  const mobileBar = params.dock === "bar";
  const widgets = siteWidgetsSchema.parse(Object.fromEntries(Object.entries(widgetRegistry.types).map(([key, def]) => [key, {
    enabled: key !== "mobile-bottom-nav" || !mobileBar, variant: "t15",
    data: key === "consult-popup" ? { ...def.defaults, delayMs: params.popup === "scroll" ? 600000 : 1500 }
      : key === "contact-dock" ? { ...def.defaults, mobileBar } : def.defaults,
  }])));
  const canUse = (feature: string) => params.plan !== "basic" || feature !== "catalog";
  const page = pageConfigSchema.parse({ sections: ["site-header", "products", "process", "faq"].map((type) => ({
    id: "widget-lab-" + type, type, variant: "t15", data: sectionRegistry.getType(type)?.defaults,
  })) });
  const loadData = createCollectionLoader(staticCollectionSource, widgetRegistry);
  return <>
    <div className="t15-container py-6 text-sm font-bold text-fg-muted">[DỮ LIỆU MẪU] Widget toàn site</div>
    <PageRenderer page={page} site={site} canUse={canUse} loadData={createCollectionLoader(staticCollectionSource)} />
    <SiteWidgets widgets={widgets} site={site} slot="inline" canUse={canUse} loadData={loadData} />
    <SiteWidgets widgets={widgets} site={site} slot="overlay" canUse={canUse} loadData={loadData} />
  </>;
}
