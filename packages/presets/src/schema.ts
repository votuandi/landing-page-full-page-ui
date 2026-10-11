import { z } from "zod";
import { pageSectionSchema, pageConfigSchema, sectionRegistry, siteWidgetsSchema, widgetRegistry } from "@solar/sections";
import { getTheme } from "@solar/themes";

export const presetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  group: z.enum(["signature", "pro", "classic"]),
  themeId: z.string().min(1),
  description: z.string().optional(),
  source: z.object({ branch: z.string().min(1) }),
  sections: z.array(pageSectionSchema.extend({ data: z.unknown().optional(), note: z.string().optional() })),
  widgets: siteWidgetsSchema.strict(),
  subpages: z.array(z.string().min(1)).optional(),
}).superRefine((preset, ctx) => {
  if (!getTheme(preset.themeId)) ctx.addIssue({ code: "custom", path: ["themeId"], message: `Theme không tồn tại: ${preset.themeId}` });
  const page = pageConfigSchema.safeParse({ sections: preset.sections.map((section) => ({
    ...section, data: section.data ?? sectionRegistry.getType(section.type)?.defaults ?? null,
  })) });
  if (!page.success) for (const issue of page.error.issues) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
  const check = (type: string, variant: string, data: unknown, path: (string | number)[], registry: typeof sectionRegistry | typeof widgetRegistry) => {
    const def = registry.getType(type);
    if (!def || !registry.variantsOf(type)?.includes(variant)) {
      ctx.addIssue({ code: "custom", path, message: `Type/variant không tồn tại: ${type}/${variant}` });
      return;
    }
    const result = def.schema.safeParse(data ?? def.defaults);
    if (!result.success) for (const issue of result.error.issues) ctx.addIssue({ code: "custom", path: [...path, "data", ...issue.path], message: issue.message });
  };
  preset.sections.forEach((section, i) => check(section.type, section.variant, section.data, ["sections", i], sectionRegistry));
  for (const [type, entry] of Object.entries(preset.widgets)) {
    if (entry) check(type, entry.variant, entry.data, ["widgets", type], widgetRegistry);
  }
});

export type Preset = z.output<typeof presetSchema>;
