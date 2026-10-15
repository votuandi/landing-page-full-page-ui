import assert from "node:assert/strict";
import test from "node:test";
import { applyPlanToPreset, loadPreset } from "@solar/presets";
import { plans } from "@solar/plans";
import { sectionRegistry } from "@solar/sections";
import { PRODUCTS } from "../../../../apps/web/src/data/products.ts";
import { PROJECTS } from "../../../../apps/web/src/data/projects.ts";
import { POSTS } from "../../../../apps/web/src/data/posts.ts";
import { STORIES } from "../../../../apps/web/src/data/stories.ts";
import { TESTIMONIALS } from "../../../../apps/web/src/data/testimonials.ts";
import { FAQS } from "../../../../apps/web/src/data/faq.ts";
import { buildDemo } from "../../prisma/seed-data.ts";

test("both demos keep t15 slugs/assets with distinct localized published content", () => {
  const a = buildDemo("t15"), b = buildDemo("t12");
  assert.notDeepEqual(a.collections.posts[0].title, b.collections.posts[0].title);
  assert.notDeepEqual(a.collections.projects[0].data, b.collections.projects[0].data);
  assert.deepEqual(a.collections.posts.map((row) => row.slug), b.collections.posts.map((row) => row.slug));
  const { products, projects, posts, stories, testimonials, faqs } = a.collections;
  assert.deepEqual(products.map((row) => row.slug), PRODUCTS.map((row) => row.slug));
  assert.deepEqual(projects.map((row) => row.slug), PROJECTS.map((row) => row.slug));
  assert.deepEqual(posts.map((row) => row.slug), POSTS.map((row) => row.slug));
  assert.deepEqual(stories.map((row) => row.slug), STORIES.map((row) => row.id));
  assert.equal(testimonials.length, TESTIMONIALS.length);
  assert.equal(faqs.length, FAQS.length);
  for (const rows of Object.values(a.collections)) {
    assert.equal(new Set(rows.map((row) => row.slug)).size, rows.length);
    for (const row of rows) assert.equal(typeof row.title.vi, "string");
  }
  assert.deepEqual(products[0].data.images, PRODUCTS[0].images);
});

test("preset data is separated from page descriptors without losing versions, widgets or disabled sections", () => {
  for (const id of ["t15", "t12"] as const) {
    const demo = buildDemo(id);
    const loaded = loadPreset(id);
    assert.match(demo.name, /\[DỮ LIỆU MẪU\]/);
    assert.equal(demo.themeId, loaded.preset.themeId);
    assert.deepEqual(demo.widgets, loaded.widgets);
    assert.equal(demo.pages.length, 5);
    assert.ok(demo.collections.services.length);
    assert.ok(demo.collections.branches.length);
    assert.ok(demo.collections.certificates.length);
    const can = (feature: string) => (plans[demo.planId].features as ReadonlySet<string>).has(feature) || (demo.addons as string[]).includes(feature);
    const applied = applyPlanToPreset({ pages: loaded.preset.pages, sections: loaded.page.sections }, can);
    assert.deepEqual(demo.pageSections, applied.sections.map(({ data: _data, ...descriptor }) => descriptor));
    assert.deepEqual(demo.pageTypes, applied.pageTypes);
    assert.ok(demo.pageSections.every((section) => !("data" in section)));
    for (const section of demo.sections) {
      assert.equal(section.schemaVersion, sectionRegistry.getType(section.type)!.schemaVersion);
      assert.ok(sectionRegistry.getType(section.type)!.schema.safeParse(section.data).success);
    }
  }
});
