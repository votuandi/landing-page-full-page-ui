import { pageConfigSchema, sectionRegistry } from "@solar/sections";
import { getTheme } from "@solar/themes";
import t13 from "../t13.json";
import t15 from "../t15.json";
import t14 from "../t14.json";
import { presetSchema } from "./schema";

export { presetSchema };
export type { Preset } from "./schema";
export const presets = [presetSchema.parse(t15), presetSchema.parse(t13), presetSchema.parse(t14)];

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
