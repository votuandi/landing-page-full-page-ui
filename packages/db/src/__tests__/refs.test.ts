import assert from "node:assert/strict";
import test from "node:test";
import { assertRefsBelongToTenant, CrossTenantRefError, type RefDb } from "../refs.ts";

const own = "019a1234-1234-7123-8123-123456789abc";
const foreign = "019a1234-1234-7123-8123-123456789abd";
const absent = "019a1234-1234-7123-8123-123456789abe";
const names = ["media", "project", "story", "testimonial", "post", "product", "branch", "faq", "brand", "certificate", "pressItem", "service", "productCategory"];
function fixture() {
  const queries: { tenantId: string; ids: string[] }[] = [];
  const db = Object.fromEntries(names.map((name) => [name, {
    async findMany({ where }: { where: { tenantId: string; id: { in: string[] } } }) {
      queries.push({ tenantId: where.tenantId, ids: where.id.in });
      return where.tenantId === "A" && where.id.in.includes(own) ? [{ id: own }] : [];
    },
  }])) as unknown as RefDb;
  return { db, queries };
}

test("empty and static media refs need no database query; protocol-relative URLs are missing", async () => {
  const { db, queries } = fixture();
  await assertRefsBelongToTenant(db, "A", {});
  await assertRefsBelongToTenant(db, "A", { media: ["/images/a.jpg"] });
  assert.deepEqual(queries, []);
  await assert.rejects(assertRefsBelongToTenant(db, "A", { media: ["//foreign/image.jpg"] }), CrossTenantRefError);
  assert.deepEqual(queries, []);
});

test("valid refs are tenant-scoped and deduplicated, including all collection types", async () => {
  const { db, queries } = fixture();
  await assertRefsBelongToTenant(db, "A", {
    media: [own, own, own.toUpperCase(), "/images/a.jpg"],
    collections: Object.fromEntries(["projects", "stories", "testimonials", "posts", "products", "branches", "faqs", "brands", "certificates", "press", "services", "productCategories"].map((kind) => [kind, [own]])),
  });
  assert.equal(queries.length, 13);
  for (const query of queries) assert.deepEqual(query, { tenantId: "A", ids: [own] });
});

test("reports every foreign, absent and malformed id without sending malformed UUIDs to Postgres", async () => {
  const { db, queries } = fixture();
  await assert.rejects(assertRefsBelongToTenant(db, "A", {
    media: [own, foreign, absent, "bad", "bad"],
    collections: { products: [foreign, "", "/images/a.jpg"] },
  }), (error: unknown) => {
    assert.ok(error instanceof CrossTenantRefError);
    assert.deepEqual(error.missing, [
      { kind: "media", ids: [foreign, absent, "bad"] },
      { kind: "products", ids: [foreign, "", "/images/a.jpg"] },
    ]);
    return true;
  });
  assert.deepEqual(queries.map((query) => query.ids), [[own, foreign, absent], [foreign]]);
});

test("database errors are propagated", async () => {
  const { db } = fixture();
  const failure = new Error("database unavailable");
  db.media.findMany = (() => { throw failure; }) as typeof db.media.findMany;
  await assert.rejects(assertRefsBelongToTenant(db, "A", { media: [own] }), failure);
});

test("unknown collection names fail closed even with empty IDs or inherited property names", async () => {
  const { db, queries } = fixture();
  for (const name of ["unknown", "media", "__proto__", "constructor"]) {
    for (const ids of [[], [own]]) {
      await assert.rejects(assertRefsBelongToTenant(db, "A", { collections: { [name]: ids } }), (error: unknown) => {
        assert.ok(error instanceof CrossTenantRefError);
        assert.deepEqual(error.missing, [{ kind: name, ids }]);
        return true;
      });
    }
  }
  assert.deepEqual(queries, []);
});
