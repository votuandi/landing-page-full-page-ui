import assert from "node:assert/strict";
import test from "node:test";
import type { TenantRepo } from "@solar/db";
import { createSiteData, planCanUse } from "../siteData";
import { sectionRegistry } from "@solar/sections";

const tenantId = "00000000-0000-4000-8000-000000000001";
const siteId = "00000000-0000-4000-8000-000000000002";
const repo = (extra: object = {}) => ({
  site: { first: async () => ({ id: siteId, tenantId, themeId: "t15", name: "A", profile: {}, seo: {}, widgets: {}, themeOverrides: {}, locales: ["vi"], defaultLocale: "vi", tenant: { planId: "premium" } }) },
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
  descriptors[0] = { ...descriptors[0], anchor: "same" } as typeof descriptors[0];
  descriptors[1] = { ...descriptors[1], anchor: "same" } as typeof descriptors[1];
  assert.equal(await data.loadPublishedPage(tenantId, siteId, ""), null);
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /PRIVATE/);
});
