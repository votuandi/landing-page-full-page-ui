import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createDb, forPlatform, forTenant, type Prisma } from "@solar/db";
import { widgetRegistry } from "@solar/sections";
import { buildDemo } from "../../../packages/db/prisma/seed-data";
import { createRedisCache } from "../src/lib/tenant/redis";

const action = process.argv[2];
const file = resolve("../../tooling/visual/.test-dist/tenant-fixture.json");
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
async function main() {
  if (action === "manifest") {
    const demo = buildDemo("t15");
    console.log(JSON.stringify({ ...Object.fromEntries(["products", "posts", "projects", "services"].map((key) => [key, demo.collections[key as "products"].map((item) => item.slug)])), servicePrices: demo.collections.services.map((item) => item.data.price), serviceSolutions: demo.collections.services.map((item) => item.data.solution) }));
  } else {
    const db = createDb({ pool: 5 });
    try {
      const domain = await forPlatform(db).domains.resolve("t15.localhost");
      if (!domain) throw new Error("Seed t15 before browser tests");
      const repo = forTenant(db, domain.tenantId);
      if (action === "setup" || action === "cleanup") {
        const old = await repo.domain.first({ where: { hostname: "review.localhost" } });
        if (old) await repo.site.delete(old.siteId);
        for (const item of await repo.product.list({ where: { slug: { startsWith: "review-sku-" } } })) await repo.product.delete(item.id);
        const post = await repo.post.first({ where: { slug: "review-post" } });
        if (post) await repo.post.delete(post.id);
        if (action === "cleanup") { try { unlinkSync(file); } catch {} return; }
      }
      if (action === "setup") {
        const demo = buildDemo("t15");
        const site = await repo.site.create({ name: "[DỮ LIỆU MẪU] Review", themeId: "t15", locales: ["vi", "en"], defaultLocale: "en", seo: {},
          themeOverrides: { colors: { light: { primary: "10 110 70" }, dark: { primary: "90 190 120" } } },
          profile: { name: { vi: "[DỮ LIỆU MẪU] Công ty điện mặt trời với tên rất dài để kiểm tra menu", en: "[DỮ LIỆU MẪU] Solar company with a very long name for mobile menu" }, description: { vi: "Nội dung VI", en: "English description" }, hotline: "0901234567", theme: { default: "dark", switcher: true }, guide: demo.profile.guide, legal: demo.profile.legal },
          widgets: json({ ...demo.widgets, "quote-cart": { enabled: true, variant: "t15", data: { ...widgetRegistry.getType("quote-cart")!.defaults as object, query: { collection: "products", limit: 1, ids: [] } } }, "theme-switch": { enabled: true, variant: "t15" } }) });
        const host = "review.localhost";
        await repo.domain.create({ hostname: host, siteId: site.id, isPrimary: true, status: "active", verificationToken: site.id });
        await repo.domain.create({ hostname: "review-alt.localhost", siteId: site.id, isPrimary: false, status: "active", verificationToken: site.id });
        const home = demo.pages[0];
        const page = await repo.page.create({ siteId: site.id, slug: "", sections: home.pageSections, publishedAt: new Date(), title: { vi: "Trang chủ VI", en: "English home" } });
        for (const section of home.sections) {
          const data = structuredClone(section.data);
          if (section.type === "site-header") data.brand = { name: "[DỮ LIỆU MẪU] Solar energy installation company" };
          if (section.type === "hero") data.title = { ...data.title as object, lead: { vi: "Tiêu đề VI", en: "English hero" } };
          await repo.sectionContent.create({ siteId: site.id, pageId: page.id, ...section, data: json(data) });
        }
        for (const source of demo.pages.slice(1)) {
          const extra = await repo.page.create({ siteId: site.id, slug: source.slug, kind: source.kind, sections: source.pageSections, title: { vi: source.title.vi, en: `English ${source.slug}` }, publishedAt: new Date() });
          for (const section of source.sections) await repo.sectionContent.create({ siteId: site.id, pageId: extra.id, ...section, data: json(section.data) });
        }
        const products = [];
        for (let i = 0; i < 49; i++) {
          const original = demo.collections.products[0];
          const product = await repo.product.create({ slug: `review-sku-${i}`, title: { vi: `Sản phẩm VI ${i}`, en: `English product ${i}` }, status: "published", order: 1000 + i, price: 123456, data: { ...original.data, images: i === 48 ? ["https://media.example.test/product.webp"] : original.data.images, datasheet: "/files/review.pdf", unit: { vi: "bộ", en: "set" } } });
          products.push(product.id);
        }
        const original = demo.collections.posts[0];
        const post = await repo.post.create({ slug: "review-post", title: { vi: "Bài viết VI", en: "English post" }, status: "published", segment: "household", data: { ...original.data, excerpt: { vi: "Mô tả VI", en: "English excerpt" }, body: [{ vi: "Nội dung bài VI", en: "English post body" }] } });
        const saved = { siteId: site.id, pageId: page.id, products, postId: post.id, host };
        mkdirSync(resolve(file, ".."), { recursive: true });
        writeFileSync(file, JSON.stringify(saved));
        console.log(JSON.stringify(saved));
      } else {
        const saved = JSON.parse(readFileSync(file, "utf8")) as { siteId: string; pageId: string; products: string[]; postId: string };
        if (action === "no-dark" || action === "switcher-off") {
          await repo.site.update(saved.siteId, { themeId: action === "no-dark" ? "t01" : "t15", profile: { name: { vi: "[DỮ LIỆU MẪU] Review", en: "[DỮ LIỆU MẪU] Review EN" }, theme: { default: "dark", switcher: action !== "switcher-off" } }, locales: ["en"], defaultLocale: "en" });
        } else if (action === "no-chrome" || action === "disabled-chrome") {
          const page = await repo.page.get(saved.pageId);
          const sections = page!.sections as { type: string; enabled: boolean }[];
          await repo.page.update(saved.pageId, { sections: action === "no-chrome" ? sections.filter((section) => !["site-header", "site-footer"].includes(section.type)) : sections.map((section) => ["site-header", "site-footer"].includes(section.type) ? { ...section, enabled: false } : section) });
        } else throw new Error("Unknown fixture action");
      }
      if (process.env.REDIS_URL) {
        const redis = createRedisCache(process.env.REDIS_URL);
        try { await redis.ready; await redis.store.del(["tenancy:host:review.localhost"]); await redis.bus.publish(["review.localhost"]); }
        finally { redis.close(); }
      }
    } finally { await db.$disconnect(); }
  }
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
