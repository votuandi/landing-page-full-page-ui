import assert from "node:assert/strict";
import { test } from "node:test";
import { loadSectionForm, sectionFormType, sectionFormTypes } from "../lib/sectionForms.ts";

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

test("trang form: kiểm content.edit trước khi đọc gói; type lạ/ngoài gói → null; truyền bilingual", async () => {
  const calls: string[] = [];
  const deps = (can: (feature: string) => boolean) => ({
    requirePermission: async (permission: string) => { calls.push(permission); },
    entitlements: async () => { calls.push("entitlements"); return can; },
  });
  assert.deepEqual(await loadSectionForm("khong-co", deps(all)), null);
  assert.deepEqual(calls, ["content.edit", "entitlements"]);
  assert.equal(await loadSectionForm("calculator", deps(basic)), null);
  const hero = await loadSectionForm("hero", deps(basic));
  assert.equal(hero?.def.type, "hero");
  assert.equal(hero?.bilingual, true);
  assert.equal((await loadSectionForm("hero", deps((f) => f !== "bilingual")))?.bilingual, false);
  // Không đủ quyền: gate ném (forbidden) và không đọc gói.
  calls.length = 0;
  await assert.rejects(loadSectionForm("hero", { ...deps(all), requirePermission: async () => { calls.push("denied"); throw new Error("403"); } }), /403/);
  assert.deepEqual(calls, ["denied"]);
});
