import { z } from "zod";
import { richText } from "@solar/sections";
import { redirectRule } from "./seo";
import { asset, contentImage, textValue } from "@solar/db/collections";
export { asset, contentImage, textValue, productSchema, projectSchema, postSchema, serviceSchema } from "@solar/db/collections";

export function text(value: unknown, locale: "vi" | "en" = "vi"): string {
  const parsed = textValue.safeParse(value);
  return parsed.success ? typeof parsed.data === "string" ? parsed.data : parsed.data[locale] ?? parsed.data.vi : "";
}
export const profileSchema = z.object({
  name: textValue.optional(), description: textValue.optional(), email: z.email().optional(), hotline: z.string().regex(/^[\d\s+.()-]{9,20}$/).optional(),
  theme: z.object({ default: z.enum(["light", "dark"]).default("light"), switcher: z.boolean().default(false) }).default({ default: "light", switcher: false }),
  legal: z.object({ policies: z.array(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), title: textValue, summary: textValue, body: richText() })).default([]) }).default({ policies: [] }),
  guide: z.object({
    items: z.array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), label: textValue, href: z.string().regex(/^(?:#[a-z0-9-]+|\/[a-z0-9/-]+)$/).optional() })).default([]),
    glossary: z.array(z.tuple([textValue, textValue])).default([]),
    regulations: z.array(z.object({ title: textValue, note: textValue })).default([]),
    tariffs: z.array(z.tuple([z.string(), z.string()])).default([]),
  }).default({ items: [], glossary: [], regulations: [], tariffs: [] }),
  team: z.array(z.object({ name: textValue, role: textValue, image: contentImage })).default([]),
  timeline: z.array(z.tuple([z.string(), textValue, textValue])).default([]),
});
export const seoSchema = z.object({ title: textValue.optional(), description: textValue.optional(), ogImage: asset.optional(), redirects: z.array(redirectRule).max(200).default([]) });

export type Profile = z.output<typeof profileSchema>;
export function parseContent<S extends z.ZodType>(schema: S, value: unknown, context: object): z.output<S> | null {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  console.error("[tenant] dữ liệu không hợp lệ", context);
  return null;
}
