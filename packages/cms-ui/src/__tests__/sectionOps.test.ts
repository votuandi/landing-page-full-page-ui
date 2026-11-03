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
import { insertRelative, newSectionId } from "../sections/ops.ts";

test("insertRelative", () => {
  const value = ["hero", "faq", "cta"].map(id => ({ id, type: id, variant: "t15", enabled: true }));
  const section = { id: "process-new", type: "process", variant: "t15", enabled: true };
  assert.deepEqual(insertRelative(value, section, "faq", "after").map(s => s.id), ["hero", "faq", "process-new", "cta"]);
  assert.deepEqual(insertRelative(value, section, "faq", "before").map(s => s.id), ["hero", "process-new", "faq", "cta"]);
  assert.equal(insertRelative(value, value[0], "faq", "after"), value);
  assert.deepEqual(value.map(s => s.id), ["hero", "faq", "cta"]);
  assert.match(newSectionId("calculator"), /^calculator-[A-Za-z0-9_-]+$/);
});

test("insertRelative chèn cuối khi không có target", () => {
  const section = { id: "new", type: "faq", variant: "t15", enabled: true };
  const value = [{ ...section, id: "first" }];
  for (const target of [undefined, "unknown"]) assert.deepEqual(insertRelative(value, section, target).map(s => s.id), ["first", "new"]);
  assert.deepEqual(insertRelative([], section), [section]);
});

test("insertRelative giữ section ẩn", () => {
  const value = ["hero", "hidden", "faq"].map(id => ({ id, type: "faq", variant: "t15", enabled: id !== "hidden" }));
  const section = { id: "new", type: "process", variant: "t15", enabled: true };
  const next = insertRelative(value, section, "faq", "before");
  assert.deepEqual(next.map(s => s.id), ["hero", "hidden", "new", "faq"]);
  assert.equal(next[1], value[1]);
});
