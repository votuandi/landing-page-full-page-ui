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

export const pageConfigSchema = z.object({ sections: z.array(pageSectionSchema) }).refine(
  ({ sections }) => new Set(sections.map((section) => section.id)).size === sections.length,
  { message: "id section bị trùng", path: ["sections"] },
);

export type PageSection = z.output<typeof pageSectionSchema>;
export type PageConfig = z.output<typeof pageConfigSchema>;
