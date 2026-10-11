import assert from "node:assert/strict";
import { test } from "node:test";
import { findOffTokenColors } from "./matrix-colors";

const palette = { primary: "21 128 61", glass: "rgba(255,255,255,0.7)" };
const sample = (value: string, property = "color") => ({ selector: "section > p", property, value });

test("token RGB, sai số một kênh, alpha bất kỳ và transparent hợp lệ", () => {
  assert.deepEqual(findOffTokenColors([
    sample("rgb(21, 128, 61)"), sample("rgba(22, 127, 61, 0.3)"), sample("rgb(255 255 255 / 70%)"),
    sample("transparent"), sample("rgba(255, 0, 0, 0)"),
  ], palette), []);
});

test("gradient và nhiều box-shadow kiểm mọi màu", () => {
  const good = sample("linear-gradient(rgb(21, 128, 61), rgba(255, 255, 255, 0.5))", "background-image");
  const bad = sample("rgb(21, 128, 61) 0px 2px 4px, rgb(255, 0, 0) 0px 0px 1px", "box-shadow");
  assert.deepEqual(findOffTokenColors([good, bad], palette), [bad]);
});

test("màu lạ và dạng không parse được không được whitelist", () => {
  for (const value of ["rgb(255, 0, 0)", "oklab(0.5 0.1 0.1)", "color(display-p3 1 0 0)",
    "color-mix(in srgb, rgb(21, 128, 61), white)", "red", "linear-gradient(oklch(0.5 0.2 20), rgb(21, 128, 61))"]) {
    assert.deepEqual(findOffTokenColors([sample(value)], palette), [sample(value)]);
  }
  assert.deepEqual(findOffTokenColors([sample("none", "background-image"), sample("none", "box-shadow")], palette), []);
});

test("fill url(#gradient) bỏ qua vì màu được kiểm ở stop-color; accent-color auto bị bắt", () => {
  assert.deepEqual(findOffTokenColors([sample('url("#energy-prod")', "fill")], palette), []);
  assert.deepEqual(findOffTokenColors([sample("auto", "accent-color")], palette), [sample("auto", "accent-color")]);
});
