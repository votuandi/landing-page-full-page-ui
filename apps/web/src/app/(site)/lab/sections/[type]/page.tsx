import Link from "next/link";
import { notFound } from "next/navigation";
import { PageRenderer, pageConfigSchema, sectionRegistry, createCollectionLoader, type Locale } from "@solar/sections";
import { themes, getTheme, themeFontCss } from "@solar/themes";
import { themeToCss } from "@solar/tokens";
import { staticCollectionSource } from "../../../../../lib/sectionCollections";
import { labPalette, selectLabIds } from "../matrix-data";

// Lab queries select variants/themes at request time, including thumbnail captures.
export const instant = false;

export default async function SectionMatrixPage({ params, searchParams }: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ themes?: string; variant?: string; lang?: string }>;
}) {
  const { type } = await params;
  const def = sectionRegistry.getType(type);
  const variants = sectionRegistry.variantsOf(type);
  if (!def || !variants) notFound();
  const query = await searchParams;
  const selectedThemes = selectLabIds(query.themes, themes.map((theme) => theme.meta.id)).map((id) => getTheme(id)!);
  const selectedVariants = selectLabIds(query.variant, variants);
  const locale: Locale = query.lang === "en" ? "en" : "vi";
  return <main className="bg-bg text-fg">
    <header className="px-4 py-6">
      <Link href="/lab/sections/matrix" className="text-primary underline">Ma trận section</Link>
      <h1 className="mt-2 text-2xl font-bold">{type} · [DỮ LIỆU MẪU]</h1>
    </header>
    <script type="application/json" id="lab-palette" dangerouslySetInnerHTML={{
      __html: JSON.stringify(labPalette(selectedThemes)).replace(/</g, "\\u003c"),
    }} />
    <div className="flex flex-wrap gap-6">
      {selectedThemes.map((theme) => {
        const themeId = theme.meta.id;
        const scope = `[data-lab-theme="${themeId}"]`;
        return <div key={themeId} data-lab-theme={themeId} className="min-w-0 flex-1 basis-full bg-bg text-fg font-sans xl:basis-0">
          <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, undefined, { scope }) + themeFontCss(theme, undefined, scope) }} />
          {selectedVariants.map((variant) => <div key={variant}>
            <h2 className="px-4 py-3 text-sm font-semibold">{type} · {variant} · {themeId}</h2>
            <div data-lab-cell={`${variant}--${themeId}`} data-lab-variant={variant} data-lab-theme-id={themeId}
              className="relative isolate bg-bg text-fg" style={{ transform: "translateZ(0)" }}>
              <PageRenderer page={pageConfigSchema.parse({ sections: [{ id: type, type, variant, data: def.defaults }] })}
                site={{ tenantId: "lab-demo", locale, themeId }} loadData={createCollectionLoader(staticCollectionSource)} />
            </div>
          </div>)}
        </div>;
      })}
    </div>
  </main>;
}
