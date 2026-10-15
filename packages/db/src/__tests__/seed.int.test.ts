import { PLAN_IDS, plans } from "@solar/plans";
import assert from "node:assert/strict";
import test from "node:test";
import { scryptSync, timingSafeEqual, randomUUID } from "node:crypto";
import { createDb } from "../client.ts";
import { forPlatform } from "../repository.ts";
import { seedDemo, seedDemoTenant } from "../../prisma/seed-demo.ts";
import { buildDemo } from "../../prisma/seed-data.ts";

function verify(password: string, stored: string) {
  const [, n, r, p, salt, hash] = stored.split("$");
  const expected = Buffer.from(hash, "base64url");
  const actual = scryptSync(password, Buffer.from(salt, "base64url"), expected.length, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(actual, expected);
}

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
    // Each realm verifies only its own password (D17): t15, t12 and the platform account are three separate logins.
    const owners = await db.siteUser.findMany({ where: { email: "owner@demo.vn", tenantId: { in: first.tenants.map((tenant) => tenant.id) } }, omit: { passwordHash: false } });
    const platform = await forPlatform(db).platformAdmin.findMany({ where: { email: "owner@demo.vn" }, omit: { passwordHash: false } });
    assert.equal(platform.length, 1, "platform account is upserted, not duplicated");
    const realms = [
      ...owners.map((owner) => [first.tenants.find((tenant) => tenant.id === owner.tenantId)!.slug.replace("demo-", ""), owner.passwordHash ?? ""]),
      ["platform", platform[0].passwordHash],
    ];
    for (const [realm, hash] of realms) {
      for (const other of ["t15", "t12", "platform"]) assert.equal(verify(`${password}-${other}`, hash), other === realm, `${realm} vs ${other}`);
    }
    const shown = await forPlatform(db).platformAdmin.findUnique({ where: { email: "owner@demo.vn" } });
    assert.equal(shown && "passwordHash" in shown, false, "platform secrets are omitted by default");
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

test("without SEED_PASSWORD a demo tenant gets content but no accounts", {
  skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16",
}, async () => {
  const db = createDb({ pool: 2 });
  const slug = `nopass-${randomUUID().slice(0, 8)}`;
  try {
    const tenantId = await seedDemoTenant(db, { id: "t12", slug, hostname: `${slug}.localhost` });
    assert.equal(await db.siteUser.count({ where: { tenantId } }), 0);
    assert.ok(await db.page.count({ where: { tenantId } }) > 0);
  } finally {
    await db.tenant.deleteMany({ where: { slug } });
    await db.$disconnect();
  }
});

test("seedDemo without SEED_PASSWORD in the environment seeds content but creates no new accounts", {
  skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires migrated Postgres 16",
}, async () => {
  const db = createDb({ pool: 2 });
  const previous = process.env.SEED_PASSWORD;
  delete process.env.SEED_PASSWORD;
  try {
    const tenantIds = async () => (await db.tenant.findMany({ where: { slug: { in: ["demo-t15", "demo-t12"] } }, select: { id: true } })).map((tenant) => tenant.id);
    const accounts = async () => [await db.siteUser.count({ where: { tenantId: { in: await tenantIds() } } }), await forPlatform(db).platformAdmin.count()];
    const before = await accounts();
    await seedDemo(db);
    assert.deepEqual(await accounts(), before);
    assert.equal(await db.tenant.count({ where: { slug: { in: ["demo-t15", "demo-t12"] } } }), 2);
    assert.equal(await db.page.count({ where: { tenantId: { in: await tenantIds() } } }), 10);
  } finally {
    if (previous === undefined) delete process.env.SEED_PASSWORD;
    else process.env.SEED_PASSWORD = previous;
    await db.$disconnect();
  }
});
