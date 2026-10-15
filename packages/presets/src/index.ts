import { pageConfigSchema, sectionRegistry } from "@solar/sections";
import { getTheme } from "@solar/themes";
import t15 from "../t15.json";
import t01 from "../t01.json";
import t02 from "../t02.json";
import t03 from "../t03.json";
import t04 from "../t04.json";
import t05 from "../t05.json";
import t06 from "../t06.json";
import t07 from "../t07.json";
import t08 from "../t08.json";
import t09 from "../t09.json";
import t10 from "../t10.json";
import t11 from "../t11.json";
import t12 from "../t12.json";
import t13 from "../t13.json";
import t14 from "../t14.json";
import { presetSchema } from "./schema";

export { presetSchema };
export { PAGE_TYPES, PAGE_TYPE_IDS, isPageType, pageTypeOfRoute } from "./pages";
export type { PageTypeDef, PageTypeId } from "./pages";
export { applyPlanToPreset, presetPageTypes, validateSiteStructure } from "./structure";
export type { Can, SiteStructure } from "./structure";
export type { Preset } from "./schema";
import type { Preset } from "./schema";
export const presets = [presetSchema.parse(t15), presetSchema.parse(t01), presetSchema.parse(t02), presetSchema.parse(t03), presetSchema.parse(t04), presetSchema.parse(t05), presetSchema.parse(t06), presetSchema.parse(t07), presetSchema.parse(t08), presetSchema.parse(t09), presetSchema.parse(t10), presetSchema.parse(t11), presetSchema.parse(t12), presetSchema.parse(t13), presetSchema.parse(t14)];

/** roadmap/01-template-analysis.md §3. E6 replaces this temporary table with @solar/plans.
 * lead-form is Basic only for simple contact; Classic uses CTA links and keeps the advanced form disabled.
 */
export const BASIC_SECTION_TYPES: readonly string[] = [
  "site-header", "hero", "segments", "services", "lead-form", "projects", "process", "brands", "blog",
  "warranty", "cta-banner", "about-story", "site-footer",
];

export function getPreset(id: string) {
  return presets.find((preset) => preset.id === id);
}

// Preset là dữ liệu tĩnh trong bundle: parse một lần mỗi id rồi dùng lại (kết quả chỉ đọc).
const loaded = new Map<string, ReturnType<typeof parsePreset>>();

export function loadPreset(id: string) {
  const raw = getPreset(id);
  if (!raw) throw new Error(`Preset không tồn tại: ${id}`);
  if (!loaded.has(id)) loaded.set(id, parsePreset(raw));
  return loaded.get(id)!;
}

function parsePreset(preset: Preset) {
  const theme = getTheme(preset.themeId)!;
  const page = pageConfigSchema.parse({ sections: preset.sections.map((section) => ({
    ...section,
    data: sectionRegistry.getType(section.type)!.schema.parse(section.data ?? sectionRegistry.getType(section.type)!.defaults),
  })) });
  return { preset, theme, page, widgets: preset.widgets };
}
