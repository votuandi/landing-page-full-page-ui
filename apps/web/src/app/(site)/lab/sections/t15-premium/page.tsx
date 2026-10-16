import { PageRenderer, pageConfigSchema, sectionRegistry, createCollectionLoader, type Locale, type SiteContext } from "@solar/sections";
import { staticCollectionSource } from "../../../../lib/sectionCollections";

const types = ["products", "dealer", "branch-map", "press", "tiktok", "social", "investment-models", "warranty", "about-story", "services"];
const page = pageConfigSchema.parse({ sections: types.map((type) => ({
  id: type, type, variant: "t15", data: sectionRegistry.getType(type)?.defaults,
})) });

export default async function PremiumLabPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale: Locale = (await searchParams).lang === "en" ? "en" : "vi";
  const site: SiteContext = { tenantId: "lab-demo", locale, themeId: "t15" };
  return <PageRenderer page={page} site={site} loadData={createCollectionLoader(staticCollectionSource)} />;
}
