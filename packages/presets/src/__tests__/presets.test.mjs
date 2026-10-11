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

test("Classic presets only enable Basic types and keep higher-plan variants disabled", () => {
  const { presets, BASIC_SECTION_TYPES, loadPreset } = require("../index.ts");
  const basic = ["site-header", "hero", "segments", "services", "lead-form", "projects", "process", "brands", "blog", "warranty", "cta-banner", "about-story", "site-footer"];
  assert.deepEqual([...BASIC_SECTION_TYPES].sort(), basic.sort());
  const classic = presets.filter((preset) => preset.group === "classic");
  assert.ok(classic.length >= 4);
  for (const preset of classic) {
    assert.ok(preset.sections.length > 2);
    for (const section of preset.sections.filter((entry) => entry.enabled !== false)) {
      assert.ok(BASIC_SECTION_TYPES.includes(section.type), `${preset.id}: ${section.type}`);
      assert.notEqual(section.type, "lead-form", "simple contact uses a CTA; advanced lead form stays disabled");
    }
    for (const section of loadPreset(preset.id).page.sections) {
      if (["projects", "blog", "testimonials", "shorts"].includes(section.type)) assert.ok(section.data.items.length, `${preset.id}: ${section.type} needs lab collection data`);
    }
  }
  for (const [id, type, variant] of [["t01", "products", "minwy"], ["t02", "faq", "t02"], ["t04", "packages", "t04"], ["t04", "stats", "t04"]]) {
    const section = loadPreset(id).page.sections.find((entry) => entry.type === type && entry.variant === variant);
    assert.ok(section, `${id}: ${type}/${variant}`);
    assert.equal(section.enabled, false);
  }
});

test("Classic presets preserve source homepage order, including disabled paid sections", () => {
  const { loadPreset } = require("../index.ts");
  const order = {
    t01: ["site-header", "hero", "about-story", "brands", "products", "projects", "blog", "warranty", "site-footer"],
    t02: ["site-header", "hero", "services", "products", "process", "faq", "cta-banner", "site-footer"],
    t03: ["site-header", "hero", "about-story", "services", "products", "about-story", "brands", "projects", "blog", "site-footer"],
    t04: ["site-header", "hero", "stats", "calculator", "packages", "services", "process", "projects", "testimonials", "brands", "faq", "lead-form", "cta-banner", "site-footer"],
  };
  for (const [id, types] of Object.entries(order)) {
    const { preset, page, widgets } = loadPreset(id);
    assert.deepEqual(page.sections.map((section) => section.type), types, id);
    assert.equal(preset.source.branch, id === "t01" ? "minwy" : `template-${Number(id.slice(1))}`);
    assert.deepEqual(widgets, {}, "Classic source layouts do not have floating widgets");
    assert.equal(page.sections.filter((section) => section.type === "hero").length, 1);
  }
  assert.ok(loadPreset("t03").preset.subpages.includes("gioi-thieu"));
});

test("Classic page links use existing canonical routes and project anchors resolve", () => {
  const { loadPreset } = require("../index.ts");
  const routes = ["", "ve-chung-toi", "giai-phap", "san-pham", "tin-tuc", "lien-he", "chinh-sach/bao-hanh"];
  for (const id of ["t01", "t02", "t03", "t04"]) {
    const { page } = loadPreset(id);
    function visit(value) {
      if (!value || typeof value !== "object") return;
      if (value.kind === "page") assert.ok(routes.includes(value.value), `${id}: /${value.value}`);
      if (value.kind === "anchor" && value.value === "projects") {
        assert.ok(page.sections.some((section) => section.anchor === "projects" && section.enabled !== false), id);
      }
      for (const child of Object.values(value)) visit(child);
    }
    visit(page.sections);
  }
});

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
  assert.equal(page.sections.find((section) => section.id === "featured-projects").variant, "t14");
});

test("t14 keeps HomeT14 order, dark theme, featured projects tabs and mobile bottom nav", () => {
  const { loadPreset } = require("../index.ts");
  const { preset, theme, page, widgets } = loadPreset("t14");
  assert.equal(preset.source.branch, "template-14");
  assert.equal(theme.meta.id, "t14");
  assert.deepEqual(page.sections.map((section) => section.type), [
    "site-header", "hero", "calculator", "trust", "brands", "segments", "packages", "investment-models",
    "projects", "projects", "services", "stats", "press", "tiktok", "shorts", "dealer", "branch-map", "cta-banner",
    "energy-monitoring", "process", "warranty", "testimonials", "social", "faq", "lead-form", "site-footer",
  ]);
  const featured = page.sections.find((section) => section.id === "featured-projects");
  assert.equal(featured.variant, "t14");
  for (const item of featured.data.items) for (const field of ["industry", "description", "logoText", "kwhPerYear", "savingPerYear", "co2PerYear"]) assert.ok(item[field] !== undefined, `${item.id}.${field}`);
  assert.deepEqual(page.sections.filter((section) => !section.enabled).map((section) => section.id),
    ["savings-by-segment", "investment-models", "projects-gallery", "stories", "energy-monitoring", "warranty", "testimonials"]);
  assert.equal(widgets["mobile-bottom-nav"].enabled, true);
  assert.equal(widgets["contact-dock"].data.mobileBar, false);
  assert.equal(widgets["consult-popup"].enabled, false);
});

test("t13 follows HomeT8 order with trust parts adjacent and its own certificates", () => {
  const { loadPreset } = require("../index.ts");
  const { page, widgets } = loadPreset("t13");
  assert.deepEqual(page.sections.map((section) => `${section.type}/${section.variant}`), [
    "site-header/t15", "hero/t15", "segments/t13", "shorts/t15", "packages/t15", "calculator/t15", "projects/t15",
    "products/t15", "energy-monitoring/t15", "trust/t13", "press/t15", "testimonials/t15", "brands/t15", "blog/t15",
    "faq/t15", "site-footer/t15",
  ]);
  const trust = page.sections.find((section) => section.type === "trust").data;
  assert.equal(trust.items.length, 5);
  assert.ok(trust.items.every((item) => item.logo && item.image));
  assert.equal(page.sections.find((section) => section.type === "blog").data.query.limit, 3);
  assert.equal(widgets["contact-dock"].data.mobileBar, true);
  assert.deepEqual(Object.entries(widgets).filter(([, entry]) => entry.enabled).map(([type]) => type).sort(),
    ["commitments-strip", "consult-popup", "contact-dock", "quote-cart"]);
});

test("t12 follows HomeT8 order with t12 variants and the mobile contact dock", () => {
  const { loadPreset } = require("../index.ts");
  const { page, widgets } = loadPreset("t12");
  assert.deepEqual(page.sections.map((section) => `${section.type}/${section.variant}`), [
    "site-header/t15", "hero/t12", "calculator/t12", "segments/t12", "packages/t15", "investment-models/t15",
    "projects/t12", "shorts/t15", "stats/t15", "energy-monitoring/t15", "process/t15", "warranty/t15",
    "testimonials/t15", "brands/t15", "faq/t15", "lead-form/t15", "site-footer/t15",
  ]);
  assert.deepEqual(page.sections.find((section) => section.type === "calculator").data.segments.map((s) => s.segment), ["household", "shop", "factory"]);
  assert.equal(widgets["contact-dock"].enabled && widgets["contact-dock"].variant, "t12");
  assert.equal(widgets["contact-dock"].data.mobileBar, true);
  assert.equal(widgets["mobile-bottom-nav"], undefined);
  assert.equal(loadPreset("t15").page.sections.find((section) => section.id === "projects-gallery").variant, "t12");
});
