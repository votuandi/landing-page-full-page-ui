import assert from "node:assert/strict";
import test from "node:test";
import { forPlatform } from "@solar/db";
import { getWebDb } from "../db";
import { createSiteData, tenantRepository } from "../siteData";
import { createCollections } from "../collections";
import { randomUUID } from "node:crypto";

test("Postgres: both seeded sites render distinct published content at shared slugs with scoped associations", {
  skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires seeded PostgreSQL 16",
}, async () => {
  const db = getWebDb();
  try {
    const data = createSiteData(tenantRepository);
    const results = [];
    for (const id of ["t15", "t12"] as const) {
      const domain = await forPlatform(db).domains.resolve(`${id}.localhost`);
      assert.ok(domain);
      const site = await data.loadTenantSite(domain.tenantId, domain.siteId);
      assert.ok(site);
      assert.ok(site.profile.guide.items.length);
      assert.ok(site.profile.legal.policies.length);
      assert.match(site.name, new RegExp(id));
      const home = await data.loadPublishedPage(domain.tenantId, domain.siteId, "");
      assert.ok(home);
      for (const slug of ["lien-he", "ve-chung-toi", "cam-nang", "uu-dai/nang-luong"]) assert.ok(await data.loadPublishedPage(domain.tenantId, domain.siteId, slug));
      assert.equal(await data.loadPublishedPage(domain.tenantId, domain.siteId, "missing"), null);
      const collections = createCollections(tenantRepository(domain.tenantId), domain.tenantId);
      const [posts, projects, products, services] = await Promise.all([collections.posts(), collections.projects(), collections.products(), collections.services()]);
      assert.ok(posts.length && projects.length && products.length && services.length);
      assert.match(posts[0].title, new RegExp(id));
      assert.match(projects[0].detail, new RegExp(id));
      results.push({ domain, site, posts, projects });
    }
    assert.notEqual(results[0].site.theme.meta.id, results[1].site.theme.meta.id);
    assert.equal(results[0].posts[0].slug, results[1].posts[0].slug);
    assert.notEqual(results[0].posts[0].title, results[1].posts[0].title);
    assert.equal(await data.loadTenantSite(results[0].domain.tenantId, results[1].domain.siteId), null);
    assert.equal(await data.loadPublishedPage(results[0].domain.tenantId, results[1].domain.siteId, ""), null);
    const a = results[0].domain;
    const repo = tenantRepository(a.tenantId);
    const slug = `draft-${randomUUID()}`;
    const draftPage = await repo.page.create({ siteId: a.siteId, slug, sections: [], publishedAt: null });
    const draftPost = await repo.post.create({ slug, title: { vi: "Private" }, status: "draft", data: { excerpt: "Private", cover: "/images/a.webp", readMinutes: 1, body: ["Private"] } });
    try {
      assert.equal(await data.loadPublishedPage(a.tenantId, a.siteId, slug), null);
      assert.ok(!(await createCollections(repo, a.tenantId).posts()).some((item) => item.slug === slug));
    } finally { await repo.page.delete(draftPage.id); await repo.post.delete(draftPost.id); }
  } finally { await db.$disconnect(); }
});
