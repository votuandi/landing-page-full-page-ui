import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { localized } from "@solar/sections";
import { inlineUpdate } from "../lib/builderState.ts";

const schema = z.object({ title: localized({ max: 3 }), description: localized({ multiline: true }) });
const form = { data: { title: { vi: "Cũ" }, description: { vi: "Dài" } }, readOnly: undefined };
const event = { type: "solar-preview", action: "inline", sectionId: "hero", path: ["title"], locale: "vi", text: "Mới" } as const;
test("không quyền sửa thì không nhận inline", () => {
  assert.equal(inlineUpdate(form, false, "hero", event, schema), null);
  assert.equal(inlineUpdate({ ...form, readOnly: "Chỉ đọc" }, true, "hero", event, schema), null);
  assert.equal(inlineUpdate(undefined, true, "hero", event, schema), null);
});
test("inline của section khác bị bỏ", () => {
  assert.equal(inlineUpdate(form, true, "faq", event, schema), null);
  assert.equal(inlineUpdate(form, true, null, event, schema), null);
  assert.equal(inlineUpdate(form, true, "hero", { ...event, path: ["description"] }, schema), null);
});
test("inline cập nhật form bất biến, dữ liệu lỗi để autosave chặn", () => {
  const next = inlineUpdate(form, true, "hero", event, schema)!;
  assert.deepEqual(next.data, { ...form.data, title: { vi: "Mới" } });
  assert.equal(form.data.title.vi, "Cũ"); assert.equal(next.data.description, form.data.description);
  const invalid = inlineUpdate(form, true, "hero", { ...event, text: "1234" }, schema)!;
  assert.equal(schema.safeParse(invalid.data).success, false);
});
