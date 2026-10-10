import { test } from "node:test";
import assert from "node:assert/strict";
import { collectionSchemas, createCollectionLoader, sectionRegistry, type CollectionName } from "@solar/sections";
import { staticCollectionSource } from "../sectionCollections";
import { PROJECTS } from "../../data/projects";
import { STORIES } from "../../data/stories";
import { TESTIMONIALS } from "../../data/testimonials";
import { POSTS } from "../../data/posts";
import { PRODUCTS, CATEGORY_LABEL } from "../../data/products";
import { siteConfig } from "../../config/site.config";

const site = { tenantId: "adapter-test", locale: "vi", themeId: "t15" } as const;
const expectedIds = {
  projects: PROJECTS.map((item) => item.slug),
  stories: STORIES.map((item) => item.id),
  testimonials: TESTIMONIALS.map((_, i) => `testimonial-${i + 1}`),
  posts: POSTS.map((item) => item.slug),
  products: PRODUCTS.map((item) => item.slug),
  branches: siteConfig.branches.map((item) => item.id),
};
const types: Record<CollectionName, string> = { projects: "projects", stories: "shorts", testimonials: "testimonials", posts: "blog", products: "products", branches: "branch-map" };

for (const locale of ["vi", "en"] as const) {
  for (const name of Object.keys(collectionSchemas) as CollectionName[]) {
    test(`static ${name} adapter produces valid items in ${locale}`, async () => {
      const items = collectionSchemas[name].array().parse(await staticCollectionSource[name]!({ ...site, locale }));
      assert.ok(items.length > 0);
      assert.deepEqual(items.map((item) => item.id), expectedIds[name]);
    });
  }
}

test("project adapter maps details, images, savings and storyId to the correct video", async () => {
  const items = collectionSchemas.projects.array().parse(await staticCollectionSource.projects!(site));
  for (const [i, item] of items.entries()) {
    const project = PROJECTS[i];
    assert.equal(item.title, project.title);
    assert.equal(item.href, `/cong-trinh/${project.slug}`);
    assert.equal(item.image.id, project.image);
    assert.equal(item.savingPerMonth, project.savingPerMonth);
    assert.deepEqual(item.video, STORIES.find((story) => story.id === project.storyId)?.source);
  }
});

test("story, testimonial and post adapters preserve collection content", async () => {
  const stories = collectionSchemas.stories.array().parse(await staticCollectionSource.stories!(site));
  assert.deepEqual(stories.map((item) => [item.title, item.kind, item.poster.id, item.source]), STORIES.map((item) => [item.shortTitle, item.type, item.poster, item.source]));
  const testimonials = collectionSchemas.testimonials.array().parse(await staticCollectionSource.testimonials!(site));
  assert.deepEqual(testimonials, TESTIMONIALS.map((item, i) => ({ ...item, id: `testimonial-${i + 1}` })));
  const posts = collectionSchemas.posts.array().parse(await staticCollectionSource.posts!(site));
  assert.deepEqual(posts.map((item) => [item.title, item.excerpt, item.cover.id, item.readMinutes, item.href]), POSTS.map((item) => [item.title, item.excerpt, item.cover, item.readMinutes, `/tin-tuc/${item.slug}`]));
});

for (const name of ["projects", "stories", "testimonials", "posts"] as const) {
  test(`real ${name} adapter and loader apply ids order and segment filter`, async () => {
    const source = collectionSchemas[name].array().parse(await staticCollectionSource[name]!(site));
    const selected = source.slice(0, 3).reverse();
    assert.equal(selected.length, 3);
    const segment = selected[0].segment!;
    assert.ok(selected.some((item) => item.segment !== segment));
    const type = types[name];
    const def = sectionRegistry.getType(type)!;
    const data = { ...def.defaults as Record<string, unknown>, query: { ids: selected.map((item) => item.id), limit: 3 } };
    const section = { id: type, type, variant: "t15", enabled: true, data };
    const load = createCollectionLoader(staticCollectionSource);
    const loaded = await load({ section, data, site });
    const parsed = def.schema.parse(loaded) as { items: { id: string }[] };
    assert.deepEqual(parsed.items, selected);
    const filtered = def.schema.parse(await load({ section, data: { ...data, query: { ...data.query, filter: { segment } } }, site })) as { items: { id: string }[] };
    assert.deepEqual(filtered.items, selected.filter((item) => item.segment === segment));
  });
}

test("product and branch adapters preserve details, prices, contacts and coordinates", async () => {
  const products = collectionSchemas.products.array().parse(await staticCollectionSource.products!(site));
  for (const [i, item] of products.entries()) {
    const original = PRODUCTS[i];
    assert.equal(item.href, "/san-pham/" + original.slug);
    assert.equal(item.categoryLabel, CATEGORY_LABEL[original.category]);
    assert.deepEqual(item.images.map((image) => image.id), original.images);
    assert.deepEqual(item.specs, Object.entries(original.specs).map(([label, value]) => ({ label, value })));
    assert.equal(item.price, original.price);
    assert.equal(item.salePrice, original.salePrice);
  }
  const branches = collectionSchemas.branches.array().parse(await staticCollectionSource.branches!(site));
  for (const [i, item] of branches.entries()) {
    assert.deepEqual(item.office, siteConfig.branches[i].office);
    assert.deepEqual(item.warehouse, siteConfig.branches[i].warehouse);
    assert.equal(item.hotline, siteConfig.branches[i].hotline.main);
    assert.equal(item.hours, siteConfig.branches[i].openingHours);
  }
});

for (const name of ["products", "branches"] as const) {
  test("real " + name + " loader respects ids order, filter and limit", async () => {
    const items = collectionSchemas[name].array().parse(await staticCollectionSource[name]!(site));
    const selected = items.slice(0, 3).reverse();
    const type = types[name];
    const def = sectionRegistry.getType(type)!;
    const data = { ...def.defaults as Record<string, unknown>, query: { ids: selected.map((item) => item.id), filter: {}, limit: 3 } };
    const section = { id: type, type, variant: "t15", enabled: true, data };
    const load = createCollectionLoader(staticCollectionSource);
    const loaded = def.schema.parse(await load({ section, data, site })) as { items: unknown[] };
    assert.deepEqual(loaded.items, selected);
    const filtered = def.schema.parse(await load({ section, data: { ...data, query: { ...data.query, filter: { id: selected[0].id }, limit: 1 } }, site })) as { items: unknown[] };
    assert.deepEqual(filtered.items, [selected[0]]);
  });
}
