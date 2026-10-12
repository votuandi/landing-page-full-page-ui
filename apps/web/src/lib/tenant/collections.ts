import { cache } from "react";
import { z } from "zod";
import { collectionSchemas, type CollectionSource } from "@solar/sections";
import type { TenantRepo } from "@solar/db";
import type { Product } from "../../data/products";
import { contentImage, parseContent, postSchema, productSchema, projectSchema, serviceSchema, text, textValue } from "./contentSchemas";
import { tenantRepository } from "./siteData";

export type Collection = "product" | "productCategory" | "brand" | "project" | "post" | "story" | "testimonial" | "branch" | "faq" | "service" | "certificate" | "pressItem";
type RecordRow = { id: string; slug: string; title: unknown; data: unknown; price?: number | null; salePrice?: number | null; featured?: boolean; kwp?: number | null; segment?: string | null };
const segment = z.enum(["household", "shop", "factory", "farm"]);
const media = (id: string, title: string) => ({ id, alt: { vi: title } });
const object = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

export function createCollections(repo: TenantRepo, tenantId: string, locale: "vi" | "en" = "vi") {
  // These promises live in the request-scoped adapter, never in a process-wide content cache.
  const reads = new Map<Collection, Promise<RecordRow[]>>();
  function records(name: Collection) {
    // Prisma's generated generic signatures differ by model; all these repositories support this read shape.
    const list = repo[name].list as (args: { where: { status: "published" }; orderBy: ({ order: "asc" } | { id: "asc" })[] }) => Promise<RecordRow[]>;
    if (!reads.has(name)) reads.set(name, list({ where: { status: "published" }, orderBy: [{ order: "asc" }, { id: "asc" }] }).then((rows) => rows.filter((row) => {
      if (label(row.title).trim()) return true;
      console.error("[tenant] title collection lỗi", { tenantId, collection: name, recordId: row.id });
      return false;
    })));
    return reads.get(name)!;
  }
  const context = (name: string, row: RecordRow) => ({ tenantId, collection: name, recordId: row.id });
  const label = (value: unknown) => text(value, locale);
  async function products(): Promise<(Product & { id: string; categoryLabel: string })[]> {
    const [rows, categories, brands] = await Promise.all([records("product"), records("productCategory"), records("brand")]);
    return rows.flatMap((row) => {
      const data = parseContent(productSchema, row.data, context("product", row));
      if (!data) return [];
      const raw = row as RecordRow & { categoryId: string | null; brandId: string | null };
      const category = categories.find((item) => item.id === raw.categoryId);
      const brand = brands.find((item) => item.id === raw.brandId);
      if (!category || !brand) return [];
      return [{ id: row.id, slug: row.slug, name: label(row.title), brand: label(brand.title), category: category.slug as Product["category"], categoryLabel: label(category.title),
        images: data.images, powerKw: data.powerKw, price: row.price ?? undefined, salePrice: row.salePrice ?? undefined,
        featured: row.featured, unit: label(data.unit) || undefined, warranty: label(data.warranty), tech: data.tech, segment: data.segment,
        specs: Object.fromEntries(Object.entries(data.specs).map(([key, value]) => [key, label(value)])), compatible: data.compatible }];
    });
  }
  async function posts() {
    return (await records("post")).flatMap((row) => {
      const data = parseContent(postSchema, row.data, context("post", row));
      return data ? [{ id: row.id, slug: row.slug, title: label(row.title), excerpt: label(data.excerpt), cover: data.cover, readMinutes: data.readMinutes, body: data.body }] : [];
    });
  }
  async function projects() {
    return (await records("project")).flatMap((row) => {
      const data = parseContent(projectSchema, row.data, context("project", row));
      const kind = segment.safeParse(row.segment);
      return data && kind.success && row.kwp ? [{ id: row.id, slug: row.slug, title: label(row.title), segment: kind.data, kwp: row.kwp,
        location: label(data.location), image: data.image, detail: label(data.detail), metrics: data.metrics.map(([a, b]) => [label(a), label(b)] as [string, string]), savingPerMonth: data.savingPerMonth }] : [];
    });
  }
  async function services() {
    return (await records("service")).flatMap((row) => {
      const data = parseContent(serviceSchema, row.data, context("service", row));
      return data ? [{ id: row.id, slug: row.slug, title: label(row.title), image: data.image, audience: label(data.audience), problem: label(data.problem), solution: label(data.solution), price: label(data.price), packages: data.packages.map(([a, b]) => [label(a), label(b)] as [string, string]) }] : [];
    });
  }
  const source: CollectionSource = {
    products: async () => (await products()).map((item) => ({ ...item, images: item.images.map((id) => media(id, item.name)), specs: Object.entries(item.specs).map(([label, value]) => ({ label, value })), href: `/san-pham/${item.slug}` })),
    projects: async () => (await projects()).map((item) => ({ ...item, image: media(item.image, item.title), href: `/cong-trinh/${item.slug}` })),
    posts: async () => (await posts()).map((item) => ({ ...item, cover: media(item.cover, item.title), href: `/tin-tuc/${item.slug}` })),
    branches: async () => (await records("branch")).flatMap((row) => {
      const raw = object(row.data);
      const hotline = object(raw.hotline);
      const item = parseContent(collectionSchemas.branches, { ...raw, id: row.id, name: label(row.title), hotline: typeof raw.hotline === "string" ? raw.hotline : hotline.main, hours: raw.openingHours ?? raw.hours }, context("branch", row));
      return item ? [item] : [];
    }),
    stories: async () => (await records("story")).flatMap((row) => {
      const raw = object(row.data);
      const item = parseContent(collectionSchemas.stories, { ...raw, id: row.id, title: label(row.title), kind: raw.type ?? raw.kind, poster: typeof raw.poster === "string" ? media(raw.poster, label(row.title)) : raw.poster }, context("story", row));
      return item ? [item] : [];
    }),
    testimonials: async () => (await records("testimonial")).flatMap((row) => {
      const item = parseContent(collectionSchemas.testimonials, { ...object(row.data), id: row.id, name: label(row.title) }, context("testimonial", row));
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
export const tenantCollections = cache((tenantId: string, locale: "vi" | "en") => createCollections(tenantRepository(tenantId), tenantId, locale));
export type TenantCollections = ReturnType<typeof createCollections>;
