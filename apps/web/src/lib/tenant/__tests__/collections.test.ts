import assert from "node:assert/strict";
import test from "node:test";
import { COLLECTIONS, collectionDefs, type TenantRepo } from "@solar/db";
import { collectionSchemas, createCollectionLoader, mediaSrc, sectionRegistry, widgetRegistry, type CollectionSource } from "@solar/sections";
import { createCollections, createTenantWidgetLoader } from "../collections";

test("all shared collection defaults render through the public loader", async () => {
  const names = Object.fromEntries(COLLECTIONS.map((name, index) => [name, { list: async () => [{
    id: `e7060000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, slug: `default-${name.toLowerCase()}`, status: "published",
    ...collectionDefs[name].defaults.columns, title: collectionDefs[name].defaults.title, data: collectionDefs[name].defaults.data,
  }] }])) as unknown as TenantRepo;
  const adapter = createCollections(names, "e7060000-0000-4000-8000-000000000099");
  const site = { tenantId: "e7060000-0000-4000-8000-000000000099", themeId: "t15", locale: "vi" as const };
  for (const name of Object.keys(collectionSchemas) as (keyof typeof collectionSchemas)[]) {
    const rows = await adapter.source[name]!(site);
    assert.equal(rows.length, 1, name); assert.ok(collectionSchemas[name].safeParse(rows[0]).success, name);
  }
  for (const load of [adapter.services, adapter.faqs, adapter.press, adapter.certificates]) assert.equal((await load()).length, 1);
});

test("empty DB collections stay empty; UUID selectors never select demo slugs or foreign records", async () => {
  const row = { id: "00000000-0000-4000-8000-000000000001", slug: "shared", title: { vi: "Tenant A" }, data: { excerpt: { vi: "Published A" }, cover: "/images/a.webp", readMinutes: 2, body: ["Body"] } };
  const repo = { post: { list: async ({ where }: { where: unknown }) => { assert.deepEqual(where, { status: "published" }); return [row]; } }, project: { list: async () => [] } } as unknown as TenantRepo;
  const adapter = createCollections(repo, "tenant-a");
  assert.deepEqual(await adapter.source.projects!({ tenantId: "tenant-a", themeId: "t15", locale: "vi" }), []);
  const def = sectionRegistry.types.blog;
  const load = createCollectionLoader(adapter.source);
  const base = { ...def.defaults, query: { ...def.defaults.query, ids: [row.id] } };
  const run = (data: unknown) => load({ section: { id: "blog", type: "blog", variant: "t15", enabled: true, data }, data, site: { tenantId: "tenant-a", themeId: "t15", locale: "vi" } });
  const result = def.schema.parse(await run(base));
  assert.equal(result.items[0].id, row.id);
  assert.equal(result.items[0].href, "/tin-tuc/shared");
  const foreign = def.schema.parse(await run({ ...base, query: { ...base.query, ids: ["00000000-0000-4000-8000-000000000002"] } }));
  assert.deepEqual(foreign.items, []);
});

const site = { tenantId: "tenant-a", themeId: "t15", locale: "vi" as const };
const productData = { images: ["/images/a.webp"], powerKw: 5, warranty: { vi: "5 năm" }, tech: [], segment: ["home"], specs: {}, unit: "bộ", datasheet: "/files/spec.pdf" };
const postData = { excerpt: { vi: "Bài tốt" }, cover: "/images/a.webp", readMinutes: 2, body: ["Body"] };
const row = (id: string, data: unknown, extra: object = {}) => ({ id, slug: id, title: { vi: id }, data, status: "published", ...extra });
function repository(collections: Record<string, ReturnType<typeof row>[]>) {
  return Object.fromEntries(Object.entries(collections).map(([name, rows]) => [name, { list: async ({ where }: { where: { status: string } }) => {
    assert.equal(where.status, "published");
    return rows.filter((item) => item.status === where.status);
  } }])) as unknown as TenantRepo;
}
async function hydrate(source: CollectionSource, type: "blog" | "products" | "projects", query: object = {}) {
  const def = sectionRegistry.types[type];
  const data = { ...def.defaults, query: { ...def.defaults.query, ...query } };
  return def.schema.parse(await createCollectionLoader(source)({ section: { id: type, type, variant: "t15", enabled: true, data }, data, site }));
}

test("DB post segment survives blog filtering and numeric sort", async () => {
  const adapter = createCollections(repository({ post: [
    row("slow", { ...postData, readMinutes: 8 }, { segment: "household" }),
    row("other", postData, { segment: "factory" }),
    row("fast", postData, { segment: "household" }),
  ] }), site.tenantId);
  const blog = await hydrate(adapter.source, "blog", { filter: { segment: "household" }, sort: { field: "readMinutes", dir: "asc" } });
  assert.deepEqual(blog.items.map((item) => item.id), ["fast", "slow"]);
  assert.ok(blog.items.every((item) => "segment" in item && item.segment === "household"));
});

test("collection media preserves safe HTTPS/static sources and leaves UUIDs unresolved", async () => {
  const images = ["https://example.com/a.webp", "/images/a.webp", "00000000-0000-4000-8000-000000000001"];
  const adapter = createCollections(repository({
    post: images.map((image, i) => row(`post-${i}`, { ...postData, cover: image })),
    project: images.map((image, i) => row(`project-${i}`, { location: "HCM", image, detail: "Chi tiết", metrics: [] }, { segment: "household", kwp: 5 })),
    product: [row("product", { ...productData, images }, { categoryId: "category", brandId: "brand" })],
    productCategory: [row("category", {}, { slug: "panel" })], brand: [row("brand", {})],
  }), site.tenantId);
  const posts = (await adapter.source.posts!(site)).map((item) => collectionSchemas.posts.parse(item));
  const projects = (await adapter.source.projects!(site)).map((item) => collectionSchemas.projects.parse(item));
  const products = (await adapter.source.products!(site)).map((item) => collectionSchemas.products.parse(item));
  for (const refs of [posts.map((item) => item.cover), projects.map((item) => item.image), products[0].images]) {
    assert.deepEqual(refs.map(mediaSrc), [images[0], images[1], undefined]);
  }
  for (const id of ["http://example.com/a.webp", "javascript:alert(1)", "//example.com/a.webp", "/../private.webp", "/%2e%2e/private.webp"]) {
    assert.equal(mediaSrc({ id, alt: { vi: "unsafe" } }), undefined);
  }
});

test("published products survive nullable or draft category/brand without exposing draft titles", async () => {
  const adapter = createCollections(repository({
    product: [
      row("no-brand", productData, { categoryId: "category", brandId: null }),
      row("no-category", productData, { categoryId: null, brandId: "brand" }),
      row("no-relations", { ...productData, datasheet: "#" }, { categoryId: null, brandId: null }),
      row("draft-relations", productData, { categoryId: "draft-category", brandId: "draft-brand" }),
    ],
    productCategory: [row("category", {}, { slug: "panel" }), row("draft-category", {}, { title: { vi: "PRIVATE category" }, status: "draft" })],
    brand: [row("brand", {}), row("draft-brand", {}, { title: { vi: "PRIVATE brand" }, status: "draft" })],
  }), site.tenantId);
  const catalog = await adapter.products();
  assert.deepEqual(catalog.map((item) => item.slug), ["no-brand", "no-category", "no-relations", "draft-relations"]);
  assert.equal(catalog[0].datasheet, "/files/spec.pdf");
  assert.equal(catalog[0].unit, "bộ");
  assert.equal(catalog[2].datasheet, undefined);
  const products = await adapter.source.products!(site);
  assert.equal(products.length, 4);
  assert.ok(products.every((item) => collectionSchemas.products.safeParse(item).success));
  assert.doesNotMatch(JSON.stringify(products), /PRIVATE/);
});

test("one invalid collection item is logged and skipped while valid products/projects/posts still hydrate", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const adapter = createCollections(repository({
    post: [row("good-post", postData), row("bad-post", { ...postData, excerpt: "PRIVATE".padEnd(1600, "x") })],
    product: [row("good-product", productData, { categoryId: "category", brandId: "brand" }), row("bad-product", { ...productData, images: Array(9).fill("/images/a.webp") }, { categoryId: "category", brandId: "brand" })],
    productCategory: [row("category", {}, { slug: "panel" })], brand: [row("brand", {})],
    project: [row("good-project", { location: "HCM", image: "/images/a.webp", detail: "Chi tiết", metrics: [] }, { segment: "household", kwp: 5 }), row("bad-project", { location: "", image: "/images/a.webp", detail: "Chi tiết", metrics: [] }, { segment: "household", kwp: 5 })],
  }), site.tenantId);
  for (const [type, collection, expected] of [["blog", "posts", "good-post"], ["products", "products", "good-product"], ["projects", "projects", "good-project"]] as const) {
    assert.deepEqual((await adapter.source[collection]!(site)).map((item) => (item as { id: string }).id), [expected]);
    assert.deepEqual((await hydrate(adapter.source, type, { filter: {} })).items.map((item) => item.id), [expected]);
  }
  for (const recordId of ["bad-post", "bad-product", "bad-project"]) {
    assert.ok(log.mock.calls.some((call) => JSON.stringify(call.arguments).includes(recordId)), `${recordId} must be logged`);
  }
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /PRIVATE/);
});

test("updating DB columns overrides stale JSONB segment/kind/rating/primary values", async () => {
  const product = row("product", productData, { categoryId: "category", brandId: "brand", segments: ["home"] });
  const story = row("story", { location: "HCM", kwp: 5, segment: "household", type: "done", poster: "/images/a.webp", source: { provider: "youtube", idOrSrc: "abcdefgh" } }, { segment: "household", kind: "done" });
  const testimonial = row("testimonial", { location: "HCM", kwp: 5, segment: "household", quote: "Tốt", rating: 1 }, { segment: "household", rating: 1 });
  const branch = row("branch", { hotline: "0901234567", primary: false, office: { address: "HCM", lat: 10.8, lng: 106.6 } }, { isPrimary: false });
  const repo = repository({ product: [product], productCategory: [row("category", {}, { slug: "panel" })], brand: [row("brand", {})], story: [story], testimonial: [testimonial], branch: [branch] });
  Object.assign(product, { segments: ["project"] });
  Object.assign(story, { segment: "factory", kind: "customer" });
  Object.assign(testimonial, { segment: "farm", rating: 5 });
  Object.assign(branch, { isPrimary: true });
  const adapter = createCollections(repo, site.tenantId);
  assert.deepEqual((await adapter.products())[0].segment, ["project"]);
  const mappedStory = collectionSchemas.stories.parse((await adapter.source.stories!(site))[0]);
  assert.equal(mappedStory.segment, "factory");
  assert.equal(mappedStory.kind, "customer");
  const mappedTestimonial = collectionSchemas.testimonials.parse((await adapter.source.testimonials!(site))[0]);
  assert.equal(mappedTestimonial.segment, "farm");
  assert.equal(mappedTestimonial.rating, 5);
  assert.equal(collectionSchemas.branches.parse((await adapter.source.branches!(site))[0]).primary, true);
});

test("cart lookup retains all 49 published SKUs despite a filtered one-item widget query", async () => {
  const adapter = createCollections(repository({ product: Array.from({ length: 49 }, (_, i) => row(`sku-${i}`, productData, { categoryId: null, brandId: null })), productCategory: [], brand: [] }), site.tenantId);
  const def = widgetRegistry.getType("quote-cart")!;
  const config = def.schema.parse({ ...def.defaults as object, query: { collection: "products", limit: 1, ids: ["sku-0"] } });
  const loaded = def.schema.parse(await createTenantWidgetLoader(adapter.source)({ section: { id: "quote-cart", type: "quote-cart", variant: "t15", enabled: true, data: config }, data: config, site })) as { items: { slug: string }[] };
  assert.deepEqual(loaded.items.map((item) => item.slug), (await adapter.products()).map((item) => item.slug));
  assert.equal(loaded.items[48].slug, "sku-48");
});

test("published collection cache isolates site/locale and invalidates only its collection", async () => {
  const { createMemoryCache, collectionTag } = await import("@solar/cache");
  const memory = createMemoryCache();
  const tenantId = "00000000-0000-4000-8000-000000000001", other = "00000000-0000-4000-8000-000000000002";
  let reads = 0;
  const repo = repository({ post: [row("post", postData)] });
  const counted = { ...repo, post: { ...repo.post, list: async () => { reads++; return [row("post", postData)]; } } } as unknown as TenantRepo;
  const load = (id = tenantId, locale: "vi" | "en" = "vi") => createCollections(counted, id, locale, memory, id).posts();
  await load(); await load(); assert.equal(reads, 1);
  await load(other); await load(tenantId, "en"); assert.equal(reads, 3);
  await memory.invalidate([collectionTag(tenantId, "project")]); await load(); assert.equal(reads, 3);
  await memory.invalidate([collectionTag(tenantId, "post")]);
  await load(other); assert.equal(reads, 3);
  await load(); await load(tenantId, "en"); assert.equal(reads, 5);
});
