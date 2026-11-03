import assert from "node:assert/strict";
import test from "node:test";
import { builderMode, currentSection, dropPosition, scrollBehavior } from "../../../components/preview/builderMode.ts";
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
