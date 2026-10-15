import { z } from "zod";
import { localized, richText } from "@solar/sections";
import { redirectRule } from "./seo";

export const textValue = z.union([z.string().max(5000), localized({ multiline: true, max: 5000 })]);
export function text(value: unknown, locale: "vi" | "en" = "vi"): string {
  const parsed = textValue.safeParse(value);
  return parsed.success ? typeof parsed.data === "string" ? parsed.data : parsed.data[locale] ?? parsed.data.vi : "";
}
export const asset = z.string().max(2000).refine((value) => {
  try {
    const decoded = decodeURIComponent(value);
    return /^\/(?!\/)/.test(decoded) && !/[\\\s?#]/.test(decoded) && !decoded.includes("..")
      || new URL(value).protocol === "https:";
  } catch { return false; }
});
// Media UUIDs stay unresolved until E8; views show the shared token-based placeholder.
export const contentImage = z.union([asset, z.uuid()]);
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

export const productSchema = z.object({
  powerKw: z.number().nonnegative(), images: z.array(contentImage).min(1), warranty: textValue,
  tech: z.array(z.string()), segment: z.array(z.enum(["home", "business", "project"])),
  specs: z.record(z.string(), textValue), compatible: z.array(z.string()).optional(), unit: textValue.optional(), datasheet: z.preprocess((value) => value === "#" ? undefined : value, asset.optional()),
});
export const projectSchema = z.object({ location: textValue, image: contentImage, detail: textValue, metrics: z.array(z.tuple([textValue, textValue])), savingPerMonth: z.number().nonnegative().optional() });
export const postSchema = z.object({ excerpt: textValue, cover: contentImage, readMinutes: z.number().int().positive(), body: z.union([z.array(textValue), richText()]) });
export const serviceSchema = z.object({ audience: textValue, problem: textValue, solution: textValue, image: contentImage, price: textValue, packages: z.array(z.tuple([textValue, textValue])), segment: z.enum(["household", "shop", "factory", "farm"]).optional(), steps: z.array(textValue).optional() });
export type Profile = z.output<typeof profileSchema>;
export function parseContent<S extends z.ZodType>(schema: S, value: unknown, context: object): z.output<S> | null {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  console.error("[tenant] dữ liệu không hợp lệ", context);
  return null;
}
