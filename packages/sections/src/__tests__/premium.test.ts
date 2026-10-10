import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { sectionRegistry } from "../registry";
import { createCollectionLoader } from "../collections/loader";
import { collectionSchemas } from "../collections/schemas";
import type { SiteContext } from "../site";

const types = ["products", "dealer", "branch-map", "press", "tiktok", "social", "investment-models", "warranty", "about-story", "services"];
const entitlements: Record<string, string | undefined> = {
  "site-header": undefined, hero: undefined, services: undefined, segments: undefined, calculator: "calculator",
  "lead-form": "leadForm", packages: "packages", "investment-models": "investmentModels", projects: undefined,
  shorts: "shorts", tiktok: "tiktok", stats: "stats", "energy-monitoring": "energyMonitoring", process: undefined,
  testimonials: "testimonials", trust: "trust", brands: undefined, press: "press", products: "catalog", blog: undefined,
  faq: "faq", warranty: undefined, dealer: "dealer", "branch-map": "branchMap", "cta-banner": undefined,
  social: "social", "about-story": undefined, "site-footer": undefined,
};
const site = { tenantId: "test", locale: "vi", themeId: "t15" } as const;

test("registry has exactly the 28 section types and their package entitlements", () => {
  assert.deepEqual(Object.keys(sectionRegistry.types).sort(), Object.keys(entitlements).sort());
  for (const [type, entitlement] of Object.entries(entitlements)) assert.equal(sectionRegistry.getType(type)?.meta.entitlement, entitlement, type);
});

test("10 premium fixtures parse to defaults and have t15 variants", async () => {
  for (const type of types) {
    const def = sectionRegistry.getType(type);
    assert.ok(def, type);
    const fixture = Object.values(await import(`../${type}/fixtures`))[0];
    assert.deepEqual(def.schema.parse(fixture), def.defaults);
    assert.ok(JSON.stringify(fixture).includes("[DỮ LIỆU MẪU]"));
    for (const file of ["schema.ts", "fixtures.ts", "index.ts", "t15.tsx"]) assert.ok(existsSync(resolve(__dirname, "../../../../src", type, file)));
    assert.equal(sectionRegistry.getVariant(type, "t15")?.fallback, false);
  }
});

test("premium schemas reject unsafe URLs, invalid source, unknown outlets and ambiguous stats", () => {
  const bad = (type: string, patch: Record<string, unknown>) => {
    const def = sectionRegistry.getType(type)!;
    assert.equal(def.schema.safeParse({ ...def.defaults as Record<string, unknown>, ...patch }).success, false, type);
  };
  bad("press", { articles: [{ outletId: "missing", date: "2026-01-01", title: { vi: "Mẫu" }, excerpt: { vi: "Mẫu" } }] });
  bad("press", { articles: [{ outletId: "nmt", date: "2026-02-30", title: { vi: "Mẫu" }, excerpt: { vi: "Mẫu" } }] });
  bad("press", { articles: [{ outletId: "nmt", date: "2026-01-01", title: { vi: "Mẫu" }, excerpt: { vi: "Mẫu" }, url: "javascript:alert(1)" }] });
  bad("social", { channels: [{ kind: "facebook", label: { vi: "Mẫu" }, url: "javascript:alert(1)" }] });
  bad("tiktok", { videos: [{ id: "v", creator: { vi: "Mẫu" }, title: { vi: "Mẫu" }, poster: { id: "media", alt: { vi: "Mẫu" } }, source: { provider: "file", idOrSrc: "//evil/video.mp4" } }] });
  bad("about-story", { stats: [{ value: 5, sinceYear: 2012, label: { vi: "Mẫu" } }] });
  bad("about-story", { stats: [{ label: { vi: "Mẫu" } }] });
  for (const type of ["products", "branch-map"]) bad(type, { query: { limit: 99 } });
});

test("product prices and geographic coordinates are validated before rendering", () => {
  const product = { id: "p", slug: "p", name: "Mẫu", brand: "Mẫu", category: "panel", categoryLabel: "Tấm pin", images: [{ id: "media", alt: { vi: "Mẫu" } }], warranty: "Mẫu", specs: [], href: "/san-pham/p", price: 1000 };
  const schemas = collectionSchemas as Record<string, { safeParse: (value: unknown) => { success: boolean } }>;
  assert.equal(schemas.products.safeParse(product).success, true);
  for (const price of [-1, 1.5, Infinity]) assert.equal(schemas.products.safeParse({ ...product, price }).success, false);
  assert.equal(schemas.products.safeParse({ ...product, salePrice: -1 }).success, false);
  assert.equal(schemas.products.safeParse({ ...product, href: "javascript:alert(1)" }).success, false);
  const branch = { id: "b", name: "Mẫu", hotline: "0901234500", office: { address: "Mẫu", lat: 10.7, lng: 106.7 } };
  assert.equal(schemas.branches.safeParse(branch).success, true);
  for (const office of [{ address: "Mẫu", lat: 7, lng: 106 }, { address: "Mẫu", lat: 25, lng: 106 }, { address: "Mẫu", lat: 10, lng: 119 }, { address: "Mẫu", lat: 10, lng: 101 }]) assert.equal(schemas.branches.safeParse({ ...branch, office }).success, false);
});

test("loader fills products and branches for the current tenant", async () => {
  const product = { id: "p", featured: true };
  const branch = { id: "b" };
  const load = createCollectionLoader({
    products: (context: SiteContext) => { assert.equal(context.tenantId, "test"); return [product, { id: "hidden", featured: false }]; }, branches: () => [branch],
  });
  for (const type of ["products", "branch-map"]) {
    const data = sectionRegistry.getType(type)!.defaults;
    const section = { id: type, type, variant: "t15", enabled: true, data };
    assert.deepEqual((await load({ section, data, site }) as { items: unknown[] }).items, [type === "products" ? product : branch]);
  }
});

test("all premium variants render locale-aware content; product and map links survive without JS", async () => {
  const Loadable = require("next/dist/shared/lib/loadable.shared-runtime").default;
  for (const type of types) {
    const def = sectionRegistry.getType(type)!;
    const { default: Component } = await sectionRegistry.getVariant(type, "t15")!.load();
    await Loadable.preloadAll();
    for (const locale of ["vi", "en"] as const) {
      const html = renderToStaticMarkup(createElement(Component, { data: def.defaults, site: { ...site, locale }, sectionId: type }));
      const title = (def.defaults as { title: { vi: string; en?: string } }).title;
      const expected = renderToStaticMarkup(createElement("span", null, title[locale] ?? title.vi)).slice(6, -7);
      assert.ok(html.includes(expected), `${type}/${locale}`);
      if (type === "products") { assert.match(html, /href="\/san-pham\//); assert.match(html, /3\.150\.000/); }
      if (type === "branch-map") { assert.match(html, /https:\/\/www.google.com\/maps\/dir\/\?api=1&amp;destination=10.7865%2C106.699/); assert.match(html, /Hoàng Sa/); assert.match(html, /Trường Sa/); }
    }
  }
});
