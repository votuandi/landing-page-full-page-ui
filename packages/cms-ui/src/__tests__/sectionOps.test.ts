import assert from "node:assert/strict";
import { test } from "node:test";
import { moveRelative } from "../sections/ops.ts";
const sections = ["a", "hidden", "b", "c"].map(id => ({ id, type: "faq", variant: "t15", enabled: id !== "hidden" }));
test("moveRelative bỏ qua id lạ", () => {
  for (const [id, target] of [["unknown", "a"], ["a", "unknown"], ["a", "a"]]) assert.equal(moveRelative(sections, id, target, "before"), sections);
});
test("moveRelative giữ section ẩn", () => {
  assert.deepEqual(moveRelative(sections, "c", "b", "before").map(s => s.id), ["a", "hidden", "c", "b"]);
  assert.deepEqual(moveRelative(sections, "a", "b", "after").map(s => s.id), ["hidden", "b", "a", "c"]);
});
test("moveRelative giữ nguyên khi vị trí không đổi", () => {
  assert.deepEqual(moveRelative(sections, "b", "c", "before"), sections);
  assert.deepEqual(moveRelative(sections, "c", "b", "after"), sections);
  const moved = moveRelative(sections, "c", "a", "before");
  assert.deepEqual(moveRelative(moved, "c", "b", "after"), sections);
});
