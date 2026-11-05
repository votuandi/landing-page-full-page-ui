import assert from "node:assert/strict";
import test from "node:test";
import { emptyHistory, HISTORY_LIMIT, record, travel, historyShortcut, type HistoryStep } from "../lib/builderHistory.ts";

const step = (n: number): Extract<HistoryStep, { kind: "content" }> => ({ kind: "content", sectionId: "hero", before: n, after: n + 1 });
test("history no-op không ghi; bước mới xóa redo", async () => {
  assert.equal(record(emptyHistory, { ...step(0), after: 0 }), emptyHistory);
  const h = record(emptyHistory, step(0));
  const undone = await travel(h, "undo", async () => ({ ok: true }));
  assert.equal(record(undone, { ...step(0), after: 0 }), undone);
  assert.deepEqual(record(undone, step(10)), { past: [step(10)], future: [] });
});
test("120 bước giữ 100 mới nhất; undo 50 lần đúng thứ tự và redo", async () => {
  let h = emptyHistory;
  for (let n = 0; n < 120; n++) h = record(h, step(n));
  assert.equal(HISTORY_LIMIT, 100); assert.equal(h.past.length, 100);
  assert.deepEqual(h.past[0], step(20));
  for (let n = 119; n >= 70; n--) h = await travel(h, "undo", async (s, target) => {
    assert.deepEqual(s, step(n)); assert.equal(target, n); return { ok: true };
  });
  assert.equal(h.future.length, 50);
  for (let n = 70; n < 120; n++) h = await travel(h, "redo", async (s, target) => {
    assert.deepEqual(s, step(n)); assert.equal(target, n + 1); return { ok: true };
  });
  assert.equal(h.past.length, 100); assert.equal(h.future.length, 0);
});
test("apply lỗi 409/400/mạng giữ nguyên history; rỗng không gọi apply", async () => {
  const h = record(emptyHistory, step(0));
  for (const status of [409, 400, undefined]) assert.equal(await travel(h, "undo", async () => ({ ok: false, status })), h);
  assert.equal(await travel(h, "undo", async () => { throw new Error("offline"); }), h);
  assert.equal(await travel(emptyHistory, "undo", async () => { throw new Error("must not run"); }), emptyHistory);
  assert.equal(await travel(h, "redo", async () => { throw new Error("must not run"); }), h);
});
test("sections travel trả đúng snapshot; flush vừa ghi bước mới thì undo bước đó", async () => {
  const before = [{ id: "hero", type: "hero", variant: "t15", enabled: true }], after = [...before].reverse();
  const structural: HistoryStep = { kind: "sections", before, after: [...after, { ...before[0], id: "other" }] };
  let h = record(emptyHistory, structural);
  const flush = async () => { h = record(h, step(1)); return { ok: true }; };
  await flush();
  h = await travel(h, "undo", async (s, target) => { assert.equal(s.kind, "content"); assert.equal(target, 1); return { ok: true }; });
  h = await travel(h, "undo", async (_s, target) => { assert.deepEqual(target, before); return { ok: true }; });
  assert.equal(h.past.length, 0);
});
test("shortcut bỏ input/textarea/select/contenteditable; Ctrl+Y và ⌘+Shift+Z redo", () => {
  const event = { key: "z", ctrlKey: true, metaKey: false, shiftKey: false, target: null };
  assert.equal(historyShortcut(event), "undo");
  assert.equal(historyShortcut({ ...event, shiftKey: true }), "redo");
  assert.equal(historyShortcut({ ...event, key: "y" }), "redo");
  assert.equal(historyShortcut({ ...event, ctrlKey: false, metaKey: true, shiftKey: true }), "redo");
  assert.equal(historyShortcut({ ...event, ctrlKey: false }), null);
  for (const tag of ["input", "textarea", "select", "contenteditable child"]) {
    const target = { closest: (selector: string) => { assert.equal(selector, "input, textarea, select, [contenteditable]"); return { tag }; } } as unknown as EventTarget;
    assert.equal(historyShortcut({ ...event, target }), null);
  }
  assert.equal(historyShortcut({ ...event, target: { closest: () => null } as unknown as EventTarget }), "undo");
});
