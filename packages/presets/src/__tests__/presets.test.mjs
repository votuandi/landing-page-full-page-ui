import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Same Node 20 source transpilation as @solar/themes; variants remain lazy.
for (const ext of [".ts", ".tsx"]) require.extensions[ext] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  module._compile(outputText, filename);
};

test("every preset JSON is registered and loads with real theme, variants and typed data", () => {
  const { presets, loadPreset, getPreset, presetSchema } = require("../index.ts");
  const { sectionRegistry, widgetRegistry } = require("@solar/sections");
  const root = new URL("../../", import.meta.url);
  const files = readdirSync(root).filter((file) => file.endsWith(".json") && file !== "package.json" && !file.startsWith("tsconfig"));
  assert.ok(files.length > 0);
  assert.equal(new Set(presets.map((preset) => preset.id)).size, presets.length);
  assert.deepEqual(presets.map((preset) => preset.id).sort(), files.map((file) => JSON.parse(readFileSync(new URL(file, root))).id).sort());
  for (const file of files) {
    const raw = JSON.parse(readFileSync(new URL(file, root)));
    const parsed = presetSchema.parse(raw);
    assert.deepEqual(getPreset(parsed.id), parsed);
    const { preset, theme, page, widgets } = loadPreset(parsed.id);
    assert.equal(theme.meta.id, preset.themeId);
    assert.equal(page.sections.length, preset.sections.length);
    for (const section of page.sections) {
      assert.ok(sectionRegistry.variantsOf(section.type).includes(section.variant));
      assert.deepEqual(sectionRegistry.getType(section.type).schema.parse(section.data), section.data);
      assert.equal("note" in section, false);
      if (raw.sections.find((item) => item.id === section.id).data === undefined) {
        assert.deepEqual(section.data, sectionRegistry.getType(section.type).defaults);
      }
    }
    for (const [type, entry] of Object.entries(widgets)) {
      assert.ok(widgetRegistry.variantsOf(type).includes(entry.variant));
      widgetRegistry.getType(type).schema.parse(entry.data ?? widgetRegistry.getType(type).defaults);
    }
  }
});

test("reject invalid references, duplicate ids/anchors, and invalid section/widget data", () => {
  const { presetSchema, getPreset, loadPreset } = require("../index.ts");
  const valid = getPreset("t15");
  assert.equal(getPreset("missing"), undefined);
  assert.throws(() => loadPreset("missing"), /missing/);
  for (const edit of [
    { themeId: "missing" },
    { sections: [{ id: "bad", type: "missing", variant: "t15" }] },
    { sections: [{ id: "bad", type: "hero", variant: "missing" }] },
    { sections: [{ id: "bad", type: "hero", variant: "t15", data: {} }] },
    { sections: [valid.sections[0], valid.sections[0]] },
    { sections: [{ ...valid.sections[0], id: "a", anchor: "same" }, { ...valid.sections[0], id: "b", anchor: "same" }] },
    { widgets: { "theme-switch": { enabled: false, variant: "missing" } } },
    { widgets: { "theme-switch": { enabled: true, data: {} } } },
    { widgets: { "unknown-widget": { enabled: true, variant: "t15" } } },
  ]) assert.equal(presetSchema.safeParse({ ...valid, ...edit }).success, false);
});

test("t15 keeps legacy order, two projects and disabled optional sections", () => {
  const { loadPreset } = require("../index.ts");
  const { page, widgets } = loadPreset("t15");
  assert.deepEqual(page.sections.map((section) => section.type), [
    "site-header", "hero", "segments", "shorts", "packages", "calculator", "investment-models",
    "trust", "brands", "projects", "projects", "services", "products", "stats", "press",
    "energy-monitoring", "testimonials", "tiktok", "dealer", "branch-map", "cta-banner", "process",
    "warranty", "blog", "social", "faq", "lead-form", "site-footer",
  ]);
  assert.equal(page.sections.filter((section) => section.enabled && !section.type.startsWith("site-")).length, 24);
  assert.equal(widgets["theme-switch"].enabled, true);
  assert.equal(page.sections.find((section) => section.type === "warranty").enabled, false);
});
