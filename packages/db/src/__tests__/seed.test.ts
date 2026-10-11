import assert from "node:assert/strict";
import test from "node:test";
import { loadPreset } from "@solar/presets";
import { sectionRegistry } from "@solar/sections";
import { PRODUCTS } from "../../../../apps/web/src/data/products.ts";
import { PROJECTS } from "../../../../apps/web/src/data/projects.ts";
import { POSTS } from "../../../../apps/web/src/data/posts.ts";
import { STORIES } from "../../../../apps/web/src/data/stories.ts";
import { TESTIMONIALS } from "../../../../apps/web/src/data/testimonials.ts";
import { FAQS } from "../../../../apps/web/src/data/faq.ts";
import { buildDemo } from "../../prisma/seed-data.ts";

test("both demos share complete t15 collections and keep localized titles and static image paths", () => {
  const a = buildDemo("t15"), b = buildDemo("t12");
  assert.deepEqual(a.collections, b.collections);
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
    assert.deepEqual(demo.sections.map((section) => section.data), loaded.page.sections.map((section) => section.data));
    assert.deepEqual(demo.pageSections, loaded.page.sections.map(({ data: _data, ...descriptor }) => descriptor));
    assert.ok(demo.pageSections.every((section) => !("data" in section)));
    for (const section of demo.sections) {
      assert.equal(section.schemaVersion, sectionRegistry.getType(section.type)!.schemaVersion);
    }
  }
});
