import CmsSectionsLab from "./CmsSectionsLab";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { thumbnailSrc } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";
import { getTheme, themeFontCss } from "@solar/themes";
import { themeToCss } from "@solar/tokens";

export const instant = false;

export default async function CmsSectionsPage({ searchParams }: { searchParams: Promise<{ theme?: string }> }) {
  const theme = getTheme((await searchParams).theme ?? "t15") ?? getTheme("t15")!;
  const scope = `[data-lab-theme="${theme.meta.id}"]`;
  const thumbnails: Record<string, string> = {};
  await Promise.all(["hero", "calculator", "shorts", "projects"].flatMap(type => (sectionRegistry.variantsOf(type) ?? []).map(async variant => {
    const src = thumbnailSrc(theme.meta.id, type, variant);
    if (!src) return;
    // The lab runs in web; production thumbnails are served by admin's public directory.
    const image = await readFile(resolve(process.cwd(), "../admin/public", src.slice(1))).catch(() => null);
    if (image) thumbnails[`${type}--${variant}`] = `data:image/webp;base64,${image.toString("base64")}`;
  })));
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
    <h1 className="text-2xl font-semibold text-fg">[DỮ LIỆU MẪU] Sắp xếp section (CMS)</h1>
    <div data-lab-theme={theme.meta.id} className="bg-bg text-fg">
      <style dangerouslySetInnerHTML={{ __html: themeToCss(theme, undefined, { scope }) + themeFontCss(theme, undefined, scope) }} />
      <CmsSectionsLab thumbnails={thumbnails} />
    </div>
  </main>;
}
