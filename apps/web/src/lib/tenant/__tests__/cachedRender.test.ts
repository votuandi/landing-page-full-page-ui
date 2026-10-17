import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createMemoryCache } from "@solar/cache";
import { tenantRenderKey } from "../renderKey";

const require = createRequire(import.meta.url);
const file = "apps/web/src/components/tenant/cached.tsx";
const site = { tenantId: "tenant-a", siteId: "site-a", locale: "vi" as const,
  entitlements: { planId: "premium", disabled: [] as string[] }, context: {}, pageTypes: ["home"], seo: {},
  widgets: {}, profile: { theme: {} }, theme: { meta: {} }, locales: ["vi"] };
// Run the actual cache scope with a controlled Next-cache stand-in: no wall-clock sleeps or DB races.
function scopes(loadPage: () => Promise<unknown>, loadSite = async () => site) {
  const source = readFileSync(resolve("../../", file), "utf8");
  const compiled = { exports: {} as Record<string, (...args: any[]) => Promise<any>> };
  const mocks: Record<string, unknown> = {
    "next/cache": { cacheLife() {}, cacheTag() {} },
    "@solar/sections": { PageRenderer: "renderer", SiteWidgets: "widgets", createCollectionLoader: () => null },
    "@/components/TenantSiteShell": { default: "shell" },
    "@/lib/tenant/siteData": { loadTenantSite: loadSite, loadPublishedPage: loadPage, loadDraftPage: loadPage,
      siteCanUse: (value: typeof site) => (feature: string) => !value.entitlements.disabled.includes(feature) },
    "@/lib/tenant/collections": { tenantCollections: () => ({ source: {} }) },
    "@/lib/tenant/seo": { matchRedirect: () => null },
    "@/lib/tenant/contentSchemas": {},
    "@/lib/tenant/routes": { resolveRoute: () => ({ kind: "page" }), routeEnabled: () => true },
    "@/lib/tenant/cacheTags": { TENANT_CACHE_LIFE: {}, tenantPageTags: () => [] },
    "@/components/tenant/SystemPages": {},
  };
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(output, { module: compiled, exports: compiled.exports, require: (name: string) => name in mocks ? mocks[name] : require(name) });
  return compiled.exports;
}
const page = { title: "snapshot A", kind: "home", config: { sections: [{ type: "hero" }] } };
const bodyCanUse = (result: any) => result.content.props.children.props.canUse("calculator");

test("kill-switch snapshot breaks the UI key at the first refreshed read, without accumulating TTL", async () => {
  let now = 0;
  let disabled: string[] = [];
  const data = createMemoryCache({ now: () => now });
  const ui = createMemoryCache({ now: () => now, ttlMs: 60_000 });
  const read = () => data.cached(async () => [...disabled], { keyParts: "disabled", tags: [], ttlMs: 60_000 });
  await read();
  now = 1000; disabled = ["calculator"];
  now = 59_000;
  const render = scopes(async () => page);
  const request = async () => {
    const fresh = { ...site, entitlements: { ...site.entitlements, disabled: await read() } };
    const key = tenantRenderKey(fresh, false);
    return ui.cached(() => render.tenantPage(key, ""), { keyParts: [key], tags: [] });
  };
  const old = await request();
  assert.equal(bodyCanUse(old), true);
  now = 61_001; // 60,001 ms since the switch; the old UI entry still has 58 seconds left.
  const refreshed = await request();
  assert.ok(refreshed.content, "routing and content must be one snapshot");
  assert.equal(bodyCanUse(refreshed), false, "use the request snapshot even when an inner site read is stale");
  const key = tenantRenderKey({ ...site, entitlements: { ...site.entitlements, disabled: ["shorts", "calculator"] } }, false);
  assert.equal(key.disabled, '["calculator","shorts"]');
});

test("a deletion barrier cannot split an accepted outcome from its body", async () => {
  let row: typeof page | null = page;
  let release!: () => void;
  let reached!: () => void;
  const barrier = new Promise<void>(done => { reached = done; });
  const resume = new Promise<void>(done => { release = done; });
  let reads = 0;
  const render = scopes(async () => { reads++; const snapshot = row; reached(); await resume; return snapshot; });
  const key = tenantRenderKey(site, false);
  const pending = render.tenantPage(key, "");
  await barrier;
  row = null; // hidden/deleted after the read, while the accepted snapshot is still rendering.
  release();
  const outcome = await pending;
  const content = outcome.content;
  assert.ok(content, "an ok outcome must retain its body after deletion");
  assert.equal(outcome.title, "snapshot A");
  assert.equal(reads, 1);
  assert.equal((await render.tenantPage(key, "")).kind, "notFound");
});

test("UI keys partition the same slug by tenant, site, locale and preview", () => {
  const key = tenantRenderKey(site, false);
  const keys = [key, { ...key, tenantId: "tenant-b" }, { ...key, siteId: "site-b" }, { ...key, locale: "en" }, { ...key, preview: true }];
  assert.equal(new Set(keys.map(value => JSON.stringify([value, "same-slug"]))).size, 5);
});
