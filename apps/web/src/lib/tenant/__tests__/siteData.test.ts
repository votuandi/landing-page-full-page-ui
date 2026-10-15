import assert from "node:assert/strict";
import test from "node:test";
import type { TenantRepo } from "@solar/db";
import { createSiteData, planCanUse, selectSiteLocale } from "../siteData";
import { sectionRegistry } from "@solar/sections";

const tenantId = "00000000-0000-4000-8000-000000000001";
const siteId = "00000000-0000-4000-8000-000000000002";
const repo = (extra: object = {}) => ({
  site: { first: async () => ({ id: siteId, tenantId, themeId: "t15", name: "A", profile: {}, seo: {}, widgets: {}, themeOverrides: {}, locales: ["vi"], defaultLocale: "vi", pageTypes: ["home", "contact", "policy"], tenant: { planId: "premium", addons: [] } }) },
  domain: { first: async () => ({ hostname: "a.localhost" }) },
  page: { first: async () => null }, sectionContent: { list: async () => [] }, ...extra,
}) as unknown as TenantRepo;

test("site rejects invalid IDs and absent primary domain, never uses demo", async () => {
  const data = createSiteData(() => repo());
  assert.equal(await data.loadTenantSite("bad", siteId), null);
  assert.equal(await data.loadTenantSite(tenantId, "bad"), null);
  assert.equal(await createSiteData(() => repo({ domain: { first: async () => null } })).loadTenantSite(tenantId, siteId), null);
  assert.equal((await data.loadTenantSite(tenantId, siteId))?.primaryHost, "a.localhost");
});

test("site config fallbacks log IDs only; theme/domain and DB failures never become demo", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const good = await repo().site.first({});
  assert.ok(good);
  const siteWith = (patch: object) => createSiteData(() => repo({ site: { first: async () => ({ ...good, ...patch }) } }));
  const invalid = { PRIVATE: "raw secret" };
  const result = await siteWith({ profile: { email: invalid }, seo: { ogImage: invalid }, widgets: { "theme-switch": { enabled: "PRIVATE" } }, themeOverrides: { colors: invalid } }).loadTenantSite(tenantId, siteId);
  assert.ok(result);
  assert.deepEqual(result.seo, { redirects: [] });
  assert.deepEqual(result.widgets, {});
  assert.deepEqual(result.overrides, {});
  assert.equal(result.profile.theme.default, "light");
  assert.equal(log.mock.callCount(), 4);
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /PRIVATE|raw secret/);
  assert.match(JSON.stringify(log.mock.calls), new RegExp(siteId));
  assert.equal(await siteWith({ themeId: "unknown" }).loadTenantSite(tenantId, siteId), null);
  const domains = createSiteData(() => repo({ domain: { first: async ({ where }: { where: unknown }) => {
    assert.deepEqual(where, { siteId, isPrimary: true, status: { in: ["verified", "active"] } }); return null;
  } } }));
  assert.equal(await domains.loadTenantSite(tenantId, siteId), null);
  const failing = createSiteData(() => repo({ site: { first: async () => { throw new Error("DB unavailable"); } }, page: { first: async () => { throw new Error("DB unavailable"); } } }));
  await assert.rejects(failing.loadTenantSite(tenantId, siteId), /DB unavailable/);
  await assert.rejects(failing.loadPublishedPage(tenantId, siteId, ""), /DB unavailable/);
});

test("published loader scopes page and content to site/page, ignores draft and falls back on corrupt published data", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const data = createSiteData(() => repo({
    page: { first: async ({ where }: { where: Record<string, unknown> }) => {
      assert.deepEqual(where, { siteId, slug: "landing/nang-luong", publishedAt: { not: null } });
      return { id: "page-a", title: { vi: "Published" }, draftSections: "secret", sections: [
        { id: "hero-a", type: "hero", variant: "t15", enabled: true, anchor: "gioi-thieu" },
        { id: "unknown", type: "unknown", variant: "t15" },
      ] };
    } },
    sectionContent: { list: async ({ where }: { where: Record<string, unknown> }) => {
      assert.deepEqual(where, { siteId, pageId: "page-a" });
      return [{ sectionId: "hero-a", type: "hero", schemaVersion: 1, data: { title: 123 }, draftData: "secret" }];
    } },
  }));
  const result = await data.loadPublishedPage(tenantId, siteId, "landing/nang-luong");
  assert.equal(result?.config.sections.length, 1);
  assert.equal(result?.config.sections[0].anchor, "gioi-thieu");
  assert.doesNotMatch(JSON.stringify(result?.config), /secret/);
  assert.ok(log.mock.callCount() >= 1);
});

test("base plans deny unknown features/plans and keep premium/pro distinction", (t) => {
  t.mock.method(console, "error", () => {});
  assert.equal(planCanUse("premium")("catalog"), true);
  assert.equal(planCanUse("pro")("catalog"), false);
  assert.equal(planCanUse("premium")("unknown"), false);
  assert.equal(planCanUse("missing")("calculator"), false);
  assert.equal(planCanUse("pro", ["catalog"])("catalog"), true, "addons extend the plan (D8)");
  assert.equal(planCanUse("pro", ["unknown"])("unknown"), false);
});

test("published v1 header migrates in memory, missing/type-mismatched rows use defaults and duplicate anchors reject page", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const def = sectionRegistry.types["site-header"];
  const { controls: _controls, ...old } = def.defaults;
  const descriptors = [
    { id: "head", type: "site-header", variant: "t15", enabled: true },
    { id: "missing", type: "hero", variant: "t15", enabled: false },
    { id: "wrong", type: "hero", variant: "t15", enabled: true },
  ];
  const data = createSiteData(() => repo({
    page: { first: async () => ({ id: "page", title: { vi: "VI", en: "EN" }, sections: descriptors }) },
    sectionContent: { list: async () => [{ sectionId: "head", type: "site-header", schemaVersion: 1, data: old, draftData: { invalid: "PRIVATE" } }, { sectionId: "wrong", type: "blog", schemaVersion: 1, data: "PRIVATE" }] },
  }));
  const result = await data.loadPublishedPage(tenantId, siteId, "", "en");
  assert.equal(result?.title, "EN");
  assert.deepEqual(result?.config.sections[0].data, def.schema.parse(old));
  assert.deepEqual(result?.config.sections[1].data, sectionRegistry.types.hero.defaults);
  assert.equal(result?.config.sections[1].enabled, false);
  assert.deepEqual(result?.config.sections[2].data, sectionRegistry.types.hero.defaults);
  for (const schemaVersion of [999, 0]) {
    const broken = createSiteData(() => repo({ page: { first: async () => ({ id: "page", title: {}, sections: [descriptors[0]] }) }, sectionContent: { list: async () => [{ sectionId: "head", type: "site-header", schemaVersion, data: { PRIVATE: "secret" } }] } }));
    assert.deepEqual((await broken.loadPublishedPage(tenantId, siteId, ""))?.config.sections[0].data, def.defaults);
  }
  descriptors[0] = { ...descriptors[0], anchor: "same" } as typeof descriptors[0];
  descriptors[1] = { ...descriptors[1], anchor: "same" } as typeof descriptors[1];
  assert.equal(await data.loadPublishedPage(tenantId, siteId, ""), null);
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /PRIVATE/);
});

test("locale selection respects allowed locales, default EN, and ignores unsupported cookie values", () => {
  assert.equal(selectSiteLocale(["vi", "en"], "vi", "en"), "en");
  assert.equal(selectSiteLocale(["en"], "en", "vi"), "en");
  assert.equal(selectSiteLocale(["vi", "en"], "en", "fr"), "en");
});
