import { PageRenderer, pageConfigSchema, sectionRegistry, createCollectionLoader, type Locale, type SiteContext } from "@solar/sections";
import { staticCollectionSource } from "../../../../lib/sectionCollections";

const types = ["projects", "shorts", "stats", "energy-monitoring", "process", "testimonials", "trust", "brands", "faq", "blog", "cta-banner", "calculator"];
const page = pageConfigSchema.parse({ sections: types.map((type) => ({
  id: type, type, variant: "t15", anchor: type === "calculator" ? "du-toan" : undefined,
  data: sectionRegistry.getType(type)?.defaults,
})) });

export default async function ContentLabPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale: Locale = (await searchParams).lang === "en" ? "en" : "vi";
  const site: SiteContext = { tenantId: "lab-demo", locale, themeId: "t15" };
  return <PageRenderer page={page} site={site} loadData={createCollectionLoader(staticCollectionSource)} />;
}
