import assert from "node:assert/strict";
import test from "node:test";
import { anchorError, layoutOptions } from "../lib/layoutOptions.ts";

test("tùy chọn không hỗ trợ không hiện; deep/invert cần theme dark", () => {
  const hero = layoutOptions("hero", "t15", true);
  assert.deepEqual(hero, {});
  const faq = layoutOptions("faq", "t15", true);
  assert.deepEqual(faq.background, ["default", "tint", "sky", "sun", "deep", "invert"]);
  assert.deepEqual(faq.spacing, ["compact", "normal", "loose"]);
  assert.equal(faq.align, undefined);
  assert.deepEqual(layoutOptions("faq", "t02", false).align, ["start", "center"]);
  assert.deepEqual(layoutOptions("faq", "t15", false).background, ["default", "tint", "sky", "sun"]);
  assert.deepEqual(layoutOptions("missing", "missing", false), {});
});
test("mã neo trùng / sai regex; rỗng xóa neo, neo của chính mình hợp lệ", () => {
  const sections = [{ id: "a", anchor: "bang-gia" }, { id: "b", anchor: "lien-he" }];
  assert.equal(anchorError("bang-gia", sections, "a"), undefined);
  assert.equal(anchorError("", sections, "a"), undefined);
  assert.equal(anchorError("lien-he", sections, "a"), "Mã neo đã dùng");
  for (const value of ["Bang-gia", "#bang-gia", "a b", "điện", "a_b"]) {
    assert.equal(anchorError(value, sections, "a"), "Chỉ dùng chữ thường, số và dấu gạch nối");
  }
});
