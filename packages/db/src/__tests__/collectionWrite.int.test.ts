import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { createDb, createPlatformDb, forTenant, collectionDefs, saveCollectionItem, duplicateCollectionItem, deleteCollectionItem, reorderCollection, CollectionError } from "../index.ts";

const skip = !(process.env.DATABASE_URL && process.env.PLATFORM_DATABASE_URL) && "requires local PostgreSQL";
test("collection writes preserve publication, slug, references and tenant invariants", { skip }, async t => {
  const db = createDb({ pool: 2 }), platform = createPlatformDb({ pool: 2 });
  const tenantId = randomUUID(), otherId = randomUUID();
  const repo = forTenant(db, tenantId), other = forTenant(db, otherId);
  const project = { ...collectionDefs.project.defaults, status: "draft" as const };
  const error = (status: number) => (e: unknown) => e instanceof CollectionError && e.status === status;
  for (const id of [tenantId, otherId]) await platform.tenant.create({ data: { id, slug: `e7-s06-${id}`, name: "[DỮ LIỆU MẪU] Collection", planId: "premium", status: "active" } });
  try {
    await t.test("invalidates only when published before or after", async () => {
      const row = await saveCollectionItem(db, tenantId, "project", project);
      assert.equal(await repo.outbox.count(), 0);
      await saveCollectionItem(db, tenantId, "project", { ...project, id: row.id, status: "published" });
      assert.ok((await repo.project.get(row.id))?.publishedAt);
      assert.equal(await repo.outbox.count(), 1);
      await saveCollectionItem(db, tenantId, "project", { ...project, id: row.id });
      assert.equal((await repo.project.get(row.id))?.publishedAt, null);
      assert.equal(await repo.outbox.count(), 2);
    });
    await t.test("duplicate slug conflicts", async () => {
      const results = await Promise.allSettled([1, 2].map(() => saveCollectionItem(db, tenantId, "project", { ...project, slug: "race" })));
      assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
      const rejected = results.find(r => r.status === "rejected");
      assert.ok(rejected?.status === "rejected" && error(409)(rejected.reason));
      await assert.rejects(saveCollectionItem(db, tenantId, "project", { ...project, slug: "☀️" }), error(400));
      await assert.rejects(saveCollectionItem(db, tenantId, "project", { ...project, title: { vi: "☀️" } }), error(400));
    });
    await t.test("duplicate creates draft copy", async () => {
      const original = await repo.project.first(); assert.ok(original);
      for (const suffix of ["-ban-sao", "-ban-sao-2"]) {
        const copy = await repo.project.get((await duplicateCollectionItem(db, tenantId, "project", original.id)).id);
        assert.equal(copy?.slug, `${original.slug}${suffix}`); assert.equal(copy?.status, "draft"); assert.deepEqual(copy?.data, original.data);
      }
    });
    await t.test("delete referenced category is blocked", async () => {
      const cat = await saveCollectionItem(db, tenantId, "productCategory", { ...collectionDefs.productCategory.defaults, status: "draft" });
      await saveCollectionItem(db, tenantId, "product", { ...collectionDefs.product.defaults, status: "draft", columns: { categoryId: cat.id } });
      await assert.rejects(deleteCollectionItem(db, tenantId, "productCategory", cat.id), error(409));
      assert.ok(await repo.productCategory.get(cat.id));
    });
    await t.test("foreign ids are rejected", async () => {
      const cat = await saveCollectionItem(db, otherId, "productCategory", { ...collectionDefs.productCategory.defaults, status: "draft" });
      await assert.rejects(saveCollectionItem(db, tenantId, "productCategory", { ...collectionDefs.productCategory.defaults, id: cat.id, status: "draft" }), error(404));
      await assert.rejects(saveCollectionItem(db, tenantId, "product", { ...collectionDefs.product.defaults, slug: "foreign-ref", status: "draft", columns: { categoryId: cat.id } }), error(400));
      await assert.rejects(duplicateCollectionItem(db, tenantId, "productCategory", cat.id), error(404));
      await assert.rejects(deleteCollectionItem(db, tenantId, "productCategory", cat.id), error(404));
      assert.equal(await other.productCategory.count(), 1);
    });
    await t.test("reorder validates id set", async () => {
      const rows = await repo.project.list(); const ids = rows.map(r => r.id).reverse();
      for (const invalid of [ids.slice(1), [...ids, randomUUID()], ids.map(() => ids[0])]) await assert.rejects(reorderCollection(db, tenantId, "project", invalid), error(400));
      await saveCollectionItem(db, tenantId, "project", { ...project, id: ids[0], status: "published" });
      const count = await repo.outbox.count();
      await reorderCollection(db, tenantId, "project", ids);
      assert.deepEqual((await repo.project.list({ orderBy: { order: "asc" } })).map(r => r.id), ids);
      assert.equal(await repo.outbox.count(), count + 1);
    });
    await t.test("failed invalidation rolls back published content", { skip: !process.env.TEST_OWNER_DATABASE_URL && "requires test owner credentials for a tenant-scoped failure trigger" }, async () => {
      const owner = new pg.Pool({ connectionString: process.env.TEST_OWNER_DATABASE_URL, max: 1 });
      const fn = `e7_s06_fail_${tenantId.replaceAll("-", "")}`;
      await owner.query(`CREATE FUNCTION public.${fn}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'e7-s06 injected outbox failure'; END $$`);
      await owner.query(`CREATE TRIGGER ${fn} BEFORE INSERT ON public."Outbox" FOR EACH ROW WHEN (NEW."tenantId" = '${tenantId}'::uuid) EXECUTE FUNCTION public.${fn}()`);
      try {
        await assert.rejects(saveCollectionItem(db, tenantId, "project", { ...project, slug: "must-rollback", status: "published" }), /e7-s06 injected outbox failure/);
        assert.equal(await repo.project.first({ where: { slug: "must-rollback" } }), null);
      } finally {
        await owner.query(`DROP TRIGGER ${fn} ON public."Outbox"`);
        await owner.query(`DROP FUNCTION public.${fn}()`);
        await owner.end();
      }
    });
    await t.test("category parents cannot form a cycle", async () => {
      const a = await saveCollectionItem(db, tenantId, "productCategory", { ...collectionDefs.productCategory.defaults, slug: "parent-a", status: "draft" });
      const b = await saveCollectionItem(db, tenantId, "productCategory", { ...collectionDefs.productCategory.defaults, slug: "parent-b", columns: { parentId: a.id }, status: "draft" });
      await assert.rejects(saveCollectionItem(db, tenantId, "productCategory", { ...collectionDefs.productCategory.defaults, id: a.id, slug: "parent-a", columns: { parentId: b.id }, status: "draft" }), error(400));
    });
  } finally {
    await platform.tenant.deleteMany({ where: { id: { in: [tenantId, otherId] } } });
    await Promise.all([db.$disconnect(), platform.$disconnect()]);
  }
});
