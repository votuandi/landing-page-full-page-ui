import assert from "node:assert/strict";
import test from "node:test";
import { forPlatform } from "@solar/db";
import { getWebDb } from "../db";
import { createSiteData, tenantRepository } from "../siteData";
import { createCollections } from "../collections";
import { randomUUID } from "node:crypto";
import { createCollectionLoader, sectionRegistry } from "@solar/sections";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { loadSystemPage } from "../../../components/tenant/SystemPages";
import type { Collection } from "../collections";

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

test("Postgres: public collections and associations exclude drafts, foreign UUIDs and other sites/pages", {
  skip: !process.env.DATABASE_URL && "DATABASE_URL missing: requires seeded PostgreSQL 16",
}, async (t) => {
  const db = getWebDb();
  const cleanup: (() => Promise<unknown>)[] = [];
  // tsx's handling of Next's preserved JSX uses React.createElement in this Node test.
  const globals = globalThis as typeof globalThis & { React?: typeof React };
  const previousReact = globals.React;
  globals.React = React;
  t.mock.method(console, "error", () => {});
  try {
    const a = await forPlatform(db).domains.resolve("t15.localhost");
    const b = await forPlatform(db).domains.resolve("t12.localhost");
    assert.ok(a && b);
    const repo = tenantRepository(a.tenantId);
    const foreignRepo = tenantRepository(b.tenantId);
    const data = createSiteData(tenantRepository);
    const suffix = randomUUID();
    const names: Collection[] = ["product", "productCategory", "brand", "project", "post", "story", "testimonial", "branch", "faq", "service", "certificate", "pressItem"];
    type FixtureRepo = { list: () => Promise<Record<string, unknown>[]>; create: (value: Record<string, unknown>) => Promise<{ id: string }>; delete: (id: string) => Promise<unknown> };
    const collections = repo as unknown as Record<Collection, FixtureRepo>;
    const originals = new Map<Collection, Record<string, unknown>>();
    const drafts = new Map<Collection, string>();
    async function copy(model: FixtureRepo, original: Record<string, unknown>, extra: Record<string, unknown>) {
      const values = Object.fromEntries(Object.entries(original).filter(([key]) => !["id", "tenantId", "createdAt", "updatedAt"].includes(key)));
      const fixture = { ...values, ...extra };
      // Ensure copied products have an actual datasheet URL, not the legacy demo "#" placeholder.
      if (fixture.data && typeof fixture.data === "object" && "datasheet" in fixture.data) fixture.data = { ...fixture.data, datasheet: "/files/datasheet.pdf" };
      const created = await model.create(fixture);
      cleanup.push(() => model.delete(created.id));
      return created;
    }
    for (const name of names) {
      const original = (await collections[name].list())[0];
      assert.ok(original, `${name} fixture must exist`);
      originals.set(name, original);
      const draft = await copy(collections[name], original, { slug: `private-${name}-${suffix}`, status: "draft", title: { vi: `PRIVATE ${name}` } });
      drafts.set(name, draft.id);
    }
    const adapter = createCollections(repo, a.tenantId);
    const publicItems = (await Promise.all([
      ...Object.values(adapter.source).map((source) => source!({ tenantId: a.tenantId, themeId: "t15", locale: "vi" })),
      adapter.services(), adapter.faqs(), adapter.certificates(), adapter.press(),
    ])).flat();
    assert.ok(publicItems.length);
    for (const id of drafts.values()) assert.ok(!publicItems.some((item) => (item as { id: string }).id === id));
    assert.doesNotMatch(JSON.stringify(publicItems), /PRIVATE/);

    // Use a real B UUID, rather than an arbitrary absent ID, through the public loader.
    const foreignPost = (await foreignRepo.post.list({ where: { status: "published" } }))[0];
    assert.ok(foreignPost);
    const blog = sectionRegistry.types.blog;
    const blogData = { ...blog.defaults, query: { ...blog.defaults.query, ids: [foreignPost.id] } };
    const loaded = blog.schema.parse(await createCollectionLoader(adapter.source)({ section: { id: "blog", type: "blog", variant: "t15", enabled: true, data: blogData }, data: blogData, site: { tenantId: a.tenantId, themeId: "t15", locale: "vi" } }));
    assert.deepEqual(loaded.items, []);

    const siteB = await repo.site.create({ name: `Second ${suffix}`, themeId: "t12" });
    cleanup.push(() => repo.site.delete(siteB.id));
    const secondDomain = await repo.domain.create({ siteId: siteB.id, hostname: `${suffix}.localhost`, status: "verified", isPrimary: true, verificationToken: suffix });
    cleanup.push(() => repo.domain.delete(secondDomain.id));
    assert.equal((await data.loadTenantSite(a.tenantId, siteB.id))?.theme.meta.id, "t12");
    await repo.domain.update(secondDomain.id, { status: "pending" });
    assert.equal(await data.loadTenantSite(a.tenantId, siteB.id), null);
    await repo.domain.update(secondDomain.id, { status: "verified" });
    const hero = sectionRegistry.types.hero;
    const descriptors = ["bound", "missing"].map((id) => ({ id, type: "hero", variant: "t15", enabled: true }));
    const pages = [];
    for (const [siteId, slug, title] of [[a.siteId, `same-${suffix}`, "Site A"], [siteB.id, `same-${suffix}`, "Site B"], [a.siteId, `other-${suffix}`, "Other page"]]) {
      const page = await repo.page.create({ siteId, slug, title: { vi: title }, sections: descriptors, publishedAt: new Date() });
      cleanup.push(() => repo.page.delete(page.id));
      pages.push(page);
    }
    for (const [page, siteId, sectionId, label] of [[pages[0], a.siteId, "bound", "Site A"], [pages[1], siteB.id, "bound", "Site B"], [pages[2], a.siteId, "missing", "PRIVATE other page"], [pages[0], siteB.id, "missing", "PRIVATE other site"]] as const) {
      const content = await repo.sectionContent.create({ siteId, pageId: page.id, sectionId, type: "hero", data: { ...hero.defaults, title: { ...hero.defaults.title, lead: { vi: label } } } });
      cleanup.push(() => repo.sectionContent.delete(content.id));
    }
    for (const [siteId, title] of [[a.siteId, "Site A"], [siteB.id, "Site B"]]) {
      const page = await data.loadPublishedPage(a.tenantId, siteId, `same-${suffix}`);
      assert.equal(page?.title, title);
      assert.equal(hero.schema.parse(page?.config.sections[0].data).title.lead.vi, title);
      assert.deepEqual(page?.config.sections[1].data, hero.defaults);
      assert.doesNotMatch(JSON.stringify(page), /PRIVATE/);
    }

    // Related/compatible views must select from this tenant's published records.
    const foreignProducts = foreignRepo.product as unknown as FixtureRepo;
    const foreignProduct = await copy(foreignProducts, (await foreignProducts.list())[0], { slug: `foreign-${suffix}`, title: { vi: "PRIVATE foreign product" } });
    const childSlug = `compatible-${suffix}`;
    const child = await copy(collections.product, originals.get("product")!, { slug: childSlug, title: { vi: "Allowed compatible" } });
    const parentSlug = `parent-${suffix}`;
    const parentData = originals.get("product")!.data as Record<string, unknown>;
    await copy(collections.product, originals.get("product")!, { slug: parentSlug, title: { vi: "Parent" }, data: { ...parentData, compatible: [childSlug, `foreign-${suffix}`, `private-product-${suffix}`] } });
    const site = await data.loadTenantSite(a.tenantId, a.siteId);
    assert.ok(site);
    for (const collection of ["product", "post", "project", "service"] as const) {
      assert.equal(await loadSystemPage({ ...site, widgets: {} }, { kind: "detail", collection, slug: `private-${collection}-${suffix}` }), null);
    }
    assert.equal(await loadSystemPage({ ...site, widgets: {} }, { kind: "detail", collection: "product", slug: `foreign-${suffix}` }), null);
    const view = await loadSystemPage({ ...site, widgets: {} }, { kind: "detail", collection: "product", slug: parentSlug });
    assert.ok(view);
    const html = renderToStaticMarkup(view.content);
    assert.match(html, /Allowed compatible/);
    assert.doesNotMatch(html, /PRIVATE|foreign-|private-product-/);
    const project = await loadSystemPage(site, { kind: "detail", collection: "project", slug: originals.get("project")!.slug as string });
    assert.ok(project);
    assert.doesNotMatch(renderToStaticMarkup(project.content), /PRIVATE|Demo t12/);
    assert.ok((await createCollections(repo, a.tenantId).products()).some((item) => item.id === child.id));
    assert.ok(!(await createCollections(repo, a.tenantId).products()).some((item) => item.id === foreignProduct.id));
  } finally {
    globals.React = previousReact;
    for (const remove of cleanup.reverse()) await remove();
    await db.$disconnect();
  }
});
