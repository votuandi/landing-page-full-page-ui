import assert from "node:assert/strict";
import test from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { collectionDefs, collectionFormSchema, type CollectionRow } from "@solar/db";
import { describe } from "@solar/cms-ui";
import { createAction } from "../lib/action.ts";
import { collectionTypes, requireCollection, createCollectionHandlers, loadCollectionList, loadCollectionItem, saveCollectionSchema, collectionIdSchema, reorderCollectionSchema, type CollectionsDeps } from "../lib/collections.ts";

const tenantId = "e7060000-0000-4000-8000-000000000001", id = "e7060000-0000-4000-8000-000000000002";
function setup(role: "owner" | "viewer" = "owner", enabled = true, ghost = false) {
  let reads = 0, writes = 0;
  const session: Session = { id: "session", accountId: id, tenantId, realm: "site", audience: "admin", kind: ghost ? "ghost" : "user", role,
    permissions: effectivePermissions({ role, audience: "admin" }), expiresAt: new Date(Date.now() + 10000), mustChangePassword: false };
  const row = { id, slug: "da-nang", title: { vi: "Đà Nẵng" }, status: "draft", order: 0, data: {}, publishedAt: null, segment: "household" } as CollectionRow;
  const deps: CollectionsDeps = {
    requirePermission: async () => { if (role === "viewer") throw Object.assign(new Error("Forbidden"), { status: 403 }); return session; },
    tenant: async () => ({ tenantId }), entitlements: async () => () => enabled,
    list: async () => { reads++; return [row]; }, item: async () => { reads++; return row; }, count: async () => { reads++; return 1; },
    save: async () => { writes++; return { id, slug: "da-nang" }; }, duplicate: async () => { writes++; return { id }; }, remove: async () => { writes++; }, reorder: async () => { writes++; },
  };
  const action = createAction(async () => ({ tenantId, slug: "mau", session }));
  const handlers = createCollectionHandlers(deps);
  const actions = { save: action("content.edit", saveCollectionSchema, handlers.save), duplicate: action("content.edit", collectionIdSchema, handlers.duplicate), remove: action("content.edit", collectionIdSchema, handlers.remove), reorder: action("content.edit", reorderCollectionSchema, handlers.reorder) };
  const form = (collection = "du-an") => {
    const f = new FormData(); f.set("collection", collection); f.set("id", id); f.set("ids", JSON.stringify([id]));
    f.set("payload", JSON.stringify({ ...collectionDefs.project.defaults, status: "draft" })); return f;
  };
  return { deps, actions, form, reads: () => reads, writes: () => writes };
}
test("collection outside plan is hidden and rejected", async () => {
  const s = setup("owner", false);
  assert.equal(collectionTypes(() => false).some(d => d.name === "product"), false);
  assert.equal(requireCollection("san-pham", () => false), null);
  assert.equal(await loadCollectionList("san-pham", {}, s.deps), null);
  for (const action of Object.values(s.actions)) assert.equal((await action({}, s.form("san-pham"))).status, 403);
  assert.equal(s.reads(), 0); assert.equal(s.writes(), 0);
});
test("requires content.edit", async () => {
  const s = setup("viewer");
  for (const action of Object.values(s.actions)) assert.equal((await action({}, s.form())).status, 403);
  await assert.rejects(loadCollectionList("du-an", {}, s.deps));
  assert.equal(s.reads(), 0); assert.equal(s.writes(), 0);
});
test("ghost writes follow permitted content.edit without actor", async () => {
  const s = setup("owner", true, true);
  assert.equal((await s.actions.save({}, s.form())).ok, true); assert.equal(s.writes(), 1);
});
test("search ignores diacritics", async () => {
  const s = setup();
  assert.equal((await loadCollectionList("du-an", { q: "da nang" }, s.deps))?.rows.length, 1);
  for (const q of ["%", "_"]) assert.equal((await loadCollectionList("du-an", { q }, s.deps))?.rows.length, 0);
});
test("reorder disabled while filtered", async () => {
  const s = setup();
  assert.equal((await loadCollectionList("du-an", {}, s.deps))?.canReorder, true);
  for (const query of [{ q: "da" }, { status: "draft" }, { filter: "household" }]) assert.equal((await loadCollectionList("du-an", query, s.deps))?.canReorder, false);
});
test("rejects malformed input", async () => {
  const s = setup();
  for (const payload of ["{", "x".repeat(500_001), "null", "{}", JSON.stringify({ ...collectionDefs.project.defaults, status: "invalid" })]) {
    const f = s.form(); f.set("payload", payload); assert.equal((await s.actions.save({}, f)).status, 400);
  }
  for (const action of Object.values(s.actions)) assert.equal((await action({}, s.form("unknown"))).status, 400);
  const f = s.form(); f.set("ids", '{'); assert.equal((await s.actions.reorder({}, f)).status, 400);
  assert.equal(s.reads(), 0); assert.equal(s.writes(), 0);
});
test("form schema keeps localized title, price rule and hides record id", () => {
  const schema = collectionFormSchema("product"), node = describe(schema);
  assert.equal(node.kind, "object");
  if (node.kind !== "object") return;
  assert.equal(node.fields.find(f => f.key === "title")?.node.kind, "widget");
  assert.equal(node.fields.some(f => f.key === "id"), false);
  assert.equal(schema.safeParse({ ...collectionDefs.product.defaults, status: "draft", columns: { price: 100, salePrice: 101 } }).success, false);
});
test("downgrading keeps existing English title and rejects changing it", async () => {
  const s = setup();
  s.deps.entitlements = async () => feature => feature !== "bilingual";
  s.deps.item = async () => ({ id, title: { vi: "Cũ", en: "Preserved" } }) as CollectionRow;
  let written: unknown;
  s.deps.save = async (_tenant, _name, input) => { written = input.title; return { id, slug: "cu" }; };
  const f = s.form();
  f.set("payload", JSON.stringify({ ...collectionDefs.project.defaults, id, status: "draft" }));
  assert.equal((await s.actions.save({}, f)).ok, true);
  assert.deepEqual(written, { ...collectionDefs.project.defaults.title, en: "Preserved" });
  f.set("payload", JSON.stringify({ ...collectionDefs.project.defaults, id, title: { vi: "Mới", en: "Changed" }, status: "draft" }));
  assert.equal((await s.actions.save({}, f)).status, 403);
});
test("repeated search parameters do not crash the list", async () => {
  const s = setup();
  const data = await loadCollectionList("du-an", { q: ["da", "nang"] as unknown as string, status: ["draft"] as unknown as string }, s.deps);
  assert.ok(data);
});

test("reference choices use tenant titles for new and existing items and exclude self as parent", async () => {
  const s = setup(), otherId = "e7060000-0000-4000-8000-000000000003";
  const calls: string[] = [];
  s.deps.list = async (tenant, name) => {
    assert.equal(tenant, tenantId); calls.push(name);
    return [{ id, title: { vi: "Hiện tại" }, slug: "hien-tai" },
      { id: otherId, title: { vi: name === "brand" ? "Thương hiệu A" : "Danh mục A" }, slug: "a" }] as CollectionRow[];
  };
  for (const recordId of [undefined, id]) {
    const product = await loadCollectionItem("san-pham", recordId, s.deps);
    assert.deepEqual(product?.references, {
      categoryId: [{ value: id, label: "Hiện tại" }, { value: otherId, label: "Danh mục A" }],
      brandId: [{ value: id, label: "Hiện tại" }, { value: otherId, label: "Thương hiệu A" }],
    });
  }
  assert.deepEqual((await loadCollectionItem("danh-muc-san-pham", id, s.deps))?.references,
    { parentId: [{ value: otherId, label: "Danh mục A" }] });
  calls.length = 0;
  assert.deepEqual((await loadCollectionItem("du-an", undefined, s.deps))?.references, {});
  assert.deepEqual(calls, []);
  s.deps.entitlements = async () => () => false;
  assert.equal(await loadCollectionItem("san-pham", undefined, s.deps), null);
  assert.deepEqual(calls, []);
});

test("category filter displays titles while filtering by id", async () => {
  const s = setup();
  s.deps.list = async (tenant, name) => {
    assert.equal(tenant, tenantId);
    return (name === "productCategory" ? [{ id, title: { vi: "Tấm pin" }, slug: "tam-pin" }]
      : [{ id, categoryId: id, title: { vi: "Sản phẩm A" }, slug: "a", status: "draft" }]) as CollectionRow[];
  };
  const list = await loadCollectionList("san-pham", { filter: id }, s.deps);
  assert.deepEqual(list?.filterOptions, [{ value: id, label: "Tấm pin" }]);
  assert.equal(list?.rows.length, 1);
});

test("admin save and reload keep cleared category brand and parent references as null", async () => {
  for (const name of ["product", "productCategory"] as const) {
    const s = setup(), definition = collectionDefs[name];
    const keys = name === "product" ? ["categoryId", "brandId"] : ["parentId"];
    let stored = { id, slug: "ban-ghi", title: definition.defaults.title, status: "draft", data: definition.defaults.data,
      ...definition.defaults.columns, ...Object.fromEntries(keys.map(key => [key, id])) } as CollectionRow;
    s.deps.item = async () => stored;
    s.deps.save = async (tenant, collection, input) => {
      assert.equal(tenant, tenantId); assert.equal(collection, name);
      stored = { ...stored, ...input.columns }; return { id, slug: stored.slug };
    };
    const form = s.form(definition.path);
    form.set("payload", JSON.stringify({ ...definition.defaults, id, status: "draft",
      columns: { ...definition.defaults.columns, ...Object.fromEntries(keys.map(key => [key, null])) } }));
    assert.equal((await s.actions.save({}, form)).ok, true);
    const reloaded = await loadCollectionItem(definition.path, id, s.deps);
    assert.ok(reloaded);
    for (const key of keys) assert.equal(reloaded.input.columns[key], null);
  }
});
