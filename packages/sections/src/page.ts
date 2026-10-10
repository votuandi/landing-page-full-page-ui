import { z } from "zod";

// E5 lưu mảng này trong Page.sections; data parse theo schema của type lúc render.
export const pageSectionSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  variant: z.string().min(1),
  enabled: z.boolean().default(true),
  anchor: z.string().regex(/^[a-z0-9-]+$/).optional(),
  data: z.unknown(),
});

const unique = (values: string[]) => new Set(values).size === values.length;

export const pageConfigSchema = z.object({ sections: z.array(pageSectionSchema) })
  .refine(({ sections }) => unique(sections.map((section) => section.id)),
    { message: "id section bị trùng", path: ["sections"] })
  .refine(({ sections }) => unique(sections.flatMap((section) => section.anchor ?? [])),
    { message: "anchor bị trùng", path: ["sections"] });

export type PageSection = z.output<typeof pageSectionSchema>;
export type PageConfig = z.output<typeof pageConfigSchema>;
