import assert from "node:assert/strict";
import test from "node:test";
import { builderMode, currentSection, dropPosition, dropTarget, scrollBehavior, matchInline, insertPlain } from "../../../components/preview/builderMode.ts";

test("matchInline bỏ chữ trùng", () => {
  const title = { path: ["title"], text: { vi: "Một", en: "One" } };
  const cta = { path: ["cta", "label"], text: { vi: "Nút" } };
  assert.deepEqual([...matchInline([" Một ", "Nút", "Dài"], [title, cta], "vi")], [[0, title], [1, cta]]);
  assert.equal(matchInline(["Một", "Một"], [title], "vi").size, 0);
  assert.equal(matchInline(["Một"], [title, { ...title, path: ["other"] }], "vi").size, 0);
  assert.equal(matchInline([" ", "Dài"], [{ path: ["empty"], text: { vi: "" } }], "vi").size, 0);
  assert.deepEqual([...matchInline(["One", "Nút"], [title, cta], "en")], [[0, title], [1, cta]]);
});
test("insertPlain chỉ lấy text, gộp xuống dòng", () => {
  assert.deepEqual(insertPlain("Hello world", 6, 11, "Đậm\n\tnhạt"), { value: "Hello Đậm nhạt", caret: 14 });
  assert.deepEqual(insertPlain("ab", 1, 1, " \n x"), { value: "a xb", caret: 3 });
  assert.deepEqual(insertPlain("ab", 0, 2, ""), { value: "", caret: 0 });
});

test("dropTarget", () => {
  const hero = { id: "hero", top: 0, bottom: 400, height: 400 }, faq = { id: "faq", top: 400, bottom: 800, height: 400 };
  const hidden = { id: "hidden", top: 0, bottom: 0, height: 0 };
  assert.equal(dropTarget([], 100), null);
  assert.equal(dropTarget([hidden], 100), null);
  assert.deepEqual(dropTarget([hero, hidden, faq], 420), { targetId: "faq", position: "before", top: 400 });
  assert.deepEqual(dropTarget([hero, hidden, faq], 1000), { targetId: "faq", position: "after", top: 800 });
  assert.deepEqual(dropTarget([hero, faq], 20, "hero"), { targetId: "faq", position: "before", top: 400 });
});
test("chỉ bật khi nằm trong iframe và có builder=1", () => {
  for (const [search, framed] of [["?builder=1", false], ["", true], ["?builder=0", true]] as const) assert.equal(builderMode(search, framed), null);
  assert.deepEqual(builderMode("?builder=1", true), { reorder: true });
  assert.deepEqual(builderMode("?builder=1&reorder=0", true), { reorder: false });
});
test("bỏ qua section cao 0", () => {
  const empty = { id: "empty", top: 0, bottom: 0, height: 0 };
  assert.equal(dropPosition(0, empty), null);
  assert.equal(currentSection([empty], 800), null);
  const hero = { id: "hero", top: -40, bottom: 360, height: 400 }, faq = { id: "faq", top: 360, bottom: 760, height: 400 };
  assert.equal(currentSection([empty, hero, faq], 800), "hero");
  assert.equal(currentSection([{ ...hero, top: -400, bottom: 0 }, { ...faq, top: 0, bottom: 400 }], 800), "faq");
  assert.equal(dropPosition(400, faq), "before"); assert.equal(dropPosition(700, faq), "after");
});
test("prefers-reduced-motion dùng cuộn auto", () => {
  assert.equal(scrollBehavior(true), "auto"); assert.equal(scrollBehavior(false), "smooth");
});
