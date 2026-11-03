import assert from "node:assert/strict";
import test from "node:test";
import { sectionRegistry } from "@solar/sections";
import { LIBRARY_GROUPS, libraryStatus } from "../sections/library.ts";

test("mọi type thuộc đúng một nhóm", () => {
  const types = LIBRARY_GROUPS.flatMap(group => group.types);
  assert.equal(types.length, new Set(types).size);
  assert.deepEqual([...types].sort(), Object.keys(sectionRegistry.types).sort());
  assert.deepEqual(LIBRARY_GROUPS.map(group => group.label), ["Mở đầu", "Thuyết phục", "Chuyển đổi", "Nội dung", "Chân trang"]);
});

test("libraryStatus báo giới hạn maxPerPage", () => {
  assert.deepEqual(libraryStatus("calculator", [], ["calculator"], []), { kind: "ok" });
  for (const enabled of [true, false]) assert.deepEqual(libraryStatus("calculator", [{ type: "calculator", enabled }], ["calculator"], []), {
    kind: "limit", reason: 'Chỉ được có tối đa 1 "Dự toán chi phí" trên một trang',
  });
});

test("libraryStatus khóa type ngoài gói", () => {
  for (const [allowed, locked] of [[[], []], [["press"], ["press"]]] as const) {
    assert.deepEqual(libraryStatus("press", [], allowed, locked), { kind: "locked", reason: "Cần nâng cấp gói" });
  }
});
