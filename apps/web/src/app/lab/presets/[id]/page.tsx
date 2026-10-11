import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { getPreset, loadPreset } from "@solar/presets";
import { SiteStateProvider, SiteWidgets } from "@solar/sections";
import { getTheme, themeFontCss, themeFontFiles } from "@solar/themes";
import { themeToCss } from "@solar/tokens";
import PresetPage from "@/components/PresetPage";

export default async function PresetLabPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ theme?: string }>;
}) {
  const { id } = await params;
  if (!getPreset(id)) notFound();
  const loaded = loadPreset(id);
  const { theme: override } = await searchParams;
  const theme = override ? getTheme(override) : loaded.theme;
  if (!theme) notFound();
  for (const file of themeFontFiles(theme)) preload(`/fonts/${file}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  const site = { tenantId: "preset-demo", locale: "vi" as const, themeId: theme.meta.id };
  return <SiteStateProvider calculatorHref={`/lab/presets/${id}#du-toan`}>
    <style>{themeToCss(theme) + themeFontCss(theme)}</style>
    <PresetPage loaded={loaded} site={site} />
    <SiteWidgets widgets={loaded.widgets} site={site} slot="overlay" />
  </SiteStateProvider>;
}
