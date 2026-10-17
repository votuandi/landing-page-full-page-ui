import assert from "node:assert/strict";
import { test } from "node:test";
import { sectionLimitIssues } from "../limits";

test("disabled sections count", () => {
  const sections = [{ type: "calculator", enabled: false }, { type: "calculator", enabled: true }];
  assert.deepEqual(sectionLimitIssues(sections), ['Chỉ được có tối đa 1 "Dự toán chi phí" trên một trang']);
});

test("limits allow empty, unknown and unlimited types and count each type separately", () => {
  assert.deepEqual(sectionLimitIssues([]), []);
  assert.deepEqual(sectionLimitIssues([{ type: "unknown" }, { type: "hero" }, { type: "calculator" }, { type: "projects" }, { type: "projects" }]), []);
  assert.equal(sectionLimitIssues([{ type: "hero" }, { type: "hero" }, { type: "calculator" }, { type: "calculator" }]).length, 2);
});
