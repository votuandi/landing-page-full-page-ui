import { PageRenderer, SiteWidgets, type SiteContext } from "@solar/sections";
import { SectionReveal } from "@solar/ui";
import type { loadPreset } from "@solar/presets";
import { catalogEnabled } from "@/config/site";

/** Inline widgets belong immediately before the preset footer. */
export default function PresetPage({ loaded, site }: { loaded: ReturnType<typeof loadPreset>; site: SiteContext }) {
  const footerIndex = loaded.page.sections.findIndex((section) => section.type === "site-footer");
  const split = footerIndex < 0 ? loaded.page.sections.length : footerIndex;
  const headerCount = loaded.page.sections[0]?.type === "site-header" ? 1 : 0;
  const canUse = (feature: string) => feature !== "catalog" || catalogEnabled;
  return <>
    <SectionReveal />
    <PageRenderer page={{ sections: loaded.page.sections.slice(0, headerCount) }} site={site} canUse={canUse} />
    <main><PageRenderer page={{ sections: loaded.page.sections.slice(headerCount, split) }} site={site} canUse={canUse} /></main>
    <SiteWidgets widgets={loaded.widgets} site={site} slot="inline" canUse={canUse} />
    <PageRenderer page={{ sections: loaded.page.sections.slice(split) }} site={site} canUse={canUse} />
  </>;
}
