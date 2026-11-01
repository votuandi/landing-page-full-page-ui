import assert from "node:assert/strict";
import test from "node:test";
import { builderReducer, createBuilderHistory, editedContents, insertFromLibrary } from "../app/(admin)/trang/[pageId]/builder/builderState.ts";

const hero = { id: "hero", type: "hero", variant: "t15", enabled: true, anchor: "dau-trang" };
const stats = { id: "stats", type: "stats", variant: "t15", enabled: false };
const initial = { sections: [hero, stats], contents: { hero: { title: { vi: "Cũ", en: "Old" } }, stats: { value: 12 } } };
const policy = { canReorder: true, allowedTypes: ["hero", "faq", "calculator", "projects", "cta-banner"], lockedTypes: [] as string[] };

test("chèn thư viện đầu, giữa, cuối và trang rỗng; giữ type ngoài demo và không sửa input", () => {
  for (const index of [0, 1, 2]) {
    const next = insertFromLibrary(initial, "faq", "new", index, policy);
    assert.equal(next.sections[index].id, "new");
    assert.deepEqual(next.sections.filter(s => s.id !== "new"), initial.sections);
    assert.deepEqual(next.contents.stats, { value: 12 });
    assert.ok(next.contents.new);
  }
  assert.equal(insertFromLibrary({ sections: [], contents: {} }, "faq", "new", 0, policy).sections.length, 1);
  assert.equal(initial.sections.length, 2);
});

test("không chèn type khóa, thiếu quyền, ngoài demo, id trùng hoặc vị trí sai", () => {
  for (const [type, id, index, rules] of [
    ["faq", "new", 1, { ...policy, lockedTypes: ["faq"] }],
    ["faq", "new", 1, { ...policy, canReorder: false }],
    ["faq", "new", 1, { ...policy, allowedTypes: [] }],
    ["stats", "new", 1, { ...policy, allowedTypes: ["stats"] }],
    ["faq", "hero", 1, policy], ["faq", "new", -1, policy],
    ["faq", "new", 3, policy], ["faq", "new", 0.5, policy],
  ] as const) assert.equal(insertFromLibrary(initial, type, id, index, rules), initial);
});

test("maxPerPage tính cả section đang ẩn", () => {
  const once = insertFromLibrary(initial, "calculator", "c1", 1, policy);
  once.sections[1] = { ...once.sections[1], enabled: false };
  assert.equal(insertFromLibrary(once, "calculator", "c2", 0, policy), once);
  assert.equal(insertFromLibrary(initial, "hero", "h2", 0, policy), initial);
});

test("undo redo khôi phục thứ tự, variant, nội dung; đổi variant giữ nguyên nội dung", () => {
  let history = createBuilderHistory(initial);
  history = builderReducer(history, { type: "move", from: 1, to: 0 });
  history = builderReducer(history, { type: "variant", id: "hero", variant: "t12" });
  assert.equal(history.present.contents, initial.contents);
  history = builderReducer(history, { type: "content", id: "hero", data: { title: { vi: "Mới", en: "Old" } } });
  const after = history.present;
  for (let i = 0; i < 3; i++) history = builderReducer(history, { type: "undo" });
  assert.deepEqual(history.present, initial);
  assert.equal(builderReducer(history, { type: "undo" }), history);
  for (let i = 0; i < 3; i++) history = builderReducer(history, { type: "redo" });
  assert.deepEqual(history.present, after);
  assert.equal(builderReducer(history, { type: "redo" }), history);
});

test("50 bước vẫn hoàn tác được, lịch sử có giới hạn và nhánh mới xóa redo", () => {
  let history = createBuilderHistory(initial);
  for (let i = 0; i < 60; i++) history = builderReducer(history, { type: "content", id: "hero", data: { n: i } });
  assert.equal(history.past.length, 50);
  for (let i = 0; i < 50; i++) history = builderReducer(history, { type: "undo" });
  assert.deepEqual(history.present.contents.hero, { n: 9 });
  history = builderReducer(history, { type: "content", id: "hero", data: { n: "nhánh mới" } });
  assert.equal(history.future.length, 0);
});

test("no-op không tạo bước và insert chỉ tạo một bước", () => {
  const history = createBuilderHistory(initial);
  for (const action of [
    { type: "move", from: 0, to: 0 }, { type: "move", from: -1, to: 1 },
    { type: "variant", id: "hero", variant: "t15" },
    { type: "content", id: "missing", data: {} },
    { type: "content", id: "hero", data: initial.contents.hero },
  ] as const) assert.equal(builderReducer(history, action), history);
  const inserted = builderReducer(history, { type: "insert", sectionType: "faq", id: "f", index: 1, policy });
  assert.equal(inserted.past.length, 1);
  assert.deepEqual(builderReducer(inserted, { type: "undo" }).present, initial);
});

test("payload chỉ có nội dung sửa; undo sau lưu gửi lại nội dung cũ", () => {
  const moved = builderReducer(createBuilderHistory(initial), { type: "move", from: 1, to: 0 }).present;
  assert.deepEqual(editedContents(moved, initial), {});
  const variant = builderReducer(createBuilderHistory(initial), { type: "variant", id: "hero", variant: "t12" }).present;
  assert.deepEqual(editedContents(variant, initial), {});
  const edited = builderReducer(createBuilderHistory(initial), { type: "content", id: "hero", data: { title: "Mới" } });
  assert.deepEqual(editedContents(edited.present, initial), { hero: { title: "Mới" } });
  assert.deepEqual(editedContents(builderReducer(edited, { type: "undo" }).present, edited.present), { hero: initial.contents.hero });
  const added = insertFromLibrary(initial, "faq", "new", 1, policy);
  assert.deepEqual(Object.keys(editedContents(added, initial)), ["new"]);
  assert.equal("data" in added.sections[1], false);
});
