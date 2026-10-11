import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Loadable from "next/dist/shared/lib/loadable.shared-runtime";
import { sectionRegistry } from "../registry";
import { widgetRegistry } from "../widgets/registry";
import { calculator } from "../calculator/schema";
import { projects } from "../projects/schema";
import { calculateSolar, formatNumber } from "@solar/core";
import { toCalculatorParams } from "../calculator/params";

const site = { tenantId: "t12-test", locale: "vi", themeId: "t12" } as const;

test("t12 variants render defaults in t12 and t15 without falling back", async () => {
  for (const type of ["hero", "calculator", "segments", "projects", "contact-dock"]) {
    const registry = type === "contact-dock" ? widgetRegistry : sectionRegistry;
    const def = registry.getType(type)!;
    const variant = registry.getVariant(type, "t12")!;
    assert.equal(variant.fallback, false, type);
    const { default: Component } = await variant.load();
    await Loadable.preloadAll();
    for (const themeId of ["t12", "t15"]) {
      const html = renderToStaticMarkup(createElement(Component, { data: def.defaults, site: { ...site, themeId }, sectionId: type }));
      if (type === "projects") assert.equal(html, ""); // Collection defaults intentionally contain no items.
      else assert.ok(html.length > 100, type);
    }
  }
});

test("projects t12 renders a populated shared collection and preserves links, savings and videos", async () => {
  const def = projects;
  const data = def.schema.parse({ ...def.defaults, items: [{
    id: "p", title: "[DỮ LIỆU MẪU] Mái nhà riêng", segment: "shop", location: "Hà Nội", kwp: 10,
    image: { id: "media-p", alt: { vi: "Công trình mẫu" } }, href: "/cong-trinh/mau", savingPerMonth: 3_000_000,
    video: { provider: "file", idOrSrc: "/sample.mp4" },
  }] });
  const { default: Component } = await sectionRegistry.getVariant("projects", "t12")!.load();
  await Loadable.preloadAll();
  const html = renderToStaticMarkup(createElement(Component, { data, site, sectionId: "projects" }));
  assert.match(html, /Mái nhà riêng/);
  assert.match(html, /href="\/cong-trinh\/mau"/);
  assert.match(html, /3 triệu/);
  assert.match(html, /Xem video công trình/);
  assert.match(html, /lg:grid-cols-3/);
  assert.match(html, />Cửa hàng</);
  assert.doesNotMatch(html, />Trang trại</); // Filter tabs only list segments that have items.
});

test("t12 wizard honors a reordered subset of shared steps", async () => {
  const data = calculator.schema.parse({ ...calculator.defaults, steps: ["roof", "bill"] });
  const { default: Component } = await sectionRegistry.getVariant("calculator", "t12")!.load();
  await Loadable.preloadAll();
  const html = renderToStaticMarkup(createElement(Component, { data, site: { ...site, locale: "en" }, sectionId: "subset" }));
  assert.match(html, /Step 1\/2/);
  assert.match(html, /data-step-panel="roof" class=""/);
  assert.match(html, /data-step-panel="bill" class="hidden"/);
  assert.doesNotMatch(html, /data-step-panel="(?:segment|province|ratio)"/);
});

test("contact-dock t12 keeps mobile bar, phone and safe external links", async () => {
  const def = widgetRegistry.types["contact-dock"];
  const data = def.schema.parse({ ...def.defaults, mobileBar: true });
  const { default: Component } = await widgetRegistry.getVariant("contact-dock", "t12")!.load();
  await Loadable.preloadAll();
  const html = renderToStaticMarkup(createElement(Component, { data, site, sectionId: "dock" }));
  assert.equal((html.match(/<nav /g) ?? []).length, 2);
  assert.match(html, /href="tel:0901234567"/);
  assert.match(html, /href="https:\/\/zalo.me\/0901234567"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /bg-accent text-on-accent/);
});

test("calculator t12 → t15 → t12 preserves all shared data and custom coefficients", async () => {
  const original = calculator.schema.parse({
    ...structuredClone(calculator.defaults),
    title: { lead: { vi: "Dự toán riêng", en: "Custom estimate" }, highlight: { vi: "30 giây", en: "30 seconds" } },
    pricePerKwp: { household: 17_000_000, shop: 13_000_000, factory: 11_000_000, farm: 12_000_000 },
    steps: ["segment", "bill", "roof", "province", "ratio"],
    defaultProvince: "Hà Nội",
    leadSource: "custom-calculator",
  });
  let data = structuredClone(original);
  for (const name of ["t12", "t15", "t12"]) {
    const variant = sectionRegistry.getVariant("calculator", name)!;
    assert.equal(variant.fallback, false);
    data = calculator.schema.parse(data);
    const { default: Component } = await variant.load();
    await Loadable.preloadAll();
    const html = renderToStaticMarkup(createElement(Component, { data, site, sectionId: "estimate" }));
    assert.match(html, /Dự toán riêng/);
    assert.match(html, /data-calculator-result/);
    const first = data.segments[0].segment;
    const result = calculateSolar({ segment: first, monthlyBill: data.inputs[first].bill.default, roofArea: data.inputs[first].roof.default, province: data.defaultProvince, daytimeRatio: data.segmentRatios[first] }, toCalculatorParams(data));
    assert.ok(html.includes(`>${formatNumber(result.kwp, 1)} `), "SSR must show the calculated size, including without JavaScript");
    assert.deepEqual(data, original);
  }
});
