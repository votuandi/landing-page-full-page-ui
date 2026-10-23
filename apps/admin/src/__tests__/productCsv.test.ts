import assert from "node:assert/strict";
import test from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { collectionDefs, exportProductsCsv, CollectionError, type CollectionRow } from "@solar/db";
import { createAction, createRoute } from "../lib/action.ts";
import { createProductCsvHandlers, productCsvSchema, type ProductCsvDeps } from "../lib/productCsv.ts";

const tenantId = "e7140000-0000-4000-8000-000000000001";
function setup(role: "owner" | "viewer" = "owner", catalog = true, bilingual = true) {
  let writes = 0, reads = 0;
  const row: CollectionRow = { id: tenantId, slug: "pin", title: { vi: "Pin" }, status: "published", order: 0, publishedAt: new Date(), data: collectionDefs.product.defaults.data, ...collectionDefs.product.defaults.columns };
  const session: Session = { id: "s", accountId: tenantId, tenantId, realm: "site", audience: "admin", kind: "user", role, permissions: effectivePermissions({ role, audience: "admin" }), expiresAt: new Date(Date.now() + 10000), mustChangePassword: false };
  const context = { tenantId, slug: "mau", session };
  const deps: ProductCsvDeps = {
    entitlements: async () => feature => feature === "catalog" ? catalog : bilingual,
    list: async (tenant, name) => { assert.equal(tenant, tenantId); reads++; return name === "product" ? [row] : []; },
    import: async (tenant, text, options) => { assert.equal(tenant, tenantId); assert.equal(options.bilingual, bilingual); assert.ok(text); writes++; return { count: 1 }; },
  };
  const handlers = createProductCsvHandlers(deps), action = createAction(async () => context);
  const preview = action("content.edit", productCsvSchema, handlers.preview), confirm = action("content.edit", productCsvSchema, handlers.import);
  const form = (csv = exportProductsCsv([row], [], [])) => { const f = new FormData(); f.set("text", csv); return f; };
  return { row, deps, preview, confirm, form, reads: () => reads, writes: () => writes, download: createRoute(async () => context)("content.edit", handlers.export) };
}
test("preview never writes", async () => {
  const s = setup(); const result = await s.preview({}, s.form());
  assert.equal(result.ok, true); assert.equal(result.csvRows?.[0].kind, "unchanged"); assert.equal(s.writes(), 0);
});
test("requires catalog and content.edit", async () => {
  for (const [s, status] of [[setup("viewer"), 403], [setup("owner", false), 404]] as const) {
    assert.equal((await s.preview({}, s.form())).status, 403);
    assert.equal((await s.confirm({}, s.form())).status, 403);
    assert.equal((await s.download(new Request("https://mau/api/san-pham/csv"))).status, status);
    assert.equal(s.writes(), 0);
  }
});
test("title_en needs bilingual", async () => {
  const s = setup("owner", true, false);
  const changed = exportProductsCsv([{ ...s.row, title: { vi: "Pin", en: "Changed" } }], [], []);
  const result = await s.preview({}, s.form(changed));
  assert.equal(result.csvRows?.[0].kind, "error"); assert.equal(result.csvRows?.[0].errors[0].column, "title_en");
  assert.equal((await s.confirm({}, s.form(changed))).status, 400); assert.equal(s.writes(), 0);
});
test("confirm recomputes preview and reports repository conflicts", async () => {
  const s = setup(); const text = exportProductsCsv([{ ...s.row, price: 100 }], [], []);
  assert.equal((await s.preview({}, s.form(text))).ok, true);
  s.deps.import = async () => { throw new CollectionError("Đường dẫn đã được dùng", 409); };
  assert.equal((await s.confirm({}, s.form(text))).status, 409);
});
test("CSV download is private and bounded", async () => {
  const s = setup(); const response = await s.download(new Request("https://mau/api/san-pham/csv"));
  assert.equal(response.status, 200); assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.match(response.headers.get("Content-Type")!, /text\/csv/); assert.match(response.headers.get("Content-Disposition")!, /san-pham.csv/);
  s.deps.list = async (_tenant, name) => name === "product" ? Array.from({ length: 1001 }, () => s.row) : [];
  assert.equal((await s.download(new Request("https://mau/api/san-pham/csv"))).status, 400);
});
