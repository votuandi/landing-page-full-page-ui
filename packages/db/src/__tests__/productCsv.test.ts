import assert from "node:assert/strict";
import test from "node:test";
import { collectionDefs } from "../collections.ts";
import type { CollectionRow } from "../collectionWrite.ts";
import { parseCsv, toCsv } from "../csv.ts";
import { PRODUCT_CSV_COLUMNS as C, exportProductsCsv, previewProductCsv } from "../productCsv.ts";

export const product: CollectionRow = { id: "11111111-1111-4111-8111-111111111111", slug: "san-pham", title: { vi: "Tấm pin Việt" }, status: "published", order: 4, publishedAt: new Date(), ...collectionDefs.product.defaults.columns, data: collectionDefs.product.defaults.data };
const refs = { categories: [], brands: [] };
const preview = (text: string, existing = [product]) => previewProductCsv(text, existing, refs, { bilingual: true });
const edit = (changes: Record<string, string>) => {
  const rows = parseCsv(exportProductsCsv([product], [], []));
  for (const [key, value] of Object.entries(changes)) rows[1][C.indexOf(key as typeof C[number])] = value;
  return toCsv(rows);
};
test("export starts with BOM and uses CRLF", () => {
  const csv = exportProductsCsv([product], [], []);
  assert.equal(Buffer.from(csv).subarray(0, 3).toString("hex"), "efbbbf");
  assert.ok(csv.includes("Tấm pin Việt")); assert.ok(csv.endsWith("\r\n"));
  assert.deepEqual(parseCsv(csv)[0], [...C]);
});
test("preview classifies create update unchanged error", () => {
  assert.equal(preview(exportProductsCsv([product], [], [])).rows[0].kind, "unchanged");
  assert.equal(preview(edit({ price: "100" })).rows[0].kind, "update");
  assert.equal(preview(edit({ slug: "moi" })).rows[0].kind, "create");
  assert.equal(preview(edit({ price: "bad" })).rows[0].kind, "error");
  assert.equal(preview(edit({ slug: "", title_vi: "Sản phẩm mới" })).rows[0].slug, "san-pham-moi");
});
test("row errors come from shared product schema", () => {
  const row = preview(edit({ price: "100", salePrice: "101" })).rows[0];
  assert.equal(row.kind, "error"); assert.ok(row.errors.some(e => e.column === "salePrice" && /nhỏ hơn/.test(e.message)));
});
test("formula prefix round-trips", () => {
  for (const prefix of ["=", "+", "-", "@", "\t", "\r", "'="]) {
    const p = { ...product, title: { vi: prefix + "SUM(1,2)" } };
    const csv = exportProductsCsv([p], [], []);
    assert.ok(parseCsv(csv)[1][1].startsWith("'"));
    const parsed = previewProductCsv(csv, [], refs, { bilingual: true });
    assert.equal(parsed.inputs[0]?.title.vi, p.title.vi);
  }
});
test("duplicate slug in file", () => {
  const csv = parseCsv(edit({ price: "100" })); csv.push(csv[1]);
  assert.match(preview(toCsv(csv)).rows[1].errors[0].message, /trùng với dòng 2/);
});
test("header validation", () => {
  for (const header of [C.slice(1), [...C, "unknown"], [...C, "slug"]]) assert.equal(preview(toCsv([header])).rows[0].line, 1);
  const rows = parseCsv(edit({ price: "100" }));
  assert.equal(preview(toCsv(rows.map(r => r.toReversed()))).rows[0].kind, "update");
});
test("bad cell values report column", () => {
  for (const [column, value] of Object.entries({ specs: "{bad", price: "12x", featured: "maybe", tech: '["bad"', powerKw: "Infinity" })) {
    assert.ok(preview(edit({ [column]: value })).rows[0].errors.some(e => e.column === column), column);
  }
  const changed = preview(edit({ tech: JSON.stringify(["a|b", "[x", '"y']), warranty: JSON.stringify({ vi: "5 năm", en: "5 years" }) }));
  assert.equal(changed.rows[0].kind, "update");
});
test("rejects oversized file and too many rows", () => {
  assert.match(preview("é".repeat(250_001)).rows[0].errors[0].message, /500/);
  const rows = parseCsv(edit({ price: "100" }));
  assert.match(preview(toCsv([rows[0], ...Array.from({ length: 1001 }, () => rows[1])])).rows[0].errors[0].message, /1000/);
  assert.throws(() => exportProductsCsv(Array.from({ length: 1001 }, () => product), [], []), /1000/);
});
test("empty file", () => {
  for (const text of ["", "\uFEFF", toCsv([C])]) assert.deepEqual(preview(text), { rows: [], inputs: [] });
});
test("unchanged legacy rows bypass validation", () => {
  const legacy = { ...product, data: { broken: true } };
  assert.equal(preview(exportProductsCsv([legacy], [], []), [legacy]).rows[0].kind, "unchanged");
});
test("ambiguous strings and optional arrays round-trip through schema", () => {
  for (const compatible of [undefined, [], ["", "a|b", "[x", '"y']]) {
    const p = { ...product, title: { vi: '[DỮ LIỆU MẪU] "Pin"', en: "English" }, data: { ...collectionDefs.product.defaults.data as object,
      compatible, tech: ["", "a|b"], warranty: { vi: "5 năm", en: "5 years" }, specs: { "Có | dấu": '{"ký tự"}' } } };
    const result = previewProductCsv(exportProductsCsv([p], [], []), [], refs, { bilingual: true });
    assert.equal(result.rows[0].kind, "create", JSON.stringify(result.rows));
    assert.deepEqual((result.inputs[0].data as Record<string, unknown>).compatible, compatible);
    assert.deepEqual((result.inputs[0].data as Record<string, unknown>).tech, ["", "a|b"]);
    assert.deepEqual(result.inputs[0].title, p.title);
  }
});
test("hand-typed text starting with [ stays plain text", () => {
  const title = "[DỮ LIỆU MẪU] Tấm pin [mới]", warranty = "[DỮ LIỆU MẪU] 10 năm";
  const result = preview(edit({ slug: "moi", title_vi: title, warranty }));
  assert.deepEqual(result.rows[0].errors, []);
  assert.equal(result.inputs[0].title.vi, title);
  assert.equal((result.inputs[0].data as { warranty: unknown }).warranty, warranty);
  const saved = { ...product, slug: "moi", title: { vi: title }, data: { ...(product.data as object), warranty } };
  const exported = parseCsv(exportProductsCsv([saved], [], []))[1];
  assert.equal(exported[C.indexOf("title_vi")], title);
  assert.equal(preview(exportProductsCsv([saved], [], []), [saved]).rows[0].kind, "unchanged");
});
