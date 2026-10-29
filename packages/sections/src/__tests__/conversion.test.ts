import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { calculateSolar } from "@solar/core";
import { LeadConsent } from "../shared/LeadConsent";

test("lead consent: SSR renders a required unchecked checkbox and visible error", () => {
  const html = renderToStaticMarkup(createElement(LeadConsent, { text: "Tôi đồng ý", error: "Vui lòng đồng ý" }));
  assert.match(html, /type="checkbox"/); assert.match(html, /name="consent"/); assert.match(html, /required=""/);
  assert.ok(!html.includes("checked=")); assert.match(html, /Tôi đồng ý/); assert.match(html, /role="alert"/);
});

test("t07 variants render shared defaults in VI/EN under t07 and t15", async () => {
  for (const type of ["hero", "segments", "energy-monitoring", "process"]) {
    const def = sectionRegistry.getType(type)!;
    const resolved = sectionRegistry.getVariant(type, "t07")!;
    assert.equal(resolved.fallback, false, type);
    const { default: Component } = await resolved.load();
    await Loadable.preloadAll();
    for (const themeId of ["t07", "t15"]) for (const locale of ["vi", "en"] as const) {
      const html = renderToStaticMarkup(createElement(Component, { data: def.defaults, sectionId: `${type}-test`, site: { tenantId: "test", locale, themeId } }));
      assert.ok(html.length > 100, `${type}/${themeId}/${locale}`);
      assert.match(html, /min-h-section/);
    }
  }
});

test("segments/t07 displays core estimates with declared sample assumptions and unique local anchors", async () => {
  const { default: Component } = await sectionRegistry.getVariant("segments", "t07")!.load();
  const props = { data: segments.defaults, sectionId: "solutions", site: { tenantId: "test", locale: "vi", themeId: "t07" } as const };
  const html = renderToStaticMarkup(createElement(Component, props));
  const params = toCalculatorParams(calculator.defaults);
  const inputs = [
    { segment: "factory", monthlyBill: 120_000_000, daytimeRatio: 45 },
    { segment: "shop", monthlyBill: 12_000_000, daytimeRatio: 40 },
    { segment: "household", monthlyBill: 3_000_000, daytimeRatio: 35 },
  ] as const;
  for (const input of inputs) {
    const result = calculateSolar({ ...input, roofArea: 50_000, province: "TP Hồ Chí Minh" }, params);
    const value = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(result.monthlySavings / 1_000_000);
    assert.ok(html.includes(value), `core saving: ${input.segment}`);
    assert.ok(html.includes(`href="#solutions-${input.segment}"`));
    assert.ok(html.includes(`id="solutions-${input.segment}"`));
  }
  assert.ok(html.includes("[DỮ LIỆU MẪU]"));
  assert.ok(html.includes("50.000"));
  const edited = segments.schema.parse({ ...segments.defaults, items: [{ ...segments.defaults.items[0], pitch: { vi: "Nội dung của khách" }, saving: "17%" }] });
  const custom = renderToStaticMarkup(createElement(Component, { ...props, data: edited }));
  assert.ok(custom.includes("Nội dung của khách"));
  assert.ok(custom.includes("17%"));
  assert.ok(!custom.includes('id="solutions-factory"'));
});
import { sectionRegistry } from "../registry";
import { calculator } from "../calculator/schema";
import { calculatorFixture } from "../calculator/fixtures";
import { toCalculatorParams } from "../calculator/params";
import { hero } from "../hero/schema";
import { heroFixture } from "../hero/fixtures";
import { leadForm } from "../lead-form/schema";
import { leadFormFixture } from "../lead-form/fixtures";
import { packages } from "../packages/schema";
import { packagesFixture } from "../packages/fixtures";
import { segments } from "../segments/schema";
import { segmentsFixture } from "../segments/fixtures";
import { siteFooter } from "../site-footer/schema";
import { siteFooterFixture } from "../site-footer/fixtures";
import { siteHeader } from "../site-header/schema";
import { siteHeaderFixture } from "../site-header/fixtures";
import { mediaSrc } from "../shared/media";
import { packageSimulationFixture } from "../shared/packageSimulationFixture";
import { migrateHeroV1 } from "../hero/migrations";
import { migrateCalculatorV1 } from "../calculator/migrations";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Loadable from "next/dist/shared/lib/loadable.shared-runtime";
import { widgetRegistry } from "../widgets/registry";
import { migrateSegmentsV1 } from "../segments/migrations";
import { migrateProjectsV1 } from "../projects/migrations";
import { migrateTrustV1 } from "../trust/migrations";

test("source t11 fixtures and optional-field migrations retain all data", async () => {
  for (const type of ["hero", "calculator", "segments", "projects", "trust"]) {
    const def = sectionRegistry.getType(type)!;
    const { t11Fixture } = await import(`../${type}/t11-fixtures`);
    const parsed = def.schema.safeParse(t11Fixture);
    assert.ok(parsed.success, `${type}: ${parsed.error?.message}`);
    const { default: Component } = await sectionRegistry.getVariant(type, "t11")!.load();
    await Loadable.preloadAll();
    const html = renderToStaticMarkup(createElement(Component, { data: parsed.data, sectionId: type, site: { tenantId: "test", locale: "vi", themeId: "t11" } }));
    assert.ok(html.length > 100, type);
    if (type === "segments") { assert.match(html, /stroke-chart-a/); assert.match(html, /stroke-chart-b/); assert.doesNotMatch(html, / hidden=""/); }
    if (type === "trust") assert.match(html, /Dữ liệu pháp lý chưa xác minh/);
    const invalid = clone(t11Fixture);
    if (type === "segments") invalid.items[0].comparison.consumption[0] = 101;
    else if (type === "projects") invalid.evidence.cases[0].packageId = "missing-package";
    else if (type === "trust") invalid.items[0].lookupUrl = "javascript:alert(1)";
    else invalid.packageSimulation.provinces.push(invalid.packageSimulation.provinces[0]);
    assert.equal(def.schema.safeParse(invalid).success, false, `${type}: invalid simulation/content boundary`);
  }
  for (const [type, migrate] of [["segments", migrateSegmentsV1], ["projects", migrateProjectsV1], ["trust", migrateTrustV1]] as const) {
    const def = sectionRegistry.getType(type)!;
    assert.equal(def.schemaVersion, 2);
    const previous = def.defaults as Record<string, unknown>;
    assert.deepEqual(migrate(previous), previous);
    assert.ok(def.schema.safeParse(migrate(previous)).success);
  }
});

test("all t11 variants render shared defaults in t11/t15, including bill form GET fallback", async () => {
  const entries = ["hero", "calculator", "segments", "projects", "trust"];
  for (const type of entries) {
    const def = sectionRegistry.getType(type)!;
    const resolved = sectionRegistry.getVariant(type, "t11")!;
    assert.equal(resolved.fallback, false, type);
    const { default: Component } = await resolved.load();
    await Loadable.preloadAll();
    for (const themeId of ["t11", "t15"]) {
      const html = renderToStaticMarkup(createElement(Component, { data: def.defaults, sectionId: type, site: { tenantId: "test", locale: "vi", themeId } }));
      assert.ok(html.length > 100, `${type}/${themeId}`);
      if (type === "hero") {
        assert.match(html, /action="#du-toan" method="get"/);
        assert.match(html, /name="hoa-don"/);
      }
      if (type === "calculator") { assert.match(html, /Sao chép thông tin gói/); assert.match(html, /fill-chart-a/); assert.match(html, /stroke-chart-b/); }
    }
  }
  const dock = widgetRegistry.getVariant("contact-dock", "t11")!;
  assert.equal(dock.fallback, false);
  const { default: Dock } = await dock.load();
  const { t11Fixture } = await import("../widgets/contact-dock/t11-fixtures");
  assert.ok(widgetRegistry.types["contact-dock"].schema.safeParse(t11Fixture).success);
  assert.match(renderToStaticMarkup(createElement(Dock, { data: widgetRegistry.types["contact-dock"].defaults, sectionId: "dock", site: { tenantId: "test", locale: "vi", themeId: "t11" } })), /tel:0901234567/);
});

test("package simulation is optional shared data; migrations preserve existing tenant content", () => {
  for (const [def, migrate] of [[hero, migrateHeroV1], [calculator, migrateCalculatorV1]] as const) {
    assert.equal(def.schemaVersion, 2);
    const original = { ...def.defaults, packageSimulation: packageSimulationFixture };
    assert.deepEqual(migrate(original), original);
    assert.deepEqual((def.schema.parse(original) as typeof original).packageSimulation, packageSimulationFixture);
    const invalid = clone(original);
    invalid.packageSimulation.defaultProvince = "missing";
    assert.equal(def.schema.safeParse(invalid).success, false);
  }
});

const SRC = resolve(__dirname, "../../../../src");
const TYPES = [
  [hero, heroFixture], [calculator, calculatorFixture], [leadForm, leadFormFixture], [packages, packagesFixture],
  [segments, segmentsFixture], [siteHeader, siteHeaderFixture], [siteFooter, siteFooterFixture],
] as const;
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

test("7 type đợt 1 có schema.ts, fixtures.ts, t15.tsx và nằm trong registry với variant t15", () => {
  for (const [def] of TYPES) {
    for (const file of ["schema.ts", "fixtures.ts", "t15.tsx", "index.ts"]) {
      assert.ok(existsSync(join(SRC, def.type, file)), `${def.type}/${file}`);
    }
    assert.equal(sectionRegistry.getType(def.type), def);
    assert.equal(sectionRegistry.getVariant(def.type, "t15")?.fallback, false);
  }
});

test("fixture mọi type parse được và defaults = fixture đã parse", () => {
  for (const [def, fixture] of TYPES) {
    const parsed = def.schema.safeParse(fixture);
    assert.ok(parsed.success, `${def.type}: ${parsed.error?.message}`);
    assert.deepEqual(parsed.data, def.defaults);
  }
});

test("schema chặn dữ liệu sai", () => {
  const bad = (def: (typeof TYPES)[number][0], mutate: (data: any) => void) => {
    const data = clone(def.defaults);
    mutate(data);
    assert.equal(def.schema.safeParse(data).success, false, def.type);
  };
  bad(calculator, (d) => { d.steps = ["bill", "bill"]; });
  bad(calculator, (d) => { d.defaultProvince = "Atlantis"; });
  bad(calculator, (d) => { d.vatRate = 2; });
  bad(calculator, (d) => { delete d.tariffs.farm; });
  bad(calculator, (d) => { d.tariffs.household.tiers[0].upTo = null; });
  bad(calculator, (d) => { d.inputs.shop.bill.default = 1; });
  bad(leadForm, (d) => { d.source = "a b<script>"; });
  bad(packages, (d) => { d.defaultSegment = "farm"; d.segments = d.segments.slice(0, 1); });
  bad(packages, (d) => { d.items.push(d.items[0]); });
  bad(segments, (d) => { d.items.push(d.items[0]); });
  bad(hero, (d) => { d.rating.url = "javascript:alert(1)"; });
  bad(siteHeader, (d) => { d.hotlines[0].main = "abc"; });
  bad(siteFooter, (d) => { d.socials[0].url = "javascript:alert(1)"; });
});

test("đổi giá điện trong dữ liệu section → dự toán đổi theo", () => {
  const input = { segment: "shop", monthlyBill: 8_000_000, roofArea: 1_000, province: "Hà Nội", daytimeRatio: 70 } as const;
  const base = calculateSolar(input, toCalculatorParams(calculator.defaults));
  const data = clone(calculator.defaults);
  data.tariffs.shop = { kind: "flat", averageRate: 6600, solarOffsetRate: 6300 };
  const doubled = calculateSolar(input, toCalculatorParams(calculator.schema.parse(data)));
  assert.ok(Math.abs(doubled.monthlyKwh - base.monthlyKwh / 2) < 1e-6);
  assert.ok(doubled.kwp < base.kwp);
  assert.notEqual(doubled.monthlySavings, base.monthlySavings);

  data.vatRate = 0.1;
  data.pricePerKwp.shop = 22_000_000;
  const next = calculateSolar(input, toCalculatorParams(calculator.schema.parse(data)));
  assert.equal(next.cost, next.kwp * 22_000_000);
});

test("mediaSrc accepts static/HTTPS images and leaves UUIDs or unsafe paths unresolved", () => {
  assert.equal(mediaSrc({ id: "/images/a.webp", alt: { vi: "" } }), "/images/a.webp");
  assert.equal(mediaSrc({ id: "https://x.com/a.png", alt: { vi: "" } }), "https://x.com/a.png");
  for (const id of ["//evil.com/a.png", "media_123", "http://x.com/a.png", "/../private.png", "https://user:password@x.com/a.png"]) {
    assert.equal(mediaSrc({ id, alt: { vi: "" } }), undefined);
  }
});

test("section không import cấu hình cứng của app (config/solar, @/)", () => {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) { if (name !== "__tests__") walk(path); } else if (/\.tsx?$/.test(name)) files.push(path);
    }
  };
  walk(SRC);
  assert.ok(files.length > 20);
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /(?:from|import\()\s*["'](?:[^"']*config\/|@\/)/, file);
  }
});
