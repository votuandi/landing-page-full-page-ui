import { PLAN_IDS, plans } from "@solar/plans";
import assert from "node:assert/strict";
import test from "node:test";
import { createDb } from "../client.ts";
import { seedDemo } from "../../prisma/seed.ts";
import { buildDemo } from "../../prisma/seed-data.ts";

test("seed twice keeps counts and identities, splits section data and reuses product slugs across tenants", {
  skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16",
}, async () => {
  const db = createDb({ pool: 2 });
  try {
    await seedDemo(db);
    async function state() {
      const tenants = await db.tenant.findMany({ where: { slug: { in: ["demo-t15", "demo-t12"] } }, orderBy: { slug: "asc" } });
      const tenantId = { in: tenants.map((tenant) => tenant.id) };
      return {
        tenants: tenants.map(({ id, slug }) => ({ id, slug })),
        sites: await db.site.findMany({ where: { tenantId }, orderBy: { id: "asc" }, select: { id: true, tenantId: true, themeId: true } }),
        domains: await db.domain.count({ where: { tenantId } }), pages: await db.page.count({ where: { tenantId } }),
        versions: await db.pageVersion.count({ where: { tenantId } }), sections: await db.sectionContent.count({ where: { tenantId } }),
        products: await db.product.findMany({ where: { tenantId }, orderBy: { id: "asc" }, select: { id: true, tenantId: true, slug: true } }),
        categories: await db.productCategory.count({ where: { tenantId } }), brands: await db.brand.count({ where: { tenantId } }),
        projects: await db.project.count({ where: { tenantId } }), posts: await db.post.count({ where: { tenantId } }),
        stories: await db.story.count({ where: { tenantId } }), testimonials: await db.testimonial.count({ where: { tenantId } }),
        faqs: await db.faq.count({ where: { tenantId } }), media: await db.media.count({ where: { tenantId } }),
      };
    }
    const first = await state();
    await seedDemo(db);
    assert.deepEqual(await state(), first);
    for (const id of PLAN_IDS) {
      const row = await db.plan.findUniqueOrThrow({ where: { id } });
      assert.equal(row.name, plans[id].name);
      assert.deepEqual(row.features, [...plans[id].features]);
      assert.deepEqual(row.limits, plans[id].limits);
    }

    assert.equal(first.tenants.length, 2);
    assert.equal(first.sites.length, 2);
    assert.equal(first.domains, 2);
    assert.equal(first.pages, 2);
    assert.equal(first.versions, 2);
    assert.equal(first.media, 0);
    for (const id of ["t15", "t12"] as const) {
      const demo = buildDemo(id);
      const tenant = first.tenants.find((tenant) => tenant.slug === `demo-${id}`)!;
      assert.deepEqual(first.products.filter((row) => row.tenantId === tenant.id).map((row) => row.slug).sort(), demo.collections.products.map((row) => row.slug).sort());
      const page = await db.page.findFirstOrThrow({ where: { tenantId: tenant.id } });
      assert.equal(page.revision, 1);
      assert.ok(page.publishedAt);
      assert.deepEqual(page.sections, demo.pageSections);
      const sections = await db.sectionContent.findMany({ where: { tenantId: tenant.id, pageId: page.id } });
      assert.equal(sections.length, demo.sections.length);
      for (const section of demo.sections) {
        const stored = sections.find((row) => row.sectionId === section.sectionId)!;
        assert.equal(stored.schemaVersion, section.schemaVersion);
        assert.equal(stored.revision, 1);
        assert.deepEqual(stored.data, JSON.parse(JSON.stringify(section.data)));
      }
    }
  } finally { await db.$disconnect(); }
});
