import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { getPreset, loadPreset } from "@solar/presets";
import { SiteStateProvider, SiteWidgets, sectionRegistry, pageConfigSchema } from "@solar/sections";
import { getTheme, themeFontCss, themeFontFiles } from "@solar/themes";
import { themeToCss } from "@solar/tokens";
import PresetPage from "@/components/PresetPage";

export default async function PresetLabPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ theme?: string; subpage?: string }>;
}) {
  const { id } = await params;
  if (!getPreset(id)) notFound();
  // loadPreset returns shared data; subpage rendering must only replace this request's page.
  const loaded = { ...loadPreset(id) };
  const { theme: override, subpage } = await searchParams;
  const theme = override ? getTheme(override) : loaded.theme;
  if (!theme) notFound();
  if (subpage) {
    if (!loaded.preset.subpages?.includes(subpage)) notFound();
    const def = sectionRegistry.types["page-hero"];
    const title = subpage === "gioi-thieu" ? "Giới thiệu" : "Giải pháp điện mặt trời";
    const header = loaded.page.sections.filter((section) => section.type === "site-header");
    const footer = loaded.page.sections.filter((section) => section.type === "site-footer");
    loaded.page = pageConfigSchema.parse({ sections: [...header, {
      id: "page-hero", type: "page-hero", variant: "t03", data: {
        ...def.defaults, title: { vi: title }, eyebrow: { vi: loaded.preset.name },
      },
    }, ...loaded.page.sections.filter((section) => section.type === "about-story").slice(0, 1), ...footer] });
  }
  for (const file of themeFontFiles(theme)) preload(`/fonts/${file}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  const site = { tenantId: "preset-demo", locale: "vi" as const, themeId: theme.meta.id };
  return <SiteStateProvider calculatorHref={`/lab/presets/${id}#du-toan`}>
    <style>{themeToCss(theme) + themeFontCss(theme)}</style>
    <PresetPage loaded={loaded} site={site} />
    <SiteWidgets widgets={loaded.widgets} site={site} slot="overlay" />
  </SiteStateProvider>;
}
