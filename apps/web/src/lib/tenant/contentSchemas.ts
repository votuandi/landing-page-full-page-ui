import { z } from "zod";
import { redirectRule } from "./seo";
import { asset, contentImage, textValue } from "@solar/db/collections";
export { asset, contentImage, textValue, productSchema, projectSchema, postSchema, serviceSchema } from "@solar/db/collections";

export function text(value: unknown, locale: "vi" | "en" = "vi"): string {
  const parsed = textValue.safeParse(value);
  return parsed.success ? typeof parsed.data === "string" ? parsed.data : parsed.data[locale] ?? parsed.data.vi : "";
}
import { siteProfileSchema as profileSchema } from "@solar/db/site-profile";
export { profileSchema };
export const seoSchema = z.object({ title: textValue.optional(), description: textValue.optional(), ogImage: asset.optional(), redirects: z.array(redirectRule).max(200).default([]) });

export type Profile = z.output<typeof profileSchema>;
export function parseContent<S extends z.ZodType>(schema: S, value: unknown, context: object): z.output<S> | null {
  const parsed = schema.safeParse(value);
  if (parsed.success) return parsed.data;
  console.error("[tenant] dữ liệu không hợp lệ", context);
  return null;
}
