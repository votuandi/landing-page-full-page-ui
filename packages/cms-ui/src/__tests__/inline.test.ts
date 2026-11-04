import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { localized, link, mediaRef, richText, sectionRegistry } from "@solar/sections";
import { inlineFields, applyInlineEdit } from "../sections/inline.ts";
import { getAt } from "../schema/path.ts";

const schema = z.object({ title: localized({ max: 3 }), description: localized({ multiline: true }),
  cta: link(), image: mediaRef(), body: richText(), optional: localized().optional(),
  items: z.array(z.object({ name: localized() })), record: z.record(z.enum(["first"]), localized()),
  choice: z.discriminatedUnion("kind", [z.object({ kind: z.literal("a"), short: localized() }), z.object({ kind: z.literal("b"), long: localized({ multiline: true }) })]) });
const data = { title: { vi: "Mặt" }, description: { vi: "Dài" }, cta: { kind: "page", value: "", label: { vi: "Nút" } },
  image: { id: "image", alt: { vi: "Ảnh" } }, body: { vi: [] }, items: [{ name: { vi: "Tên" } }], record: { first: { vi: "Một" } }, choice: { kind: "a", short: { vi: "Nhánh" } } };

test("inlineFields gồm nhãn link, bỏ multiline/richText/media", () => {
  assert.deepEqual(inlineFields(schema, data).map(field => field.path), [["title"], ["cta", "label"], ["items", 0, "name"], ["record", "first"], ["choice", "short"]]);
  assert.deepEqual(inlineFields(schema, { ...data, choice: { kind: "b", long: { vi: "Dài" } } }).map(field => field.path), [["title"], ["cta", "label"], ["items", 0, "name"], ["record", "first"]]);
});
test("inlineFields chạy trên defaults mọi type", () => {
  for (const def of Object.values(sectionRegistry.types)) for (const field of inlineFields(def.schema, def.defaults)) {
    assert.equal(typeof field.text.vi, "string", def.type);
    assert.deepEqual(getAt(def.defaults, field.path), field.text);
  }
});
test("applyInlineEdit từ chối path ngoài danh sách", () => {
  for (const path of [["description"], ["image", "alt"], ["title", "vi"], ["__proto__"], ["optional"], ["items", "0", "name"]]) {
    assert.equal(applyInlineEdit(schema, data, { path, locale: "vi", text: "X" }), null);
  }
  assert.deepEqual(data.title, { vi: "Mặt" });
});
test("applyInlineEdit ghi đúng locale", () => {
  const english = applyInlineEdit(schema, data, { path: ["title"], locale: "en", text: "  Hi\n!  " })!;
  assert.deepEqual(getAt(english.data, ["title"]), { vi: "Mặt", en: "Hi !" });
  const cleared = applyInlineEdit(schema, english.data, { path: ["title"], locale: "en", text: " \n " })!;
  assert.deepEqual(getAt(cleared.data, ["title"]), { vi: "Mặt" });
  assert.equal(getAt(english.data, ["description"]), data.description);
});
test("applyInlineEdit trả valid=false khi vượt max", () => {
  const result = applyInlineEdit(schema, data, { path: ["title"], locale: "vi", text: "1234" })!;
  assert.equal(result.valid, false); assert.ok(result.error);
  assert.deepEqual(getAt(result.data, ["title"]), { vi: "1234" });
  assert.equal(applyInlineEdit(schema, data, { path: ["title"], locale: "vi", text: "OK" })!.valid, true);
});
