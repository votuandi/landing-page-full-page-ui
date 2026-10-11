import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Loadable from "next/dist/shared/lib/loadable.shared-runtime";
import { sectionRegistry } from "../registry";
import { migrateHeroV1 } from "../hero/migrations";

const variants = {
  minwy: ["hero", "brands", "products", "blog", "about-story", "warranty", "site-header", "site-footer"],
  t02: ["hero", "services", "process", "cta-banner", "faq"],
  t03: ["hero", "page-hero"],
  t04: ["hero", "packages", "stats"],
};

test("Classic variants render shared defaults in their own theme and t15", async () => {
  for (const [variant, types] of Object.entries(variants)) for (const type of types) {
    const def = sectionRegistry.getType(type)!;
    assert.ok(def, type);
    const entry = sectionRegistry.getVariant(type, variant)!;
    assert.equal(entry.fallback, false, `${type}/${variant}`);
    const { default: Component } = await entry.load();
    await Loadable.preloadAll();
    for (const themeId of [variant === "minwy" ? "t01" : variant, "t15"]) {
      const data = def.schema.parse(def.defaults);
      const html = renderToStaticMarkup(createElement(Component, { data, site: { tenantId: "classic-test", locale: "vi", themeId }, sectionId: "test" }));
      if (type !== "blog") assert.ok(html.length > 100, `${type}/${variant}`);
      assert.deepEqual(data, def.defaults);
    }
  }
});

test("hero optional slides survive schema parsing and enforce safe media and links", () => {
  const def = sectionRegistry.types.hero;
  const original = structuredClone(def.defaults);
  const slide = { title: { vi: "Tấm pin", en: "Solar panels" }, description: { vi: "Giải pháp" }, image: original.image, cta: original.primaryCta };
  const parsed = def.schema.parse({ ...original, slides: [slide] });
  assert.deepEqual(parsed.slides, [slide]);
  assert.deepEqual(def.schema.parse(original), original);
  assert.deepEqual(migrateHeroV1(original), original);
  assert.equal(def.schemaVersion, 2);
  assert.equal(def.schema.safeParse({ ...original, slides: [{ ...slide, cta: { kind: "url", value: "javascript:alert(1)", label: { vi: "Sai" } } }] }).success, false);
});

test("page hero validates optional breadcrumb, renders locale and media without JS", async () => {
  const def = sectionRegistry.types["page-hero"];
  assert.ok(def);
  const data = def.schema.parse({ ...def.defaults, title: { vi: "Giới thiệu", en: "About us" }, breadcrumb: [{ kind: "page", value: "", label: { vi: "Trang chủ", en: "Home" } }] });
  const { default: Component } = await sectionRegistry.getVariant("page-hero", "t03")!.load();
  const html = renderToStaticMarkup(createElement(Component, { data, site: { tenantId: "classic", locale: "en", themeId: "t15" }, sectionId: "page" }));
  assert.match(html, /<h1[^>]*>About us/);
  assert.match(html, /Home/);
  assert.match(html, /href="\/"/);
});

test("t02 FAQ renders native disclosure and optional structured data", async () => {
  const def = sectionRegistry.types.faq;
  const { default: Component } = await sectionRegistry.getVariant("faq", "t02")!.load();
  const render = (jsonLd: boolean) => renderToStaticMarkup(createElement(Component, { data: { ...def.defaults, jsonLd }, site: { tenantId: "classic", locale: "vi", themeId: "t02" }, sectionId: "faq" }));
  assert.equal((render(true).match(/<details/g) ?? []).length, def.defaults.items.length);
  assert.match(render(true), /FAQPage/);
  assert.doesNotMatch(render(false), /application\/ld\+json/);
});
