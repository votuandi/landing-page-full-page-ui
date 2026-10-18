import { z } from "zod";
import { localized, richText, storySource, collectionSchemas } from "@solar/sections";
import { resolvePrice } from "@solar/core";
import type { Feature } from "@solar/plans";

export const COLLECTIONS = ["product", "productCategory", "brand", "project", "post", "story", "testimonial", "branch", "faq", "service", "certificate", "pressItem"] as const;
export type Collection = typeof COLLECTIONS[number];
export const textValue = z.union([z.string().max(5000), localized({ multiline: true, max: 5000 })]);
export const asset = z.string().max(2000).refine((value) => {
  try {
    const decoded = decodeURIComponent(value);
    return /^\/(?!\/)/.test(decoded) && !/[\\\s?#]/.test(decoded) && !decoded.includes("..")
      || new URL(value).protocol === "https:";
  } catch { return false; }
});
export const contentImage = z.union([asset, z.uuid()]);
export const productSchema = z.object({
  powerKw: z.number().nonnegative(), images: z.array(contentImage).min(1), warranty: textValue,
  tech: z.array(z.string()), segment: z.array(z.enum(["home", "business", "project"])),
  specs: z.record(z.string(), textValue), compatible: z.array(z.string()).optional(), unit: textValue.optional(), datasheet: z.preprocess((value) => value === "#" ? undefined : value, asset.optional()),
});
export const projectSchema = z.object({ location: textValue, image: contentImage, detail: textValue, metrics: z.array(z.tuple([textValue, textValue])), savingPerMonth: z.number().nonnegative().optional() });
export const postSchema = z.object({ excerpt: textValue, cover: contentImage, readMinutes: z.number().int().positive(), body: z.union([z.array(textValue), richText()]) });
export const serviceSchema = z.object({ audience: textValue, problem: textValue, solution: textValue, image: contentImage, price: textValue, packages: z.array(z.tuple([textValue, textValue])), segment: z.enum(["household", "shop", "factory", "farm"]).optional(), steps: z.array(textValue).optional() });
export const faqSchema = z.object({ question: textValue, answer: textValue });
export const certificateSchema = z.object({ issuer: z.string(), number: z.string(), validUntil: z.string(), image: contentImage });
export const pressItemSchema = z.object({ url: z.url().refine((url) => new URL(url).protocol === "https:"), excerpt: textValue.optional() });
const segment = z.enum(["household", "shop", "factory", "farm"]);
const optionalRef = () => z.uuid().nullable().optional();
const amount = () => z.number().int().nonnegative().max(2_147_483_647).nullable().optional();
const empty = z.object({});
const sample = "[DỮ LIỆU MẪU] Nội dung mới";
const image = "/images/t07/solar-home-hero.webp";
export type CollectionDef = {
  name: Collection; path: string; label: { vi: string; en?: string }; entitlement?: Feature;
  columns: z.ZodObject; data: z.ZodType;
  defaults: { title: { vi: string; en?: string }; columns: Record<string, unknown>; data: unknown };
  filters?: readonly string[];
};
function def(name: Collection, path: string, label: string, columns: z.ZodObject, data: z.ZodType,
  defaultColumns: Record<string, unknown>, defaultData: unknown, entitlement?: Feature, filters?: readonly string[]): CollectionDef {
  return { name, path, label: { vi: label }, columns, data, defaults: { title: { vi: sample }, columns: defaultColumns, data: defaultData }, entitlement, filters };
}
export const collectionDefs: Record<Collection, CollectionDef> = {
  product: def("product", "san-pham", "Sản phẩm", z.object({ categoryId: optionalRef(), brandId: optionalRef(), price: amount(), salePrice: amount(), featured: z.boolean().default(false), segments: z.array(z.enum(["home", "business", "project"])).default([]) }), productSchema,
    { categoryId: null, brandId: null, price: null, salePrice: null, featured: false, segments: [] }, { powerKw: 1, images: [image], warranty: sample, tech: [], segment: [], specs: {} }, "catalog", ["categoryId"]),
  productCategory: def("productCategory", "danh-muc-san-pham", "Danh mục sản phẩm", z.object({ parentId: optionalRef() }), z.looseObject({}), { parentId: null }, {}, "catalog"),
  brand: def("brand", "thuong-hieu", "Thương hiệu", z.object({ logoMediaId: optionalRef() }), z.looseObject({}), { logoMediaId: null }, {}, "catalog"),
  project: def("project", "du-an", "Dự án", z.object({ segment, kwp: z.number().positive(), featured: z.boolean().default(false), coverMediaId: optionalRef() }), projectSchema,
    { segment: "household", kwp: 5, featured: false, coverMediaId: null }, { location: sample, image, detail: sample, metrics: [] }, undefined, ["segment"]),
  post: def("post", "bai-viet", "Bài viết", z.object({ segment: segment.nullable().optional(), coverMediaId: optionalRef(), tags: z.array(z.string().max(100)).max(100).default([]) }), postSchema,
    { segment: null, coverMediaId: null, tags: [] }, { excerpt: sample, cover: image, readMinutes: 1, body: [sample] }, "blog", ["segment"]),
  story: def("story", "video", "Video Shorts", z.object({ segment, kind: z.enum(["progress", "done", "customer"]), posterMediaId: optionalRef() }), z.object({ location: z.string().min(1).max(1500), kwp: z.number().positive(), poster: z.union([contentImage, collectionSchemas.stories.shape.poster]), source: storySource }),
    { segment: "household", kind: "done", posterMediaId: null }, { location: sample, kwp: 5, poster: image, source: { provider: "youtube", idOrSrc: "abcdef12345" } }, "shorts", ["segment", "kind"]),
  testimonial: def("testimonial", "danh-gia", "Đánh giá", z.object({ segment, rating: z.number().min(0).max(5) }), collectionSchemas.testimonials.omit({ id: true, name: true, segment: true, rating: true }),
    { segment: "household", rating: 5 }, { location: sample, kwp: 5, quote: sample }, undefined, ["segment"]),
  branch: def("branch", "chi-nhanh", "Chi nhánh", z.object({ isPrimary: z.boolean().default(false) }), collectionSchemas.branches.omit({ id: true, name: true, primary: true, hotline: true, hours: true }).extend({
    hotline: z.union([collectionSchemas.branches.shape.hotline, z.object({ main: collectionSchemas.branches.shape.hotline })]), hours: z.string().optional(), openingHours: z.string().optional(),
  }), { isPrimary: false }, { hotline: "0901234567", hours: "8:00–17:00", office: { address: sample, lat: 16, lng: 108 } }, "branchMap"),
  faq: def("faq", "faq", "FAQ", z.object({ group: z.string().max(200).nullable().optional() }), faqSchema, { group: null }, { question: sample, answer: sample }, undefined, ["group"]),
  service: def("service", "dich-vu", "Dịch vụ", empty, serviceSchema, {}, { audience: sample, problem: sample, solution: sample, image, price: "Liên hệ", packages: [] }),
  certificate: def("certificate", "chung-chi", "Chứng chỉ", empty, certificateSchema, {}, { issuer: sample, number: sample, validUntil: "2030", image }),
  pressItem: def("pressItem", "bao-chi", "Báo chí", empty, pressItemSchema, {}, { url: "https://example.com", excerpt: sample }, "press"),
};
export function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200).replace(/-$/, "");
}
export function collectionFormSchema(name: Collection) {
  const definition = collectionDefs[name];
  return z.object({
    slug: z.string().max(200).optional(),
    title: localized({ max: 1500 }).refine(t => t.vi.trim().length > 0, "Vui lòng nhập tiêu đề"),
    status: z.enum(["draft", "published"]), columns: definition.columns, data: definition.data,
  }).strict().superRefine((input, ctx) => {
    const data = input.data as Record<string, unknown>;
    // Legacy readers keep their permissive parser; writes must also meet the public item's display constraints.
    const label = (value: unknown, locale: "vi" | "en") => typeof value === "string" ? value : value && typeof value === "object"
      ? (value as Record<string, unknown>)[locale] ?? (value as Record<string, unknown>).vi : undefined;
    const invalidFields = new Set<string>();
    for (const locale of ["vi", "en"] as const) {
      const fields: [string, unknown, z.ZodType][] = [];
      if (name === "product") {
        fields.push(["images", (data.images as string[]).map(id => ({ id, alt: input.title })), collectionSchemas.products.shape.images],
          ["warranty", label(data.warranty, locale), collectionSchemas.products.shape.warranty],
          ["unit", label(data.unit, locale), collectionSchemas.products.shape.unit],
          ["specs", Object.entries(data.specs as Record<string, unknown>).map(([key, value]) => ({ label: key, value: label(value, locale) })), collectionSchemas.products.shape.specs]);
      }
      if (name === "project") fields.push(["location", label(data.location, locale), collectionSchemas.projects.shape.location]);
      if (name === "post") fields.push(["excerpt", label(data.excerpt, locale), collectionSchemas.posts.shape.excerpt]);
      for (const [field, value, schema] of fields) if (!invalidFields.has(field) && !schema.safeParse(value).success) {
        invalidFields.add(field);
        const labels: Record<string, string> = { images: "hình ảnh", warranty: "bảo hành", unit: "đơn vị", specs: "thông số", location: "địa điểm", excerpt: "tóm tắt" };
        ctx.addIssue({ code: "custom", path: ["data", field], message: `Nội dung ${labels[field]} không hợp lệ để hiển thị trên website` });
      }
    }
    if (name === "product") {
      const { price, salePrice } = input.columns as { price?: number | null; salePrice?: number | null };
      const resolved = resolvePrice(price ?? undefined, salePrice ?? undefined);
      if (price != null && salePrice != null && (salePrice >= price || (salePrice > 0 && resolved.original === undefined))) {
        ctx.addIssue({ code: "custom", path: ["columns", "salePrice"], message: "Giá giảm phải nhỏ hơn giá gốc" });
      }
    }
  });
}
export function collectionInputSchema(name: Collection) {
  return collectionFormSchema(name).safeExtend({ id: z.uuid().optional() });
}
