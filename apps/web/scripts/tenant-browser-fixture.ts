import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { createPlatformDb, exportTenant, restoreTenant, forPlatform, forTenant, setPageTypes, type Prisma } from "@solar/db";
import { storageFromEnv } from "@solar/storage";
import { widgetRegistry } from "@solar/sections";
import { buildDemo } from "../../../packages/db/prisma/seed-data";
import { seedDemoTenant } from "../../../packages/db/prisma/seed-demo";
import { createRedisCache } from "../src/lib/tenant/redis";
import { randomUUID } from "node:crypto";
import { signRevalidate, tenantTag } from "@solar/cache";

// Fixtures write the DB directly, like admin will: drop the web server's content cache the same way (E5-S05).
async function revalidate(tenantIds: Iterable<string>) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return;
  const tags = [...new Set(tenantIds)].map(tenantTag);
  let status = 0;
  // Retry like the worker does (fresh nonce each attempt); a cold dev server may still be compiling the route.
  for (let attempt = 0; attempt < 5; attempt++) {
    const body = JSON.stringify({ tags, nonce: randomUUID().replaceAll("-", ""), ts: Date.now() });
    const response = await fetch(`http://localhost:${process.env.TENANT_PUBLIC_PORT ?? "3211"}/api/revalidate`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-signature": signRevalidate(body, secret) }, body,
    });
    if (response.ok) return;
    status = response.status;
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw new Error(`revalidate failed: ${status}`);
}

const action = process.argv[2];
const file = resolve("../../tooling/visual/.test-dist/tenant-fixture.json");
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));
async function main() {
  if (action === "manifest") {
    const demo = buildDemo("t15");
    console.log(JSON.stringify({ ...Object.fromEntries(["products", "posts", "projects", "services"].map((key) => [key, demo.collections[key as "products"].map((item) => item.slug)])), servicePrices: demo.collections.services.map((item) => item.data.price), serviceSolutions: demo.collections.services.map((item) => item.data.solution) }));
  } else {
    const db = createPlatformDb({ pool: 5 });
    try {
      const domain = await forPlatform(db).domains.resolve("t15.localhost");
      if (!domain) throw new Error("Seed t15 before browser tests");
      if (action === "backup-restore" || action === "backup-cleanup") {
        const slug = "e2e-clone", hostname = "clone.localhost";
        const storage = storageFromEnv({ ...process.env, STORAGE_LOCAL_ROOT: process.env.STORAGE_LOCAL_ROOT ?? ".test-dist/backup-media",
          MEDIA_PUBLIC_BASE: process.env.MEDIA_PUBLIC_BASE ?? "http://localhost:3211/media" });
        const old = await forPlatform(db).tenants.bySlug(slug);
        const touched = new Set<string>();
        if (old) {
          touched.add(old.tenantId);
          await db.tenant.delete({ where: { id: old.tenantId } });
          for await (const key of storage.list(`tenants/${old.tenantId}/`)) await storage.delete(key);
        }
        if (action === "backup-restore") {
          const bundle = await exportTenant(db, domain.tenantId);
          const clone = await restoreTenant(db, storage, bundle, { slug, planId: "premium" });
          touched.add(clone.tenantId);
          const site = (await forTenant(db, clone.tenantId).site.first())!;
          await forTenant(db, clone.tenantId).domain.create({ siteId: site.id, hostname, isPrimary: true, status: "active", verificationToken: randomUUID() });
          console.log(JSON.stringify(clone));
        }
        await revalidate(touched);
        if (process.env.REDIS_URL) {
          const redis = createRedisCache(process.env.REDIS_URL);
          try { await redis.ready; await redis.store.del([`tenancy:host:${hostname}`]); await redis.bus.publish([hostname]); }
          finally { redis.close(); }
        }
        return;
      }
      const host = "review.localhost", reviewSlug = "review-t15";
      const touched = new Set<string>([domain.tenantId]);
      if (action === "setup" || action === "cleanup") {
        // Remove the review tenant, plus review rows that older fixtures created inside the t15 tenant.
        await db.tenant.deleteMany({ where: { slug: reviewSlug } });
        const repo = forTenant(db, domain.tenantId);
        const old = await repo.domain.first({ where: { hostname: host } });
        if (old) await repo.site.delete(old.siteId);
        for (const item of await repo.product.list({ where: { slug: { startsWith: "review-sku-" } } })) await repo.product.delete(item.id);
        const post = await repo.post.first({ where: { slug: "review-post" } });
        if (post) await repo.post.delete(post.id);
        const project = await repo.project.first({ where: { slug: "review-project" } });
        if (project) await repo.project.delete(project.id);
        const service = await repo.service.first({ where: { slug: "review-service" } });
        if (service) await repo.service.delete(service.id);
        if (action === "cleanup") { try { unlinkSync(file); } catch {} await revalidate(touched); return; }
      }
      if (action === "setup") {
        const demo = buildDemo("t15");
        const tenantId = await seedDemoTenant(db, { id: "t15", slug: reviewSlug, hostname: host });
        touched.add(tenantId);
        const repo = forTenant(db, tenantId);
        const seeded = await repo.site.first();
        if (!seeded) throw new Error("Review site was not seeded");
        await repo.site.update(seeded.id, { name: "[DỮ LIỆU MẪU] Review", themeId: "t15", locales: ["vi", "en"], defaultLocale: "en", seo: { ogImage: "http://invalid.test/image" },
          themeOverrides: { colors: { light: { primary: "10 110 70" }, dark: { primary: "90 190 120" } } },
          profile: { name: { vi: "[DỮ LIỆU MẪU] Công ty điện mặt trời với tên rất dài để kiểm tra menu", en: "[DỮ LIỆU MẪU] Solar company with a very long name for mobile menu" }, description: { vi: "Nội dung VI", en: "English description" }, hotline: "0901234567", theme: { default: "dark", switcher: true }, guide: demo.profile.guide, legal: { policies: [...demo.profile.legal.policies, { slug: "review-policy", title: { vi: "Chính sách VI" }, summary: { vi: "" }, body: { vi: [] } }] } },
          widgets: json({ ...demo.widgets, "quote-cart": { enabled: true, variant: "t15", data: { ...widgetRegistry.getType("quote-cart")!.defaults as object, query: { collection: "products", limit: 1, ids: [] } } }, "theme-switch": { enabled: true, variant: "t15" } }) });
        const site = seeded;
        await repo.domain.create({ hostname: "review-alt.localhost", siteId: site.id, isPrimary: false, status: "active", verificationToken: site.id });
        const home = demo.pages[0];
        const page = await repo.page.first({ where: { siteId: site.id, slug: "" } });
        if (!page) throw new Error("Review home was not seeded");
        await repo.page.update(page.id, { title: { vi: "Trang chủ VI", en: "English home" } });
        for (const section of home.sections) {
          const data = structuredClone(section.data);
          if (section.type === "site-header") data.brand = { name: "[DỮ LIỆU MẪU] Solar energy installation company" };
          else if (section.type === "hero") data.title = { ...data.title as object, lead: { vi: "Tiêu đề VI", en: "English hero" } };
          else if (section.type === "packages") data.items = (data.items as object[]).map((item) => ({ ...item, price: 180_000_000, salePrice: 144_000_000 }));
          else continue;
          const row = await repo.sectionContent.first({ where: { pageId: page.id, sectionId: section.sectionId } });
          await repo.sectionContent.update(row!.id, { data: json(data) });
        }
        for (const source of demo.pages.slice(1)) {
          const extra = await repo.page.first({ where: { siteId: site.id, slug: source.slug } });
          await repo.page.update(extra!.id, { title: { vi: source.title.vi, en: `English ${source.slug}` } });
        }
        const products = [];
        for (let i = 0; i < 49; i++) {
          const original = demo.collections.products[0];
          const product = await repo.product.create({ slug: `review-sku-${i}`, title: { vi: `Sản phẩm VI ${i}`, en: `English product ${i}` }, status: "published", order: 1000 + i, price: i === 0 ? null : 123456, salePrice: i === 1 ? 98764 : null, data: { ...original.data, images: i === 48 ? ["https://media.example.test/product.webp"] : original.data.images, datasheet: "/files/review.pdf", unit: { vi: "bộ", en: "set" } } });
          products.push(product.id);
        }
        await repo.product.update(products[2], { title: { vi: "Sản phẩm thiếu EN" }, data: { ...demo.collections.products[0].data, images: [site.id], warranty: { vi: "Bảo hành VI" } } });
        const homeProducts = await repo.sectionContent.first({ where: { siteId: site.id, pageId: page.id, type: "products" } });
        if (!homeProducts) throw new Error("Review home must include products");
        await repo.sectionContent.update(homeProducts.id, { data: json({ ...homeProducts.data as object, query: { collection: "products", limit: 2, ids: products.slice(0, 2), filter: {} } }) });
        await repo.project.create({ slug: "review-project", title: { vi: "Công trình thiếu EN" }, status: "published", segment: "household", kwp: demo.collections.projects[0].kwp, data: { ...demo.collections.projects[0].data, image: site.id, detail: { vi: "Mô tả công trình VI" } } });
        await repo.service.create({ slug: "review-service", title: { vi: "Giải pháp thiếu EN" }, status: "published", data: { ...demo.collections.services[0].data, image: site.id, problem: { vi: "" } } });
        const original = demo.collections.posts[0];
        const post = await repo.post.create({ slug: "review-post", title: { vi: "Bài viết VI", en: "English post" }, status: "published", segment: "household", data: { ...original.data, excerpt: { vi: "Mô tả VI", en: "English excerpt" }, body: [{ vi: "Nội dung bài VI", en: "English post body" }] } });
        const saved = { tenantId, siteId: site.id, pageId: page.id, products, postId: post.id, host };
        mkdirSync(resolve(file, ".."), { recursive: true });
        writeFileSync(file, JSON.stringify(saved));
        console.log(JSON.stringify(saved));
      } else {
        const saved = JSON.parse(readFileSync(file, "utf8")) as { tenantId: string; siteId: string; pageId: string; products: string[]; postId: string };
        const repo = forTenant(db, saved.tenantId);
        touched.add(saved.tenantId);
        if (action === "disable-about" || action === "enable-about") {
          const site = (await repo.site.get(saved.siteId))!;
          await setPageTypes(db, saved.tenantId, { siteId: site.id, expected: site.pageTypes,
            pageTypes: action === "disable-about" ? site.pageTypes.filter(t => t !== "about") : [...new Set([...site.pageTypes, "about"])] });
        } else if (action === "no-dark" || action === "switcher-off") {
          await repo.site.update(saved.siteId, { themeId: action === "no-dark" ? "t01" : "t15", profile: { name: { vi: "[DỮ LIỆU MẪU] Review", en: "[DỮ LIỆU MẪU] Review EN" }, theme: { default: "dark", switcher: action !== "switcher-off" } }, locales: ["en"], defaultLocale: "en" });
        } else if (action === "no-chrome" || action === "disabled-chrome") {
          const page = await repo.page.get(saved.pageId);
          const sections = page!.sections as { type: string; enabled: boolean }[];
          await repo.page.update(saved.pageId, { sections: action === "no-chrome" ? sections.filter((section) => !["site-header", "site-footer"].includes(section.type)) : sections.map((section) => ["site-header", "site-footer"].includes(section.type) ? { ...section, enabled: false } : section) });
        } else throw new Error("Unknown fixture action");
      }
      await revalidate(touched);
      if (process.env.REDIS_URL) {
        const redis = createRedisCache(process.env.REDIS_URL);
        try { await redis.ready; await redis.store.del(["tenancy:host:review.localhost"]); await redis.bus.publish(["review.localhost"]); }
        finally { redis.close(); }
      }
    } finally { await db.$disconnect(); }
  }
}
void main().catch((error) => { console.error(error); process.exitCode = 1; });
