import assert from "node:assert/strict";
import { test } from "node:test";
import { findHardcoded } from "./matchers.mjs";

test("recognizes colors, arbitrary styles and palettes without duplicate colors", () => {
  for (const text of ["#fff", "#abcd", "#ABCDEF", "#12345678", "rgba(1,2,3,.4)", "hsl(0 0% 0%)", "hsla(0,0%,0%,.4)", "md:hover:!bg-[#0E7C3A]", "text-[11px]", "border-[6px]", "fill-[#fff]", "stroke-[red]", "bg-white", "text-slate-500", "hover:ring-blue-200/20"]) {
    assert.equal(findHardcoded(text).length, 1, text);
  }
});

test("accepts token functions, anchors and unrelated arbitrary utilities", () => {
  for (const text of ["rgb(var(--c-x) / .2)", "rgb( var(--c-x))", "RGBA( var(--c-x) / .2)", "#CarouselNav", "#lien-he", "word#fff", "&#123;", "/#fff", "#ffffff-more", "bg-primary/[.08] z-[90] aspect-[9/16] tracking-[.2em] leading-[1.2] max-w-[10px] [mask-image:linear-gradient(black,transparent)]"]) {
    assert.deepEqual(findHardcoded(text), [], text);
  }
});

test("reports each separate occurrence with its position", () => {
  assert.deepEqual(findHardcoded("#fff bg-white"), [
    { index: 0, found: "#fff", kind: "hex" },
    { index: 5, found: "bg-white", kind: "palette" },
  ]);
});

test("directional radii and interpolated arbitrary values cannot bypass the gate", () => {
  assert.equal(findHardcoded("rounded-b-[40px]").length, 1);
  assert.equal(findHardcoded("bg-[").length, 1);
});
