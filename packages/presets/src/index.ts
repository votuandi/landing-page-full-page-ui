import { pageConfigSchema, sectionRegistry } from "@solar/sections";
import { getTheme } from "@solar/themes";
import t15 from "../t15.json";
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
export type { Preset } from "./schema";
export const presets = [presetSchema.parse(t15), presetSchema.parse(t05), presetSchema.parse(t06), presetSchema.parse(t07), presetSchema.parse(t08), presetSchema.parse(t09), presetSchema.parse(t10), presetSchema.parse(t11), presetSchema.parse(t12), presetSchema.parse(t13), presetSchema.parse(t14)];

export function getPreset(id: string) {
  return presets.find((preset) => preset.id === id);
}

export function loadPreset(id: string) {
  const raw = getPreset(id);
  if (!raw) throw new Error(`Preset không tồn tại: ${id}`);
  const preset = presetSchema.parse(raw);
  const theme = getTheme(preset.themeId)!;
  const page = pageConfigSchema.parse({ sections: preset.sections.map((section) => ({
    ...section,
    data: sectionRegistry.getType(section.type)!.schema.parse(section.data ?? sectionRegistry.getType(section.type)!.defaults),
  })) });
  return { preset, theme, page, widgets: preset.widgets };
}
