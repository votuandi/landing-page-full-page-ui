import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb, forTenant, collectionDefs, collectionRepository, saveCollectionItem, importCollectionItems, importProductCsv, exportProductsCsv, previewProductCsv } from "../index.ts";
import { parseCsv, toCsv } from "../csv.ts";

test("product CSV transactions", { skip: !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "requires local PostgreSQL" }, async t => {
  const db = createDb({ pool: 2 }), platform = createPlatformDb({ pool: 2 }), tenantId = randomUUID(), otherId = randomUUID();
  const repo = forTenant(db, tenantId), model = collectionRepository(repo, "product");
  for (const id of [tenantId, otherId]) await platform.tenant.create({ data: { id, slug: `csv-${id}`, name: "[DỮ LIỆU MẪU] CSV", planId: "premium", status: "active" } });
  const input = { ...collectionDefs.product.defaults, status: "published" as const };
  try {
    for (const slug of ["a", "b", "c"]) await saveCollectionItem(db, tenantId, "product", { ...input, slug });
    await t.test("export then import unchanged keeps rows", async () => {
      const before = await model.list(), jobs = await repo.outbox.count();
      await importProductCsv(db, tenantId, exportProductsCsv(before, [], []), { bilingual: true });
      assert.deepEqual(await model.list(), before); assert.equal(await repo.outbox.count(), jobs);
    });
    await t.test("any error row blocks the whole import", async () => {
      const before = await model.list(), rows = parseCsv(exportProductsCsv(before, [], [])), jobs = await repo.outbox.count();
      rows[1][6] = "100"; rows[2][6] = "100"; rows[2][7] = "101";
      const p = previewProductCsv(toCsv(rows), before, { categories: [], brands: [] }, { bilingual: true });
      assert.ok(p.rows.some(r => r.line === 3 && r.errors.some(e => e.column === "salePrice")));
      await assert.rejects(importProductCsv(db, tenantId, toCsv(rows), { bilingual: true }), /Dòng 3, cột salePrice/);
      assert.deepEqual(await model.list(), before); assert.equal(await repo.outbox.count(), jobs);
    });
    await t.test("import writes in one transaction and enqueues one invalidation", async () => {
      const before = await model.list(), jobs = await repo.outbox.count();
      await importCollectionItems(db, tenantId, "product", before.map(r => ({ ...input, slug: r.slug, columns: { price: 200 } })));
      assert.equal(await repo.outbox.count(), jobs + 1);
      const after = await model.list(); assert.ok(after.every(r => r.price === 200));
      const latest = await repo.outbox.list({ orderBy: { createdAt: "desc" }, take: 1 });
      assert.ok(JSON.stringify(latest).includes(`tenant:${tenantId}:collection:product`));
      // Failure after an earlier write must roll the entire batch back.
      await assert.rejects(importCollectionItems(db, tenantId, "product", [{ ...input, slug: "rollback" }, { ...input, slug: "bad-ref", columns: { categoryId: randomUUID() } }]));
      assert.equal(await model.first({ where: { slug: "rollback" } }), null);
      assert.equal(await repo.outbox.count(), jobs + 1);
    });
    await t.test("unknown category slug is a row error", async () => {
      const cat = await saveCollectionItem(db, otherId, "productCategory", { ...collectionDefs.productCategory.defaults, status: "draft", slug: "foreign" });
      assert.ok(cat.id);
      const rows = parseCsv(exportProductsCsv(await model.list(), [], [])); rows[1][4] = "foreign";
      await assert.rejects(importProductCsv(db, tenantId, toCsv(rows), { bilingual: true }), /cột category/);
    });
    await t.test("confirm recomputes preview", async () => {
      const rows = parseCsv(exportProductsCsv([...(await model.list()).slice(0, 1)], [], [])); rows[1][0] = "taken-after-preview";
      assert.equal(previewProductCsv(toCsv(rows), await model.list(), { categories: [], brands: [] }, { bilingual: false }).rows[0].kind, "create");
      await saveCollectionItem(db, tenantId, "product", { ...input, slug: "taken-after-preview", title: { vi: "Khác", en: "Protected English" } });
      const before = await model.list(), jobs = await repo.outbox.count();
      await assert.rejects(importProductCsv(db, tenantId, toCsv(rows), { bilingual: false }), /title_en/);
      assert.deepEqual(await model.list(), before); assert.equal(await repo.outbox.count(), jobs);
    });
    await t.test("update keeps identity and order", async () => {
      const before = await model.list(), old = before[0];
      await importCollectionItems(db, tenantId, "product", [{ ...input, slug: old.slug, columns: { price: 300 } }, { ...input, slug: "last" }]);
      const updated = await model.get(old.id), created = await model.first({ where: { slug: "last" } });
      assert.equal(updated?.order, old.order); assert.deepEqual(updated?.publishedAt, old.publishedAt);
      assert.equal(created?.order, Math.max(...before.map(r => r.order)) + 1);
    });
    await t.test("accepts the 1000 product batch limit", async () => {
      const rows = Array.from({ length: 1000 }, (_, index) => ({ ...input, slug: `limit-${index}` }));
      await importCollectionItems(db, tenantId, "product", rows);
      assert.equal(await repo.product.count({ where: { slug: { startsWith: "limit-" } } }), 1000);
    });
  } finally {
    await platform.tenant.deleteMany({ where: { id: { in: [tenantId, otherId] } } });
    await Promise.all([db.$disconnect(), platform.$disconnect()]);
  }
});
