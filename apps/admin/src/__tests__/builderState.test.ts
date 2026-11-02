import assert from "node:assert/strict";
import test from "node:test";
import { selectBuilderSection, createPreviewWatch } from "../lib/builderState.ts";
test("bỏ qua select ngoài danh sách", async () => {
  let flushed = false;
  const result = await selectBuilderSection(["hero", "faq"], "hero", "header-other-page", async () => { flushed = true; return { ok: true }; });
  assert.equal(result.selectedId, "hero"); assert.equal(flushed, false);
});
test("không đổi section khi form sai hoặc lỗi lưu", async () => {
  for (const error of ["Có lỗi cần sửa", "Không thể lưu"]) {
    assert.deepEqual(await selectBuilderSection(["hero", "faq"], "hero", "faq", async () => ({ ok: false, error })), { selectedId: "hero", error });
  }
  assert.equal((await selectBuilderSection(["hero", "faq"], "hero", "faq", async () => ({ ok: true }))).selectedId, "faq");
});
test("báo hết phiên khi không có updated", async t => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  let expired = 0;
  const watch = createPreviewWatch(() => { expired++; });
  watch.request(); t.mock.timers.tick(19999); assert.equal(expired, 0);
  watch.updated(); t.mock.timers.tick(1); assert.equal(expired, 0);
  watch.request(); t.mock.timers.tick(20000); assert.equal(expired, 1);
  watch.request(); watch.cancel(); t.mock.timers.tick(20000); assert.equal(expired, 1);
});
