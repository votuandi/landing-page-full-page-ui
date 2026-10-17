import assert from "node:assert/strict";
import { test } from "node:test";
import { sectionFormType, sectionFormTypes } from "../lib/sectionForms.ts";

const all = () => true;
const basic = (feature: string) => feature !== "calculator";

test("form section: type lạ → null; type thu phí ngoài gói → null", () => {
  assert.equal(sectionFormType("khong-co", all), null);
  assert.equal(sectionFormType("__proto__", all), null);
  assert.equal(sectionFormType("calculator", basic), null);
  assert.equal(sectionFormType("calculator", all)?.type, "calculator");
  assert.equal(sectionFormType("hero", basic)?.type, "hero");
});

test("danh sách form chỉ gồm type trong gói", () => {
  assert.equal(sectionFormTypes(all).length, 30);
  assert.equal(sectionFormTypes(basic).some((def) => def.type === "calculator"), false);
});
