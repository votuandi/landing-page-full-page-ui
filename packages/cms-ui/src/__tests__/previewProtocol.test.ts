import assert from "node:assert/strict";
import { test } from "node:test";
import { adminOrigin, parsePreviewMessage, shouldHandlePreview } from "../preview/protocol.ts";
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
