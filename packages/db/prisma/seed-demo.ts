import { syncPlans } from "../src/plans.ts";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import type { Db } from "../src/client.ts";
import type { Prisma } from "../generated/client.ts";
import { buildDemo } from "./seed-data.ts";
import { forPlatform } from "../src/repository.ts";

// Strip undefined optional fields and serialize schema-parsed objects to Prisma JSON.
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

// Format shared with packages/auth (E15-S01): scrypt$N$r$p$salt$hash.
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

// Demo accounts (D17, D20, D21): same email/phone in both tenants and on the platform are separate accounts.
const demoUsers = (id: "t15" | "t12", slug: string) => [
  { email: "owner@demo.vn", phone: "0901234567", username: `${slug.replace(/-/g, "")}_admin`, name: "[DỮ LIỆU MẪU] Chủ site", role: "owner" as const, source: "console" as const },
  { email: "khach@demo.vn", phone: null, username: null, name: "[DỮ LIỆU MẪU] Khách", role: id === "t15" ? "client" as const : "staff" as const,
    source: id === "t15" ? "signup" as const : "invite" as const },
];

export async function seedDemo(db: Db, { password = process.env.SEED_PASSWORD } = {}) {
  if (!password) console.warn("SEED_PASSWORD missing: demo accounts skipped, content still seeded");
  await syncPlans(db);
  if (password) {
    const data = { name: "[DỮ LIỆU MẪU] Vận hành", passwordHash: hashPassword(`${password}-platform`) };
    await forPlatform(db).platformAdmin.upsert({ where: { email: "owner@demo.vn" }, update: data, create: { email: "owner@demo.vn", ...data } });
  }
  for (const id of ["t15", "t12"] as const) await seedDemoTenant(db, { id, slug: `demo-${id}`, hostname: `${id}.localhost`, password });
}

/** One demo tenant with one site and one primary host; browser fixtures reuse it for extra tenants. */
export async function seedDemoTenant(db: Db, { id, slug, hostname, password }: { id: "t15" | "t12"; slug: string; hostname: string; password?: string }) {
  {
    const demo = buildDemo(id);
    const domain = await forPlatform(db).domains.findByHostname(hostname);
    const seededTenantId = await db.$transaction(async (tx) => {
      const tenantData = { name: demo.name, status: "active" as const, planId: demo.planId, addons: demo.addons };
      const tenant = await tx.tenant.upsert({ where: { slug }, update: tenantData, create: { slug, ...tenantData } });
      const tenantId = tenant.id;
      const siteData = { name: demo.name, themeId: demo.themeId, presetId: id, pageTypes: demo.pageTypes, widgets: json(demo.widgets), profile: json(demo.profile), seo: json(demo.seo) };
      const existing = await tx.site.findFirst({ where: { tenantId, presetId: id }, orderBy: { createdAt: "asc" } });
      const site = existing
        ? await tx.site.update({ where: { tenantId_id: { tenantId, id: existing.id } }, data: siteData })
        : await tx.site.create({ data: { tenantId, ...siteData } });
      const siteId = site.id;
      if (domain && domain.tenantId !== tenantId) throw new Error(`Demo hostname already belongs to another tenant: ${hostname}`);
      const domainData = { siteId, isPrimary: true, status: "active" as const, sslProvider: "caddy" as const };
      await tx.domain.upsert({ where: { hostname, tenantId }, update: domainData, create: { tenantId, hostname, verificationToken: randomUUID(), ...domainData } });

      if (password) {
        for (const { email, ...account } of demoUsers(id, slug)) {
          const data = { ...account, status: "active" as const, emailVerifiedAt: new Date(0), passwordHash: hashPassword(`${password}-${id}`) };
          await tx.siteUser.upsert({ where: { tenantId_email: { tenantId, email } }, update: data, create: { tenantId, email, ...data } });
        }
      }

      for (const seededPage of demo.pages) {
        const pageData = { kind: seededPage.kind, title: seededPage.title, sections: json(seededPage.pageSections), revision: 1 };
        const page = await tx.page.upsert({
          where: { tenantId_siteId_slug: { tenantId, siteId, slug: seededPage.slug } }, update: pageData,
          create: { tenantId, siteId, slug: seededPage.slug, publishedAt: new Date(), ...pageData },
        });
        const pageId = page.id;
        // Sections dropped by the plan policy (E5-S11) must not linger from an older seed.
        await tx.sectionContent.deleteMany({ where: { tenantId, pageId, sectionId: { notIn: seededPage.sections.map((section) => section.sectionId) } } });
        for (const section of seededPage.sections) {
          const data = { siteId, type: section.type, schemaVersion: section.schemaVersion, data: json(section.data), revision: 1 };
          await tx.sectionContent.upsert({
            where: { tenantId_pageId_sectionId: { tenantId, pageId, sectionId: section.sectionId } },
            update: data, create: { tenantId, pageId, sectionId: section.sectionId, ...data },
          });
        }
        const snapshot = json({ sections: seededPage.pageSections, contents: seededPage.sections });
        await tx.pageVersion.upsert({ where: { tenantId_pageId_revision: { tenantId, pageId, revision: 1 } },
          update: { snapshot }, create: { tenantId, pageId, revision: 1, snapshot },
        });
      }

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
      for (const [delegate, items] of [
        [tx.service, demo.collections.services], [tx.branch, demo.collections.branches],
        [tx.certificate, demo.collections.certificates], [tx.pressItem, demo.collections.pressItems],
      ] as const) {
        // These four seed tables use the same slug/title/data create shape.
        const upsert = delegate.upsert as typeof tx.service.upsert;
        for (const item of items) {
          const data = { ...common(item), ...("isPrimary" in item ? { isPrimary: item.isPrimary } : {}) };
          await upsert({ where: { tenantId_slug: { tenantId, slug: item.slug } }, update: data,
            create: { tenantId, slug: item.slug, publishedAt: new Date(), ...data } });
        }
      }
      return tenantId;
    }, { timeout: 60_000 });
    console.log(`Seeded ${slug}: ${demo.sections.length} sections, ${demo.collections.products.length} products`);
    return seededTenantId;
  }
}
