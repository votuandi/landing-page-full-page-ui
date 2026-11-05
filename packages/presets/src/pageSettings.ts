import { z } from "zod";
import { PAGE_TYPES } from "./pages";
import { isLandingSlug } from "./structure";

const localized = (max: number) => z.strictObject({ vi: z.string().max(max, `Tối đa ${max} ký tự`), en: z.string().max(max, `Tối đa ${max} ký tự`).optional() });
export const pageSettingsSchema = z.strictObject({
  seo: z.strictObject({ title: localized(70).optional(), description: localized(160).optional(), noindex: z.boolean().optional() }).optional(),
  hideHeader: z.boolean().optional(), hideFooter: z.boolean().optional(),
});
export type PageSettings = z.infer<typeof pageSettingsSchema>;

export function parsePageSettings(value: unknown): PageSettings {
  if (value == null) return {};
  const parsed = pageSettingsSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  console.error("[page] Cài đặt trang không hợp lệ, dùng mặc định");
  return {};
}

const reserved = new Set([...Object.values(PAGE_TYPES).filter(type => type.kind !== "page").map(type => type.slug), "sites", "api", "lab"]);
export function landingSlugIssue(slug: string): string | null {
  if (!slug || slug.length > 120 || slug.split("/").length > 3 || !slug.split("/").every(part => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part))) {
    return "Đường dẫn gồm 1–3 đoạn chữ thường, số và dấu gạch ngang, tối đa 120 ký tự";
  }
  if (!isLandingSlug(slug) || reserved.has(slug.split("/")[0])) return "Đường dẫn dành riêng cho trang hệ thống";
  return null;
}
