import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { defineVariants } from "../define";
import { createRegistry } from "../registry";
import { siteWidgetsSchema } from "../widgets/config";
import { widgetRegistry } from "../widgets/registry";
import { SiteWidgets } from "../widgets/SiteWidgets";
import { createConsultSession, reachedScrollRatio } from "../widgets/consult-popup/session";
import { createCollectionLoader } from "../collections/loader";
import { productsFixture } from "../products/fixtures";
import { migrateQuoteCartV1 } from "../widgets/quote-cart/migrations";

const site = { tenantId: "widget-test", locale: "vi" as const, themeId: "t15" };
const keys = ["contact-dock", "consult-popup", "mobile-bottom-nav", "commitments-strip", "quote-cart", "theme-switch", "scroll-progress"];

test("quote-cart v1 migration fills estimate labels, preserves custom copy and is idempotent", () => {
  const cart = widgetRegistry.types["quote-cart"];
  assert.equal(cart.schemaVersion, 2);
  const { attachEstimateLabel, estimateSummary, ...v1 } = cart.defaults;
  assert.ok(attachEstimateLabel.vi);
  assert.match(estimateSummary.vi, /\{segment\}.*\{kwp\}.*\{saving\}/);
  const migrated = migrateQuoteCartV1(v1);
  assert.deepEqual(cart.schema.parse(migrated), cart.defaults);
  assert.deepEqual(cart.schema.parse(v1), cart.defaults);
  assert.deepEqual(migrateQuoteCartV1(migrated), migrated);
  assert.deepEqual(migrateQuoteCartV1({ ...v1, attachEstimateLabel: { vi: "Nhãn riêng" } }).attachEstimateLabel, { vi: "Nhãn riêng" });
});

test("seven widgets have valid defaults, t15 variants and only cart needs catalog", async () => {
  assert.deepEqual(Object.keys(widgetRegistry.types).sort(), keys.sort());
  for (const key of keys) {
    const def = widgetRegistry.getType(key)!;
    assert.deepEqual(def.schema.parse(def.defaults), def.defaults);
    assert.equal(def.meta.entitlement, key === "quote-cart" ? "catalog" : undefined);
    assert.equal(widgetRegistry.getVariant(key, "t15")?.fallback, false);
    const fixture = await import(`../widgets/${key}/fixtures`);
    assert.deepEqual(def.schema.parse(fixture.fixture), def.defaults);
  }
});

test("site configuration defaults, strips unknown keys and prevents overlapping mobile bars", () => {
  assert.deepEqual(siteWidgetsSchema.parse({ "contact-dock": {}, unknown: {} }), {
    "contact-dock": { enabled: false, variant: "t15" },
  });
  assert.equal(siteWidgetsSchema.safeParse({
    "contact-dock": { enabled: true, data: { mobileBar: true } }, "mobile-bottom-nav": { enabled: true },
  }).success, false);
  assert.equal(siteWidgetsSchema.safeParse({
    "contact-dock": { enabled: false, data: { mobileBar: true } }, "mobile-bottom-nav": { enabled: true },
  }).success, true);
});

test("widget schemas reject bad timers, unsafe links and conflicting emphasis", () => {
  const popup = widgetRegistry.types["consult-popup"];
  for (const data of [{ delayMs: -1 }, { scrollRatio: 1.1 }]) assert.equal(popup.schema.safeParse({ ...popup.defaults, ...data }).success, false);
  const dock = widgetRegistry.types["contact-dock"];
  for (const item of [{ kind: "call", label: { vi: "Gọi" } }, { kind: "call", label: { vi: "Gọi" }, link: { kind: "url", value: "javascript:alert(1)", label: { vi: "Gọi" } } }]) {
    assert.equal(dock.schema.safeParse({ ...dock.defaults, items: [item] }).success, false);
  }
  const nav = widgetRegistry.types["mobile-bottom-nav"];
  assert.equal(nav.schema.safeParse({ ...nav.defaults, items: nav.defaults.items.map((item) => ({ ...item, emphasis: true })) }).success, false);
  const cart = widgetRegistry.types["quote-cart"];
  assert.equal(cart.schema.parse({ ...cart.defaults, query: {} }).query.limit, 48);
});

// Plain variants isolate renderer behavior from Next's dynamic-island SSR implementation.
let variantLoads = 0;
const registry = createRegistry(Object.fromEntries(keys.map((key) => {
  const def = widgetRegistry.getType(key)!;
  return [key, defineVariants(def, "t15", { t15: async () => { variantLoads++; return { default: () => "visible" }; } })];
})));
const render = async (widgets: object, slot: "inline" | "overlay", canUse = (_: string) => true) =>
  renderToStaticMarkup(await SiteWidgets({ widgets: siteWidgetsSchema.parse(widgets), site, slot, canUse, registry }));

test("renderer gates catalog before loading, honors enabled and slots, uses defaults and fallback", async (t) => {
  t.mock.method(console, "warn", () => {});
  const widgets = { "quote-cart": { enabled: true }, "commitments-strip": { enabled: true }, "theme-switch": { enabled: false } };
  variantLoads = 0;
  assert.equal(await render(widgets, "overlay", () => false), "");
  assert.equal(variantLoads, 0);
  await SiteWidgets({ widgets: siteWidgetsSchema.parse(widgets), site, slot: "overlay", registry, canUse: () => false,
    loadData: () => { assert.fail("denied widget must not query collections"); } });
  assert.match(await render(widgets, "overlay"), /data-widget="quote-cart"/);
  const inline = await render(widgets, "inline");
  assert.match(inline, /data-widget="commitments-strip"/);
  assert.doesNotMatch(inline, /quote-cart|theme-switch/);
  assert.match(await render({ "scroll-progress": { enabled: true, variant: "unknown" } }, "overlay"), /visible/);
});

test("widget collection loader receives tenant and hydrates cart catalog with query limits", async () => {
  const def = widgetRegistry.types["quote-cart"];
  const data = { ...def.defaults, query: { ...def.defaults.query, limit: 1 } };
  const loader = createCollectionLoader({ products: (context) => { assert.equal(context, site); return productsFixture.items; } }, widgetRegistry);
  const result = def.schema.parse(await loader({ section: { id: def.type, type: def.type, variant: "t15", enabled: true, data }, data, site }));
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].slug, productsFixture.items[0].slug);
});

test("invalid or failing widget data is skipped with tenant log; others render and loader gets defaults", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const html = await render({ "consult-popup": { enabled: true, data: {} }, "scroll-progress": { enabled: true } }, "overlay");
  assert.doesNotMatch(html, /consult-popup/);
  assert.match(html, /scroll-progress/);
  assert.equal((error.mock.calls[0].arguments[1] as { tenantId: string }).tenantId, site.tenantId);
  let loaded = false;
  await SiteWidgets({ widgets: siteWidgetsSchema.parse({ "quote-cart": { enabled: true } }), site, slot: "overlay", registry,
    loadData: ({ section, data, site: context }) => {
      assert.equal(section.id, "quote-cart"); assert.equal(context, site);
      assert.deepEqual(data, widgetRegistry.types["quote-cart"].defaults); loaded = true; throw new Error("collection offline");
    } });
  assert.equal(loaded, true);
  assert.equal(error.mock.callCount(), 2);
});

test("consult scroll trigger opens at or above its threshold", () => {
  assert.equal(reachedScrollRatio(600, 1800, 800, 0.6), true);
  assert.equal(reachedScrollRatio(601, 1800, 800, 0.6), true);
});

test("consult scroll trigger stays closed below its threshold", () => {
  assert.equal(reachedScrollRatio(599, 1800, 800, 0.6), false);
});

test("consult scroll trigger stays closed on non-scrollable pages", () => {
  assert.equal(reachedScrollRatio(0, 800, 800, 0.6), false);
  assert.equal(reachedScrollRatio(0, 700, 800, 0.6), false);
});

test("consult opens at most once per session, postpones for dialogs, falls back when storage fails", () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const session = createConsultSession();
  assert.equal(session.shouldAutoOpen(storage, true), false);
  assert.equal(session.shouldAutoOpen(storage, false), true);
  session.markShown(storage);
  assert.equal(session.shouldAutoOpen(storage, false), false);
  assert.equal(createConsultSession().shouldAutoOpen(storage, false), false);
  const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
  const fallback = createConsultSession();
  assert.equal(fallback.shouldAutoOpen(blocked, false), true);
  fallback.markShown(blocked);
  assert.equal(fallback.shouldAutoOpen(blocked, false), false);
});
