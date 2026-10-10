import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { calculateSolar } from "@solar/core";
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

test("mediaSrc chỉ nhận đường dẫn tĩnh cùng origin", () => {
  assert.equal(mediaSrc({ id: "/images/a.webp", alt: { vi: "" } }), "/images/a.webp");
  for (const id of ["//evil.com/a.png", "media_123", "https://x.com/a.png"]) {
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
