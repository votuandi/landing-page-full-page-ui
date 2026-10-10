import assert from "node:assert/strict";
import { test } from "node:test";
import { createRegistry, sectionRegistry } from "../registry";
import type { SectionTypeDef } from "../define";
import { demo, variants, v1, v2 } from "./fixtures";

test("registry giữ definition và nạp đúng variant mà không cảnh báo", async (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const registry = createRegistry({ demo: variants });
  assert.equal(registry.types.demo, demo);
  assert.equal(registry.getType("demo"), demo);
  assert.equal(registry.getType("khong-co"), undefined);
  const result = registry.getVariant("demo", "v2");
  assert.deepEqual(result, { type: "demo", variant: "v2", fallback: false, load: v2 });
  assert.equal(warn.mock.callCount(), 0);
  assert.equal(await (await result!.load()).default({
    data: demo.schema.parse({ title: "Mẫu" }),
    site: { tenantId: "demo", locale: "vi", themeId: "t15" },
    sectionId: "section-1",
  }), "Mẫu: 0");
});

test("variant không tồn tại trả loader mặc định và cảnh báo đúng một lần", (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const registry = createRegistry({ demo: variants });
  assert.deepEqual(registry.getVariant("demo", "khong-co"), {
    type: "demo", variant: "v1", fallback: true, load: v1,
  });
  assert.equal(warn.mock.callCount(), 1);
  assert.deepEqual(warn.mock.calls[0].arguments, [
    "[sections] variant không tồn tại", { type: "demo", variant: "khong-co", fallback: "v1" },
  ]);
});

test("type không tồn tại trả null và cảnh báo", (t) => {
  const warn = t.mock.method(console, "warn", () => {});
  const registry = createRegistry({ demo: variants });
  assert.equal(registry.getVariant("khong-co", "v1"), null);
  assert.equal(warn.mock.callCount(), 1);
  assert.deepEqual(warn.mock.calls[0].arguments, [
    "[sections] type không tồn tại", { type: "khong-co", variant: "v1" },
  ]);
});

test("key đăng ký phải trùng def.type", () => {
  assert.throws(() => createRegistry({ wrong: variants }), /wrong.*demo/);
});

test("tên thuộc prototype không được coi là type hoặc variant đã đăng ký", (t) => {
  t.mock.method(console, "warn", () => {});
  const registry = createRegistry({ demo: variants });
  for (const key of ["toString", "constructor", "__proto__"]) {
    assert.equal(registry.getType(key), undefined);
    assert.equal(registry.getVariant(key, "v1"), null);
    assert.equal(registry.getVariant("demo", key)?.load, v1);
    assert.equal(registry.getVariant("demo", key)?.fallback, true);
  }
});

test("defaults của mọi type thật parse được bằng schema chung", () => {
  for (const def of Object.values(sectionRegistry.types) as SectionTypeDef[]) {
    assert.deepEqual(def.schema.parse(def.defaults), def.defaults);
  }
  assert.deepEqual(demo.schema.parse(demo.defaults), demo.defaults);
});
