import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createDb, POOL_BUDGET, type Db } from "../src/client.ts";
import type { Prisma } from "../generated/client.ts";
import { buildDemo } from "./seed-data.ts";
import { forPlatform } from "../src/repository.ts";

// Strip undefined optional fields and serialize schema-parsed objects to Prisma JSON.
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

export async function seedDemo(db: Db) {
  for (const id of ["basic", "pro", "premium"]) {
    // E6-S01 will own feature synchronization; rerunning this seed must preserve it.
    await db.plan.upsert({ where: { id }, update: {}, create: { id, name: id, features: [], limits: {} } });
  }
  for (const id of ["t15", "t12"] as const) {
    const demo = buildDemo(id);
    const hostname = `${id}.localhost`;
    const domain = await forPlatform(db).domains.findByHostname(hostname);
    await db.$transaction(async (tx) => {
      const tenantData = { name: demo.name, status: "active" as const, planId: id === "t15" ? "premium" : "pro" };
      const tenant = await tx.tenant.upsert({ where: { slug: `demo-${id}` }, update: tenantData, create: { slug: `demo-${id}`, ...tenantData } });
      const tenantId = tenant.id;
      const siteData = { name: demo.name, themeId: demo.themeId, presetId: id, widgets: json(demo.widgets), profile: { name: { vi: demo.name } } };
      const existing = await tx.site.findFirst({ where: { tenantId, presetId: id }, orderBy: { createdAt: "asc" } });
      const site = existing
        ? await tx.site.update({ where: { tenantId_id: { tenantId, id: existing.id } }, data: siteData })
        : await tx.site.create({ data: { tenantId, ...siteData } });
      const siteId = site.id;
      if (domain && domain.tenantId !== tenantId) throw new Error(`Demo hostname already belongs to another tenant: ${hostname}`);
      const domainData = { siteId, isPrimary: true, status: "active" as const, sslProvider: "caddy" as const };
      await tx.domain.upsert({ where: { hostname, tenantId }, update: domainData, create: { tenantId, hostname, verificationToken: randomUUID(), ...domainData } });

      const pageData = { kind: "home" as const, title: { vi: demo.name }, sections: json(demo.pageSections), revision: 1 };
      const page = await tx.page.upsert({
        where: { tenantId_siteId_slug: { tenantId, siteId, slug: "" } }, update: pageData,
        create: { tenantId, siteId, slug: "", publishedAt: new Date(), ...pageData },
      });
      const pageId = page.id;
      for (const section of demo.sections) {
        const data = { siteId, type: section.type, schemaVersion: section.schemaVersion, data: json(section.data), revision: 1 };
        await tx.sectionContent.upsert({
          where: { tenantId_pageId_sectionId: { tenantId, pageId, sectionId: section.sectionId } },
          update: data, create: { tenantId, pageId, sectionId: section.sectionId, ...data },
        });
      }
      const snapshot = json({ sections: demo.pageSections, contents: demo.sections });
      await tx.pageVersion.upsert({ where: { tenantId_pageId_revision: { tenantId, pageId, revision: 1 } },
        update: { snapshot }, create: { tenantId, pageId, revision: 1, snapshot },
      });

      const categories = new Map<string, string>(), brands = new Map<string, string>();
      const common = (item: { slug: string; title: { vi: string }; data: unknown; order: number; status: "published" }) => ({
        title: item.title, data: json(item.data), order: item.order, status: item.status,
      });
      for (const item of demo.collections.categories) {
        const data = common(item);
        const record = await tx.productCategory.upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
          create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
        categories.set(item.slug, record.id);
      }
      for (const item of demo.collections.brands) {
        const data = common(item);
        const record = await tx.brand.upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
          create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
        brands.set(item.slug, record.id);
      }
      for (const item of demo.collections.products) {
        const data = { ...common(item), categoryId: categories.get(item.categorySlug)!, brandId: brands.get(item.brandSlug)!,
          price: item.price ?? null, salePrice: item.salePrice ?? null, featured: item.featured, segments: item.segments };
        await tx.product.upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
          create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
      }
      for (const item of demo.collections.projects) {
        const data = { ...common(item), segment: item.segment, kwp: item.kwp };
        await tx.project.upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
          create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
      }
      for (const item of demo.collections.posts) {
        const data = { ...common(item), segment: item.segment ?? null };
        await tx.post.upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
          create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
      }
      for (const item of demo.collections.stories) {
        const data = { ...common(item), segment: item.segment, kind: item.kind };
        await tx.story.upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
          create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
      }
      for (const item of demo.collections.testimonials) {
        const data = { ...common(item), segment: item.segment, rating: item.rating };
        await tx.testimonial.upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
          create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
      }
      for (const item of demo.collections.faqs) {
        const data = common(item);
        await tx.faq.upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
          create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
      }
    }, { timeout: 60_000 });
    console.log(`Seeded demo-${id}: ${demo.sections.length} sections, ${demo.collections.products.length} products`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = createDb({ pool: POOL_BUDGET.worker });
  try { await seedDemo(db); } finally { await db.$disconnect(); }
}
