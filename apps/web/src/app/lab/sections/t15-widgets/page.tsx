import { PageRenderer, pageConfigSchema, sectionRegistry, SiteWidgets, siteWidgetsSchema, widgetRegistry, createCollectionLoader, type Locale, type SiteContext } from "@solar/sections";
import { staticCollectionSource } from "../../../../lib/sectionCollections";

export default async function WidgetsLabPage({ searchParams }: { searchParams: Promise<{ lang?: string; plan?: string }> }) {
  const params = await searchParams;
  const locale: Locale = params.lang === "en" ? "en" : "vi";
  const site: SiteContext = { tenantId: "lab-demo", locale, themeId: "t15" };
  const widgets = siteWidgetsSchema.parse(Object.fromEntries(Object.entries(widgetRegistry.types).map(([key, def]) => [key, {
    enabled: true, variant: "t15", data: key === "consult-popup" ? { ...def.defaults, delayMs: 1500 } : def.defaults,
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
