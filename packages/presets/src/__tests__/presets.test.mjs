import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("t07 keeps SolarHomePage order, original segments and populated projects", () => {
  const { loadPreset } = require("../index.ts");
  const { preset, page, theme } = loadPreset("t07");
  assert.equal(preset.source.branch, "template-7");
  assert.equal(theme.density.sectionY, "screen");
  assert.equal(theme.font.sans, "Inter");
  assert.deepEqual(page.sections.map((s) => `${s.type}/${s.variant}`), [
    "site-header/t15", "hero/t07", "segments/t07", "energy-monitoring/t07", "calculator/t12", "process/t07",
    "investment-models/t15", "warranty/t15", "cta-banner/t15", "testimonials/t15", "projects/t12", "brands/t15", "faq/t15", "lead-form/t15", "site-footer/t15",
  ]);
  const solutions = page.sections.find((s) => s.type === "segments");
  assert.deepEqual(solutions.data.items.map((item) => item.segment), ["factory", "shop", "household"]);
  assert.ok(page.sections.find((s) => s.type === "projects").data.items.length >= 3);
  assert.equal(page.sections.find((s) => s.type === "testimonials").data.items.length, 2);
  assert.equal(page.sections.find((s) => s.type === "lead-form").data.source, "solar-home");
  for (const type of ["site-header", "calculator", "investment-models", "projects", "brands", "faq", "lead-form", "site-footer"]) {
    assert.ok(preset.sections.find((s) => s.type === type).note, type);
  }
});
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

test("t11 follows SolarHome order with t11 variants, bill-to-calculator anchor and home-bottom lead source", () => {
  const { loadPreset } = require("../index.ts");
  const { page, widgets, theme } = loadPreset("t11");
  assert.equal(theme.meta.id, "t11");
  assert.deepEqual(page.sections.map((section) => `${section.type}/${section.variant}`), [
    "site-header/t15", "hero/t11", "process/t15", "calculator/t11", "segments/t11", "projects/t11",
    "trust/t11", "faq/t15", "lead-form/t15", "site-footer/t15",
  ]);
  assert.equal(page.sections.find((section) => section.type === "calculator").anchor, "du-toan");
  assert.equal(page.sections.find((section) => section.type === "lead-form").data.source, "home-bottom");
  assert.equal(widgets["contact-dock"].variant, "t11");
  assert.equal(widgets["mobile-bottom-nav"].enabled, false);
});

test("t08 preserves HomeT8 order, shared arch, detailed segments and populated collections", () => {
  const { loadPreset, getPreset } = require("../index.ts");
  const { preset, theme, page, widgets } = loadPreset("t08");
  assert.equal(preset.source.branch, "template-8");
  assert.equal(theme.meta.group, "pro");
  assert.deepEqual(page.sections.map((section) => `${section.type}/${section.variant}`), [
    "site-header/t15", "hero/t12", "segments/t08", "calculator/t12", "energy-monitoring/t08",
    "projects/t12", "process/t15", "investment-models/t15", "warranty/t15", "faq/t15",
    "testimonials/t15", "brands/t15", "faq/t15", "lead-form/t15", "site-footer/t15",
  ]);
  for (const type of ["hero", "warranty", "lead-form", "calculator"]) {
    assert.ok(getPreset("t08").sections.find((section) => section.type === type).note);
  }
  for (const type of ["projects", "testimonials"]) {
    const data = page.sections.find((section) => section.type === type).data;
    assert.ok(data.items.length > 0);
    assert.ok(data.items.every((item) => /\[DỮ LIỆU MẪU\]/.test(item.title ?? item.name)));
  }
  assert.deepEqual(page.sections.find((section) => section.type === "segments").data.items.map((item) => item.segment), ["factory", "shop", "household"]);
  assert.equal(widgets["contact-dock"].data.mobileBar, true);
});

test("t10 keeps template-10 home order with t10 variants and notes on replacements", () => {
  const { loadPreset, getPreset } = require("../index.ts");
  const { page, widgets, theme } = loadPreset("t10");
  assert.equal(theme.meta.id, "t10");
  assert.deepEqual(page.sections.map((section) => `${section.type}/${section.variant}`), [
    "site-header/t15", "hero/t10", "services/t10", "segments/t10", "brands/t10", "stats/t10", "projects/t10", "brands/t15",
    "calculator/t15", "investment-models/t10", "energy-monitoring/t10", "process/t10", "testimonials/t10", "trust/t10",
    "faq/t10", "lead-form/t10", "site-footer/t15",
  ]);
  for (const section of getPreset("t10").sections) if (section.variant !== "t10") assert.ok(section.note, section.id);
  assert.equal(widgets["contact-dock"].variant, "t10");
  assert.equal(widgets["consult-popup"].data.autoOpen, false);
});

test("C&I presets share at least 80% of their configured type/variant set", () => {
  const { loadPreset } = require("../index.ts");
  const sets = ["t05", "t06", "t09"].map((id) => {
    const { preset, page } = loadPreset(id);
    assert.equal(preset.source.branch, `template-${Number(id.slice(1))}`);
    assert.equal(preset.group, "pro");
    for (const section of page.sections) {
      if (!section.enabled) assert.ok(preset.sections.find((item) => item.id === section.id).note);
      if (["projects", "testimonials", "shorts", "blog"].includes(section.type) && section.enabled) {
        assert.ok(section.data.items.length > 0, `${id}/${section.id} needs lab collection data`);
      }
    }
    return new Set(page.sections.map((section) => `${section.type}/${section.variant}`));
  });
  // Jaccard over the complete configured library (including explicitly optional, disabled blocks).
  const union = new Set(sets.flatMap((set) => [...set]));
  const intersection = [...union].filter((key) => sets.every((set) => set.has(key)));
  assert.ok(intersection.length / union.size >= 0.8, `${intersection.length}/${union.size}`);
});

test("C&I presets preserve source homepage order and resolve every in-page CTA", () => {
  const { loadPreset } = require("../index.ts");
  for (const id of ["t05", "t06", "t09"]) {
    const { page } = loadPreset(id);
    const sections = page.sections.filter((section) => section.enabled);
    assert.deepEqual(sections.map((section) => section.type), id === "t05" ? [
      "site-header", "hero", "services", "calculator", "projects", "process", "investment-models", "warranty", "trust", "testimonials", "brands", "faq", "lead-form", "site-footer",
    ] : [
      "site-header", "hero", "load-profile", "services", "energy-monitoring", "energy-monitoring", "process", "calculator", "investment-models", "projects", "lead-form", "site-footer",
    ]);
    const anchors = new Set(sections.flatMap((section) => section.anchor ? [section.anchor] : []));
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      if (value.kind === "anchor") assert.ok(anchors.has(value.value), `${id}: missing #${value.value}`);
      Object.values(value).forEach(visit);
    };
    sections.forEach((section) => visit(section.data));
  }
});

test("site structure policy follows D21: plan filters every page, fixed parts stay fixed, landing pages follow the plan", () => {
  const { loadPreset, presetStructure, validateSiteStructure, presetPageTypes, pageTypeOfRoute, PAGE_TYPE_IDS } = require("../index.ts");
  const { plans } = require("../../../plans/plans.ts");
  const { sectionRegistry } = require("@solar/sections");
  const canOf = (planId, addons = []) => (feature) => plans[planId].features.has(feature) || addons.includes(feature);
  const basic = canOf("basic"), pro = canOf("pro"), premium = canOf("premium");
  const structureOf = (id, can) => {
    const { preset, page } = loadPreset(id);
    return presetStructure({ id: preset.id, pages: preset.pages, sections: page.sections }, can);
  };

  // Every page of the generated structure is inside the plan, including system-page defaults (branch-map is premium).
  for (const [id, can, planId] of [["t01", basic, "basic"], ["t12", pro, "pro"], ["t15", premium, "premium"], ["t15", basic, "basic"]]) {
    const structure = structureOf(id, can);
    assert.deepEqual(validateSiteStructure(structure, { can, pagesLimit: plans[planId].limits.pages, baseline: structure }), [], `${id}/${planId}`);
    for (const page of structure.pages) for (const section of page.sections) {
      const entitlement = sectionRegistry.getType(section.type).meta.entitlement;
      assert.ok(!entitlement || can(entitlement), `${id}/${planId} ${page.slug}: ${section.type}`);
    }
  }
  const proT15 = structureOf("t15", pro);
  assert.ok(!proT15.pageTypes.includes("products"), "catalog is premium");
  assert.deepEqual(proT15.pages.find((page) => page.slug === "lien-he").sections.map((section) => section.type), ["lead-form"]);

  // Basic: structure, order, on/off and variants are fixed to the preset.
  const fixed = structureOf("t01", basic);
  const home = fixed.pages.find((page) => page.slug === "");
  const withHome = (sections) => ({ ...fixed, pages: fixed.pages.map((page) => page.slug === "" ? { ...page, sections } : page) });
  const changes = {
    "Gói không cho đổi cấu trúc trang": { ...fixed, pageTypes: fixed.pageTypes.filter((type) => type !== "about"), pages: fixed.pages.filter((page) => page.slug !== "ve-chung-toi") },
    "Gói không cho thêm, bớt, bật/tắt hoặc sắp xếp section: /": withHome([...home.sections].reverse()),
    "Gói không cho đổi kiểu hiển thị section: /": withHome(home.sections.map((section, index) => index === 1 ? { ...section, variant: "t15" } : section)),
  };
  const toggled = withHome(home.sections.map((section, index) => index === 1 ? { ...section, enabled: !section.enabled } : section));
  assert.ok(validateSiteStructure(toggled, { can: basic, pagesLimit: 1, baseline: fixed }).includes("Gói không cho thêm, bớt, bật/tắt hoặc sắp xếp section: /"));
  for (const [message, changed] of Object.entries(changes)) {
    assert.ok(home.sections[1].variant !== "t15" || !message.includes("kiểu"), "fixture must change a variant");
    assert.ok(validateSiteStructure(changed, { can: basic, pagesLimit: 1, baseline: fixed }).includes(message), message);
    assert.deepEqual(validateSiteStructure(changed, { can: pro, pagesLimit: 3, baseline: fixed }), [], `pro may: ${message}`);
  }

  // Landing pages need landingPages and count with home against the plan's page limit (home + 2 / home + 19).
  const landings = (structure, count) => ({ ...structure, pages: [...structure.pages, ...Array.from({ length: count }, (_, index) => ({ slug: `uu-dai/${index}`, sections: [] }))] });
  assert.ok(validateSiteStructure(landings(fixed, 1), { can: basic, pagesLimit: 1, baseline: fixed }).includes("Trang landing ngoài gói: /uu-dai/0"));
  assert.deepEqual(validateSiteStructure(landings(proT15, 2), { can: pro, pagesLimit: plans.pro.limits.pages, baseline: proT15 }), []);
  assert.ok(validateSiteStructure(landings(proT15, 3), { can: pro, pagesLimit: plans.pro.limits.pages, baseline: proT15 }).includes("Vượt số trang của gói: 4/3"));
  const full = structureOf("t15", premium);
  assert.deepEqual(validateSiteStructure(landings(full, 19), { can: premium, pagesLimit: plans.premium.limits.pages, baseline: full }), []);
  assert.ok(validateSiteStructure(landings(full, 20), { can: premium, pagesLimit: plans.premium.limits.pages, baseline: full }).includes("Vượt số trang của gói: 21/20"));

  // Dropping a Page record while keeping pageTypes is caught for every plan; a page outside pageTypes too.
  for (const [slug, message] of [["", "Thiếu trang: /"], ["lien-he", "Thiếu trang: /lien-he"], ["ve-chung-toi", "Thiếu trang: /ve-chung-toi"]]) {
    const dropped = { ...fixed, pages: fixed.pages.filter((page) => page.slug !== slug) };
    for (const can of [basic, premium]) assert.ok(validateSiteStructure(dropped, { can, pagesLimit: 20, baseline: fixed }).includes(message), `${message} (${can === basic ? "basic" : "premium"})`);
  }
  assert.ok(validateSiteStructure(fixed, { can: basic, baseline: fixed }).some((issue) => issue.startsWith("Vượt số trang của gói")), "a missing limit is not unlimited");
  assert.deepEqual(validateSiteStructure(landings(full, 30), { can: premium, pagesLimit: Infinity, baseline: full }), []);
  const orphan = { ...fixed, pageTypes: fixed.pageTypes.filter((type) => type !== "about") };
  assert.ok(validateSiteStructure(orphan, { can: premium, pagesLimit: 20, baseline: fixed }).includes("Trang không có trong cấu trúc: /ve-chung-toi"));

  const issues = validateSiteStructure({ pageTypes: ["home", "products", "nope"], pages: [{ slug: "", sections: [{ id: "c", type: "calculator", variant: "t12", enabled: true }, { id: "g", type: "ghost", variant: "x", enabled: true }] }] }, { can: basic, pagesLimit: 1, baseline: fixed });
  for (const message of ["Thiếu trang bắt buộc: contact", "Thiếu trang bắt buộc: policy", "Trang ngoài gói: products", "Loại trang không tồn tại: nope", "Section ngoài gói: calculator (trang /)", "Section không tồn tại: ghost (trang /)"]) {
    assert.ok(issues.includes(message), message);
  }
  assert.deepEqual(presetPageTypes({ pages: ["about"] }), ["home", "about", "contact", "policy"]);
  assert.deepEqual(presetPageTypes({}), PAGE_TYPE_IDS);
  assert.equal(pageTypeOfRoute({ kind: "detail", collection: "product", slug: "x" }), "products");
  assert.equal(pageTypeOfRoute({ kind: "page", slug: "ve-chung-toi" }), "about");
  assert.equal(pageTypeOfRoute({ kind: "page", slug: "uu-dai/nang-luong" }), null);
  assert.equal(pageTypeOfRoute({ kind: "policy", slug: "bao-hanh" }), "policy");
});
