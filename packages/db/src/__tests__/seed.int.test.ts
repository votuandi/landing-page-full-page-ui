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
    const password = "seed-test-password";
    await seedDemo(db, { password });
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
        users: await db.siteUser.findMany({ where: { tenantId }, orderBy: { id: "asc" }, select: { id: true, tenantId: true, email: true, phone: true, username: true, role: true } }),
      };
    }
    const first = await state();
    await seedDemo(db, { password });
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
    assert.equal(first.pages, 10);
    assert.equal(first.versions, 10);
    assert.equal(first.media, 0);
    // Same login in both tenants = two accounts; khach@demo.vn is a client on t15 and staff on t12.
    assert.equal(first.users.length, 4);
    for (const tenant of first.tenants) {
      const users = first.users.filter((user) => user.tenantId === tenant.id);
      assert.deepEqual(users.map((user) => user.email).sort(), ["khach@demo.vn", "owner@demo.vn"]);
      assert.equal(users.find((user) => user.email === "owner@demo.vn")?.username, `${tenant.slug.replace(/-/g, "")}_admin`);
      assert.equal(users.find((user) => user.email === "khach@demo.vn")?.role, tenant.slug === "demo-t15" ? "client" : "staff");
    }
    const hashes = await db.siteUser.findMany({ where: { email: "owner@demo.vn", tenantId: { in: first.tenants.map((tenant) => tenant.id) } }, omit: { passwordHash: false } });
    assert.notEqual(hashes[0].passwordHash, hashes[1].passwordHash);
    assert.match(hashes[0].passwordHash ?? "", /^scrypt\$32768\$8\$1\$/);
    for (const id of ["t15", "t12"] as const) {
      const demo = buildDemo(id);
      const tenant = first.tenants.find((tenant) => tenant.slug === `demo-${id}`)!;
      assert.deepEqual(first.products.filter((row) => row.tenantId === tenant.id).map((row) => row.slug).sort(), demo.collections.products.map((row) => row.slug).sort());
      for (const seededPage of demo.pages) {
        const page = await db.page.findFirstOrThrow({ where: { tenantId: tenant.id, slug: seededPage.slug } });
        assert.equal(page.revision, 1);
        assert.ok(page.publishedAt);
        assert.deepEqual(page.sections, seededPage.pageSections);
        const sections = await db.sectionContent.findMany({ where: { tenantId: tenant.id, pageId: page.id } });
        assert.equal(sections.length, seededPage.sections.length);
        for (const section of seededPage.sections) {
          const stored = sections.find((row) => row.sectionId === section.sectionId)!;
          assert.equal(stored.schemaVersion, section.schemaVersion);
          assert.equal(stored.revision, 1);
          assert.deepEqual(stored.data, JSON.parse(JSON.stringify(section.data)));
        }
        const snapshot = await db.pageVersion.findFirstOrThrow({ where: { tenantId: tenant.id, pageId: page.id, revision: 1 } });
        assert.deepEqual(snapshot.snapshot, JSON.parse(JSON.stringify({ sections: seededPage.pageSections, contents: seededPage.sections })));
      }
    }
  } finally { await db.$disconnect(); }
});
