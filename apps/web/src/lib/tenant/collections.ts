import { cached, cacheKey, tenantTag, collectionTag, type ContentCache } from "@solar/cache";
import { cache } from "react";
import { z } from "zod";
import { collectionSchemas, createCollectionLoader, widgetRegistry, type CollectionSource, type LoadSectionData } from "@solar/sections";
import type { TenantRepo } from "@solar/db";
import type { Product } from "../../data/products";
import { contentImage, parseContent, postSchema, productSchema, projectSchema, serviceSchema, text, textValue } from "./contentSchemas";
import { tenantRepository } from "./siteData";
import { COLLECTIONS } from "./cacheTags";

export type Collection = typeof COLLECTIONS[number];
type RecordRow = { id: string; slug: string; title: unknown; data: unknown; price?: number | null; salePrice?: number | null; featured?: boolean; kwp?: number | null; segment?: string | null; segments?: string[]; kind?: string; rating?: number; isPrimary?: boolean };
const segment = z.enum(["household", "shop", "factory", "farm"]);
const media = (id: string, title: string) => ({ id, alt: { vi: title } });
const object = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function createCollections(repo: TenantRepo, tenantId: string, locale: "vi" | "en" = "vi", contentCache?: Pick<ContentCache, "cached">, siteId = tenantId) {
  // Request dedupe surrounds the optional process cache of published records.
  const reads = new Map<Collection, Promise<RecordRow[]>>();
  function records(name: Collection) {
    // Prisma's generated generic signatures differ by model; all these repositories support this read shape.
    const list = repo[name].list as (args: { where: { status: "published" }; orderBy: ({ order: "asc" } | { id: "asc" })[] }) => Promise<RecordRow[]>;
    const load = () => list({ where: { status: "published" }, orderBy: [{ order: "asc" }, { id: "asc" }] }).then((rows) => rows.filter((row) => {
      if (label(row.title).trim()) return true;
      console.error("[tenant] title collection lỗi", { tenantId, collection: name, recordId: row.id });
      return false;
    }));
    if (!reads.has(name)) reads.set(name, contentCache ? contentCache.cached(load, {
      keyParts: cacheKey({ siteId, locale, mode: "published", parts: ["collection", name] }),
      tags: [tenantTag(tenantId), collectionTag(tenantId, name)],
    }) : load());
    return reads.get(name)!;
  }
  const context = (name: string, row: RecordRow) => ({ tenantId, collection: name, recordId: row.id });
  const label = (value: unknown) => text(value, locale);
  const productItem = (item: Product & { id: string; categoryLabel: string }) => ({ ...item, images: item.images.map((id) => media(id, item.name)), specs: Object.entries(item.specs).map(([label, value]) => ({ label, value })), href: `/san-pham/${item.slug}` });
  async function products(): Promise<(Product & { id: string; categoryLabel: string })[]> {
    const [rows, categories, brands] = await Promise.all([records("product"), records("productCategory"), records("brand")]);
    return rows.flatMap((row) => {
      const data = parseContent(productSchema, row.data, context("product", row));
      if (!data) return [];
      const raw = row as RecordRow & { categoryId: string | null; brandId: string | null };
      const category = categories.find((item) => item.id === raw.categoryId);
      const brand = brands.find((item) => item.id === raw.brandId);
      const item = { id: row.id, slug: row.slug, name: label(row.title), brand: brand ? label(brand.title) : locale === "en" ? "Unbranded" : "Không thương hiệu", category: (category?.slug ?? "uncategorized") as Product["category"], categoryLabel: category ? label(category.title) : locale === "en" ? "Uncategorized" : "Chưa phân loại",
        images: data.images, powerKw: data.powerKw, price: row.price ?? undefined, salePrice: row.salePrice ?? undefined,
        featured: row.featured, unit: label(data.unit) || undefined, datasheet: data.datasheet, warranty: label(data.warranty), tech: data.tech, segment: (row.segments ?? data.segment) as Product["segment"],
        specs: Object.fromEntries(Object.entries(data.specs).map(([key, value]) => [key, label(value)])), compatible: data.compatible };
      return parseContent(collectionSchemas.products, productItem(item), context("product", row)) ? [item] : [];
    });
  }
  async function posts() {
    return (await records("post")).flatMap((row) => {
      const data = parseContent(postSchema, row.data, context("post", row));
      if (!data) return [];
      const item = { id: row.id, slug: row.slug, title: label(row.title), excerpt: label(data.excerpt), cover: data.cover, readMinutes: data.readMinutes, body: data.body, segment: row.segment ?? undefined };
      return parseContent(collectionSchemas.posts, { ...item, cover: media(item.cover, item.title), href: `/tin-tuc/${item.slug}` }, context("post", row)) ? [item] : [];
    });
  }
  async function projects() {
    return (await records("project")).flatMap((row) => {
      const data = parseContent(projectSchema, row.data, context("project", row));
      const kind = segment.safeParse(row.segment);
      if (!data || !kind.success || !row.kwp) { console.error("[tenant] project lỗi", context("project", row)); return []; }
      const item = { id: row.id, slug: row.slug, title: label(row.title), segment: kind.data, kwp: row.kwp,
        location: label(data.location), image: data.image, detail: label(data.detail), metrics: data.metrics.map(([a, b]) => [label(a), label(b)] as [string, string]), savingPerMonth: data.savingPerMonth };
      return parseContent(collectionSchemas.projects, { ...item, image: media(item.image, item.title), href: `/cong-trinh/${item.slug}` }, context("project", row)) ? [item] : [];
    });
  }
  async function services() {
    return (await records("service")).flatMap((row) => {
      const data = parseContent(serviceSchema, row.data, context("service", row));
      return data ? [{ id: row.id, slug: row.slug, title: label(row.title), image: data.image, audience: label(data.audience), problem: label(data.problem), solution: label(data.solution), price: label(data.price), packages: data.packages.map(([a, b]) => [label(a), label(b)] as [string, string]), segment: data.segment, steps: data.steps?.map(label) }] : [];
    });
  }
  const source: CollectionSource = {
    products: async () => (await products()).map(productItem),
    projects: async () => (await projects()).map((item) => ({ ...item, image: media(item.image, item.title), href: `/cong-trinh/${item.slug}` })),
    posts: async () => (await posts()).map((item) => ({ ...item, cover: media(item.cover, item.title), href: `/tin-tuc/${item.slug}` })),
    branches: async () => (await records("branch")).flatMap((row) => {
      const raw = object(row.data);
      const hotline = object(raw.hotline);
      const item = parseContent(collectionSchemas.branches, { ...raw, id: row.id, name: label(row.title), primary: row.isPrimary ?? raw.primary, hotline: typeof raw.hotline === "string" ? raw.hotline : hotline.main, hours: raw.openingHours ?? raw.hours }, context("branch", row));
      return item ? [item] : [];
    }),
    stories: async () => (await records("story")).flatMap((row) => {
      const raw = object(row.data);
      const item = parseContent(collectionSchemas.stories, { ...raw, id: row.id, title: label(row.title), segment: row.segment ?? raw.segment, kind: row.kind ?? raw.type ?? raw.kind, poster: typeof raw.poster === "string" ? media(raw.poster, label(row.title)) : raw.poster }, context("story", row));
      return item ? [item] : [];
    }),
    testimonials: async () => (await records("testimonial")).flatMap((row) => {
      const raw = object(row.data);
      const item = parseContent(collectionSchemas.testimonials, { ...raw, id: row.id, name: label(row.title), segment: row.segment ?? raw.segment, rating: row.rating ?? raw.rating }, context("testimonial", row));
      return item ? [item] : [];
    }),
  };
  async function faqs() {
    const schema = z.object({ question: textValue, answer: textValue });
    return (await records("faq")).flatMap((row) => {
      const data = parseContent(schema, row.data, context("faq", row));
      return data ? [{ id: row.id, question: label(data.question), answer: label(data.answer) }] : [];
    });
  }
  async function certificates() {
    const schema = z.object({ issuer: z.string(), number: z.string(), validUntil: z.string(), image: contentImage });
    return (await records("certificate")).flatMap((row) => {
      const data = parseContent(schema, row.data, context("certificate", row));
      return data ? [{ ...data, id: row.id, title: label(row.title) }] : [];
    });
  }
  async function press() {
    const schema = z.object({ url: z.url().refine((url) => new URL(url).protocol === "https:"), excerpt: textValue.optional() });
    return (await records("pressItem")).flatMap((row) => {
      const data = parseContent(schema, row.data, context("pressItem", row));
      return data ? [{ id: row.id, title: label(row.title), url: data.url, excerpt: label(data.excerpt) }] : [];
    });
  }
  return { source, products, posts, projects, services, faqs, certificates, press };
}
export const tenantCollections = cache((tenantId: string, locale: "vi" | "en", siteId: string) => createCollections(tenantRepository(tenantId), tenantId, locale, { cached }, siteId));
export type TenantCollections = ReturnType<typeof createCollections>;

// A cart lookup covers every accepted SKU, independent of display filters and pagination.
export function createTenantWidgetLoader(source: CollectionSource): LoadSectionData {
  const load = createCollectionLoader(source, widgetRegistry);
  return (args) => args.section.type === "quote-cart"
    ? Promise.resolve(source.products?.(args.site) ?? []).then((items) => ({ ...args.data as object, items }))
    : load(args);
}
