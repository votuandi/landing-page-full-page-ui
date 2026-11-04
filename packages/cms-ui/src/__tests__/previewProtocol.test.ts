import assert from "node:assert/strict";
import { test } from "node:test";
import { adminOrigin, parsePreviewMessage, shouldHandlePreview } from "../preview/protocol.ts";

test("lệnh fields và sự kiện inline sai dạng bị loại", () => {
  const field = { path: ["items", 0, "title"], text: { vi: "Tên", en: "Name" } };
  const fields = { type: "solar-preview", action: "fields", sectionId: "hero", fields: [field] };
  const inline = { type: "solar-preview", action: "inline", sectionId: "hero", path: field.path, locale: "vi", text: "Tên" };
  assert.deepEqual(parsePreviewMessage(fields), fields);
  assert.deepEqual(parsePreviewMessage(inline), inline);
  assert.deepEqual(parsePreviewMessage({ ...fields, fields: [] }), { ...fields, fields: [] });
  for (const path of [[], Array(9).fill("a"), ["__proto__"], ["constructor"], ["prototype"], [-1], [1000], [0.5], ["x.y"], ["a".repeat(41)]]) {
    assert.equal(parsePreviewMessage({ ...inline, path }), null);
    assert.equal(parsePreviewMessage({ ...fields, fields: [field, { ...field, path }] }), null);
  }
  for (const patch of [{ sectionId: undefined }, { text: "a".repeat(2001) }, { text: 5 }, { locale: "fr" }, { locale: undefined }]) assert.equal(parsePreviewMessage({ ...inline, ...patch }), null);
  for (const list of [undefined, {}, Array(301).fill(field), [null], [{ path: ["title"], text: { vi: "x".repeat(2001) } }], [{ ...field, text: { vi: "ok", en: null } }]]) assert.equal(parsePreviewMessage({ ...fields, fields: list }), null);
  assert.ok(parsePreviewMessage({ ...fields, fields: Array(300).fill({ path: ["a".repeat(40), 999], text: { vi: "x".repeat(2000) } }) }));
  assert.ok(parsePreviewMessage({ ...inline, locale: "en", text: "x".repeat(2000) }));
});

test("lệnh kéo thư viện sai dạng bị loại", () => {
  for (const action of ["drag", "drop"]) {
    for (const y of [NaN, Infinity, -1, "10", undefined, 100001]) assert.equal(parsePreviewMessage({ type: "solar-preview", action, y }), null);
    for (const y of [0, 123.5, 100000]) assert.deepEqual(parsePreviewMessage({ type: "solar-preview", action, y }), { type: "solar-preview", action, y });
  }
  const insert = { type: "solar-preview", action: "insert" };
  assert.deepEqual(parsePreviewMessage(insert), insert);
  assert.deepEqual(parsePreviewMessage({ ...insert, targetId: "faq", position: "before" }), { ...insert, targetId: "faq", position: "before" });
  for (const patch of [{ targetId: "faq" }, { position: "after" }, { targetId: "" }, { targetId: '"]', position: "after" }, { targetId: "faq", position: "middle" }, { targetId: undefined }]) {
    assert.equal(parsePreviewMessage({ ...insert, ...patch }), null);
  }
  assert.deepEqual(parsePreviewMessage({ type: "solar-preview", action: "drag-cancel" }), { type: "solar-preview", action: "drag-cancel" });
});
test("rejects unsafe section ids", () => {
  for (const sectionId of ['\"]', '<', '', 'a'.repeat(65)]) assert.equal(parsePreviewMessage({ type: "solar-preview", action: "scroll", sectionId }), null);
  for (const value of [null, [], "solar-preview", { type: "solar-preview", action: "eval" }, { type: "solar-preview", action: { toString: null } }]) assert.equal(parsePreviewMessage(value), null);
  assert.deepEqual(parsePreviewMessage({ type: "solar-preview", action: "refresh", sectionId: "hero-1_a" }), { type: "solar-preview", action: "refresh", sectionId: "hero-1_a" });
});
test("adminOrigin maps only preview hosts, supports dev admin port", () => {
  assert.equal(adminOrigin("a.preview.solar.vn", "https:"), "https://a.admin.solar.vn");
  assert.equal(adminOrigin("a.preview.solar.localhost", "http:", "3300"), "http://a.admin.solar.localhost:3300");
  for (const host of ["a.solar.vn", "a.preview.solar.vn/evil", "a.preview.solar.vn:3212"]) assert.equal(adminOrigin(host, "https:"), null);
  assert.equal(adminOrigin("a.preview.solar.vn", "javascript:"), null);
});
test("bridge rejects foreign origin and non-parent source", () => {
  const parent = {}, stranger = {};
  assert.equal(shouldHandlePreview({ origin: "https://a.admin.solar.vn", source: parent }, "https://a.admin.solar.vn", parent), true);
  assert.equal(shouldHandlePreview({ origin: "https://evil.test", source: parent }, "https://a.admin.solar.vn", parent), false);
  assert.equal(shouldHandlePreview({ origin: "https://a.admin.solar.vn", source: stranger }, "https://a.admin.solar.vn", parent), false);
});
test("reorder sai dạng bị loại", () => {
  const valid = { type: "solar-preview", action: "reorder", sectionId: "faq", targetId: "hero", position: "before" };
  assert.deepEqual(parsePreviewMessage(valid), valid);
  for (const patch of [{ targetId: undefined }, { sectionId: "" }, { targetId: "faq" }, { position: "middle" }, { position: undefined }, { targetId: '"]' }]) {
    assert.equal(parsePreviewMessage({ ...valid, ...patch }), null);
  }
  for (const action of ["select", "visible"]) {
    assert.deepEqual(parsePreviewMessage({ type: "solar-preview", action, sectionId: "faq" }), { type: "solar-preview", action, sectionId: "faq" });
    assert.equal(parsePreviewMessage({ type: "solar-preview", action }), null);
  }
});
