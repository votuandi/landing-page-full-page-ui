import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb, forTenant, forPlatform, COLLECTIONS, collectionDefs, saveCollectionItem, type Collection } from "@solar/db";
import { collectionSchemas } from "@solar/sections";
import { createMemoryCache } from "@solar/cache";
import { createCollections } from "../collections";
import { tenantPageTags } from "../cacheTags";
import { createRevalidateHandler, memoryNonces } from "../revalidate";
import { createRateLimiter } from "../rateLimit";
import { createInvalidate } from "../../../../../worker/src/handlers/invalidate.ts";
import { runOnce } from "../../../../../worker/src/loop.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "requires local PostgreSQL";
test("saving a published project revalidates home and project page", { skip }, async () => {
  const db = createDb({ pool: 2 }), platform = createPlatformDb({ pool: 2 }), memory = createMemoryCache();
  const a = randomUUID(), b = randomUUID();
  for (const id of [a, b]) await platform.tenant.create({ data: { id, slug: `e7-s06-web-${id}`, name: "[DỮ LIỆU MẪU] Cache", planId: "premium", status: "active" } });
  try {
    const input = { ...collectionDefs.project.defaults, slug: "da-nang", status: "published" as const };
    const original = await saveCollectionItem(db, a, "project", input);
    await saveCollectionItem(db, b, "project", { ...input, title: { vi: "[DỮ LIỆU MẪU] Tenant B" } });
    const post = createRevalidateHandler({ secret: () => "test-secret", invalidate: memory.invalidate, revalidateTag: () => {}, limit: createRateLimiter(), claimNonce: memoryNonces() });
    const handle = createInvalidate({ urls: () => "http://web/api/revalidate", secret: () => "test-secret", fetch: (url, init) => post(new Request(url, init)) });
    const drain = (tenantId: string) => runOnce({ outbox: forPlatform(platform).outbox, tenantId, topics: { invalidate: { handle, maxAgeMs: Infinity } } });
    await drain(a); await drain(b);
    let bReads = 0;
    // These two page-cache entries use the same dependency tags as the public Next page renderer.
    const page = (tenantId: string, path: string) => memory.cached(async () => {
      if (tenantId === b) bReads++;
      const projects = await createCollections(forTenant(db, tenantId), tenantId, "vi", memory).projects();
      return path === "/" ? projects.map(p => p.title).join("|") : projects.find(p => p.slug === "da-nang")?.title;
    }, { keyParts: [tenantId, "e7-s06-page", path], tags: tenantPageTags(tenantId, path) });
    for (const path of ["/", "/cong-trinh/da-nang"]) assert.equal(await page(a, path), input.title.vi);
    const other = await page(b, "/");
    const title = { vi: "[DỮ LIỆU MẪU] Đà Nẵng đã cập nhật" };
    await saveCollectionItem(db, a, "project", { ...input, id: original.id, title });
    const job = await forTenant(db, a).outbox.first({ where: { status: "pending" } });
    assert.deepEqual(job?.payload, { tags: [`tenant:${a}:collection:project`] });
    assert.equal(await page(a, "/"), input.title.vi);
    assert.equal(await drain(a), 1);
    for (const path of ["/", "/cong-trinh/da-nang"]) assert.equal(await page(a, path), title.vi);
    assert.equal(await page(b, "/"), other); assert.equal(bReads, 1);
  } finally {
    await platform.tenant.deleteMany({ where: { id: { in: [a, b] } } });
    await Promise.all([db.$disconnect(), platform.$disconnect()]);
  }
});
test("every collection default renders on web", { skip }, async () => {
  const db = createDb({ pool: 2 }), platform = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  await platform.tenant.create({ data: { id: tenantId, slug: `e7-s06-defaults-${tenantId}`, name: "[DỮ LIỆU MẪU] Defaults", planId: "premium", status: "active" } });
  try {
    const repo = forTenant(db, tenantId);
    const ids = new Map<Collection, string>();
    for (const name of COLLECTIONS) ids.set(name, (await saveCollectionItem(db, tenantId, name, { ...collectionDefs[name].defaults, status: "published" })).id);
    const adapter = createCollections(repo, tenantId);
    const site = { tenantId, themeId: "t15", locale: "vi" as const };
    for (const key of Object.keys(collectionSchemas) as (keyof typeof collectionSchemas)[]) {
      const items = await adapter.source[key]!(site); assert.equal(items.length, 1, key);
      assert.ok(collectionSchemas[key].safeParse(items[0]).success, key);
    }
    for (const load of [adapter.faqs, adapter.services, adapter.certificates, adapter.press]) assert.equal((await load()).length, 1);
    for (const name of ["brand", "productCategory"] as const) {
      const row = await repo[name].get(ids.get(name)!); assert.ok(row); assert.equal(row.status, "published");
    }
    await saveCollectionItem(db, tenantId, "product", { ...collectionDefs.product.defaults, id: ids.get("product"), status: "published", columns: { categoryId: ids.get("productCategory"), brandId: ids.get("brand") } });
    const product = (await createCollections(repo, tenantId).products())[0];
    assert.equal(product.categoryLabel, collectionDefs.productCategory.defaults.title.vi);
    assert.equal(product.brand, collectionDefs.brand.defaults.title.vi);
  } finally { await platform.tenant.delete({ where: { id: tenantId } }); await Promise.all([db.$disconnect(), platform.$disconnect()]); }
});
