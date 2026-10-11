import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Loadable from "next/dist/shared/lib/loadable.shared-runtime";
import { sectionRegistry } from "../registry";
import { widgetRegistry } from "../widgets/registry";
import type { SectionTypeDef } from "../define";

// AC chung E4: mọi variant port từ template render với fixture chung của type ở theme gốc và ở t15.
const themeOf = (variant: string) => (variant === "minwy" ? "t01" : variant);

for (const [label, registry] of [["section", sectionRegistry], ["widget", widgetRegistry]] as const) {
  test(`mọi ${label} variant ngoài t15 render defaults ở theme gốc và t15`, async () => {
    let count = 0;
    for (const [type, def] of Object.entries(registry.types) as [string, SectionTypeDef][]) {
      for (const variant of registry.variantsOf(type) ?? []) {
        if (variant === "t15") continue;
        const entry = registry.getVariant(type, variant)!;
        assert.equal(entry.fallback, false, `${type}/${variant}`);
        const { default: Component } = await entry.load();
        await Loadable.preloadAll();
        for (const themeId of [themeOf(variant), "t15"]) {
          const data = def.schema.parse(def.defaults);
          const site = { tenantId: "variants-test", locale: "vi" as const, themeId };
          assert.doesNotThrow(() => renderToStaticMarkup(createElement(Component, { data, site, sectionId: `${type}-${variant}` })), `${type}/${variant}@${themeId}`);
          assert.deepEqual(data, def.defaults, `${type}/${variant} không được sửa dữ liệu`);
        }
        count++;
      }
    }
    assert.ok(count > 0);
  });
}

test("type có schemaVersion > 1 có migration giữ nguyên dữ liệu mặc định", async () => {
  for (const [type, def] of Object.entries(sectionRegistry.types) as [string, SectionTypeDef][]) {
    if (def.schemaVersion <= 1) continue;
    const file = resolve(__dirname, "../../../../src", type, "migrations.ts");
    assert.ok(existsSync(file), `${type} thiếu migrations.ts`);
    const migrations = Object.values(await import(`../${type}/migrations`)).filter((fn) => typeof fn === "function") as ((d: unknown) => unknown)[];
    assert.ok(migrations.length > 0, type);
    for (const migrate of migrations) assert.deepEqual(def.schema.parse(migrate(structuredClone(def.defaults))), def.defaults, type);
  }
});
