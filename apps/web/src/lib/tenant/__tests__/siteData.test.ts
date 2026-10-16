import assert from "node:assert/strict";
import test from "node:test";
import type { TenantRepo } from "@solar/db";
import { createSiteData as factory, selectSiteLocale, siteCanUse } from "../siteData";
import { sectionRegistry } from "@solar/sections";

const tenantId = "00000000-0000-4000-8000-000000000001";
const siteId = "00000000-0000-4000-8000-000000000002";
const createSiteData = (...args: Parameters<typeof factory>) => factory(args[0], args[1], args[2], args[3] ?? ((id, work) => work(args[0](id))));
const repo = (extra: object = {}) => ({
  site: { first: async () => ({ id: siteId, tenantId, themeId: "t15", name: "A", profile: {}, seo: {}, widgets: {}, themeOverrides: {}, locales: ["vi"], defaultLocale: "vi", pageTypes: ["home", "contact", "policy"], tenant: { planId: "premium", addons: [], status: "active", createdAt: new Date("2026-01-01T00:00:00Z"), featureOverrides: {}, limitOverrides: {} } }) },
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

test("site entitlements follow D19: plan downgrade, addons, overrides and platform kill switch", async () => {
  const good = await repo().site.first({}) as unknown as { tenant: object };
  const load = (tenant: object, disabled: string[] = []) => createSiteData(() => repo({ site: { first: async () => ({ ...good, tenant: { ...good.tenant, ...tenant } }) } }),
    async () => disabled).loadTenantSite(tenantId, siteId).then((site) => siteCanUse(site!));
  assert.equal((await load({}))("shorts"), true);
  assert.equal((await load({ planId: "pro" }))("shorts"), false, "downgrade hides premium sections");
  assert.equal((await load({ planId: "pro", addons: ["shorts"] }))("shorts"), true, "addons extend the plan (D8)");
  assert.equal((await load({}, ["shorts", "unknown"]))("shorts"), false, "kill switch wins");
  assert.equal((await load({ featureOverrides: { shorts: { on: false, reason: "vi phạm" } } }))("shorts"), false);
  assert.equal((await load({ planId: "pro", featureOverrides: { shorts: { on: true, until: "2000-01-01T00:00:00Z", reason: "hết hạn" } } }))("shorts"), false);
  assert.equal((await load({ status: "suspended" }))("leadForm"), false);
  assert.equal((await load({}))("unknown"), false);
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

test("draft loader uses draft layout/data without publication or content cache", async () => {
  let reads = 0;
  const hero = sectionRegistry.types.hero;
  const repository = repo({
    page: { first: async ({ where }: { where: object }) => {
      assert.deepEqual(where, { siteId, slug: "draft" }); reads++;
      return { id: "page", sections: [], draftSections: [{ id: "h", type: "hero", variant: "t15", enabled: true }] };
    } },
    sectionContent: { list: async () => [{ sectionId: "h", type: "hero", schemaVersion: hero.schemaVersion,
      data: hero.defaults, draftData: { ...hero.defaults, title: { ...hero.defaults.title, lead: { vi: "[DỮ LIỆU MẪU] nháp" } } } }] },
  });
  const data = createSiteData(() => repository, undefined, { cached: async () => { throw new Error("Draft must bypass cache"); } });
  for (let i = 0; i < 2; i++) assert.match(JSON.stringify(await data.loadDraftPage(tenantId, siteId, "draft")), /nháp/);
  assert.equal(reads, 2);
});

test("process cache dedupes pages/sites and keeps platform kill switches independent", async () => {
  const { createMemoryCache, tenantTag, pageTag } = await import("@solar/cache");
  const memory = createMemoryCache(); let disabled: string[] = [], pageReads = 0;
  const repository = repo({ page: { first: async () => { pageReads++; return { id: "page", title: { vi: "VI" }, sections: [] }; } } });
  const data = createSiteData(() => repository, async () => disabled, memory);
  await data.loadPublishedPage(tenantId, siteId, ""); await data.loadPublishedPage(tenantId, siteId, "");
  assert.equal(pageReads, 1);
  await memory.invalidate([pageTag(tenantId, "")]); await data.loadPublishedPage(tenantId, siteId, ""); assert.equal(pageReads, 2);
  assert.equal(siteCanUse((await data.loadTenantSite(tenantId, siteId))!)("shorts"), true);
  disabled = ["shorts"];
  assert.equal(siteCanUse((await data.loadTenantSite(tenantId, siteId))!)("shorts"), false);
  await memory.invalidate([tenantTag(tenantId)]); await data.loadPublishedPage(tenantId, siteId, ""); assert.equal(pageReads, 3);
});
