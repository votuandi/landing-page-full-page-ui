import assert from "node:assert/strict";
import test from "node:test";
import { effectivePermissions, type Session } from "@solar/auth";
import { StructureError, SiteSettingsError } from "@solar/db";
import { createAction } from "../lib/action.ts";
import { createLandingHandlers, createLandingSchema, saveLandingSettingsSchema } from "../lib/landingPages.ts";
import { landingSlugIssue } from "@solar/presets";

const tenantId = "e7000000-0000-4000-8000-000000000001", siteId = "e7000000-0000-4000-8000-000000000002", pageId = "e7000000-0000-4000-8000-000000000003";
const session = { realm: "site", tenantId, audience: "admin", kind: "user", role: "owner", permissions: effectivePermissions({ role: "owner", audience: "admin" }), mustChangePassword: false } as Session;
const form = (data: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(data)) f.set(k, v); return f; };
const base = { title: "Trang trại", slug: "trang-trai", source: "blank" };

test("landing action: returns specific slug/template/source messages through the action wrapper without writing", async () => {
  let writes = 0;
  const handlers = createLandingHandlers({ tenant: async () => ({ tenantId, siteId }), entitlements: async () => () => true,
    create: async () => { writes++; return { pageId }; }, page: async () => null, save: async () => ({ pageId }) });
  const run = createAction(async () => ({ tenantId, slug: "demo", session }))("pages.structure", createLandingSchema, handlers.create);
  const cases: [Record<string, string>, string][] = [
    [{ ...base, slug: "San-Pham" }, landingSlugIssue("San-Pham")!],
    [{ ...base, slug: "san-pham/x" }, landingSlugIssue("san-pham/x")!],
    [{ ...base, slug: "a".repeat(121) }, landingSlugIssue("a".repeat(121))!],
    [{ ...base, source: "template" }, "Vui lòng chọn mẫu trang"],
    [{ ...base, source: "template", templateId: "__proto__" }, "Vui lòng chọn mẫu trang"],
    [{ ...base, source: "duplicate" }, "Vui lòng chọn trang nguồn"],
    [{ ...base, source: "duplicate", sourcePageId: "invalid" }, "Vui lòng chọn trang nguồn"],
  ];
  for (const [values, error] of cases) assert.deepEqual(await run({}, form(values)), { ok: false, status: 400, error }, JSON.stringify(values));
  for (const values of [{ ...base, slug: "a".repeat(201) }, { ...base, title: "" }]) {
    assert.deepEqual(await run({}, form(values)), { ok: false, status: 400, error: "Vui lòng kiểm tra các trường đã nhập" });
  }
  assert.equal(writes, 0);
});

test("landing action: blank/template/duplicate, permission before query, tenant/site boundary, no landingPages", async () => {
  let reads = 0, writes = 0, allowed = true;
  const sources: unknown[] = [];
  const handlers = createLandingHandlers({ tenant: async () => { reads++; return { tenantId, siteId }; }, entitlements: async () => () => allowed,
    create: async (id, input) => { writes++; assert.equal(id, tenantId); assert.equal(input.siteId, siteId); sources.push(input.source); return { pageId }; },
    page: async () => ({ siteId, slug: "trang-trai" }), save: async () => ({ pageId }) });
  const run = (s = session, t = tenantId) => createAction(async () => ({ tenantId: t, slug: "demo", session: s }))("pages.structure", createLandingSchema, handlers.create);
  for (const source of ["blank", "template", "duplicate"]) assert.equal((await run()({}, form({ ...base, source, templateId: "ho-gia-dinh", sourcePageId: pageId }))).url, `/trang/${pageId}`);
  assert.deepEqual(sources, [{ kind: "blank" }, { kind: "template", id: "ho-gia-dinh" }, { kind: "duplicate", pageId }]);
  const before = reads;
  assert.equal((await run({ ...session, permissions: effectivePermissions({ role: "viewer", audience: "admin" }) })({}, form(base))).status, 403);
  assert.equal(reads, before, "permission before data reads");
  assert.equal((await run({ ...session, tenantId: "other" }, "other")({}, form(base))).status, 404);
  allowed = false; assert.equal((await run()({}, form(base))).status, 400);
  for (const data of [{ ...base, title: "" }, { ...base, slug: "api" }, { ...base, source: "template" }, { ...base, source: "duplicate", sourcePageId: "x" }]) assert.equal((await run()({}, form(data))).status, 400);
  assert.equal(writes, 3);
});

test("landing settings action: VI/EN, checkbox fields, rejects cross-site page and invalid SEO", async () => {
  let currentSite = siteId, writes = 0;
  const handlers = createLandingHandlers({ tenant: async () => ({ tenantId, siteId }), entitlements: async () => () => true,
    create: async () => ({ pageId }), page: async () => ({ siteId: currentSite, slug: "trang-trai" }),
    save: async (_id, input) => { writes++; assert.deepEqual(input.settings, { seo: { title: { vi: "SEO", en: "EN" }, description: { vi: "Mô tả" }, noindex: true }, hideHeader: true, hideFooter: false }); return { pageId }; } });
  const run = createAction(async () => ({ tenantId, slug: "demo", session }))("pages.structure", saveLandingSettingsSchema, handlers.save);
  const values = { pageId, title: "Trang trại", seoTitle: "SEO", seoTitleEn: "EN", seoDescription: "Mô tả", noindex: "on", hideHeader: "on" };
  assert.equal((await run({}, form(values))).message, "Đã lưu cài đặt trang");
  currentSite = "foreign"; assert.equal((await run({}, form(values))).status, 404);
  assert.equal((await run({}, form({ ...values, seoTitle: "a".repeat(71) }))).status, 400);
  assert.equal(writes, 1);
});

test("landing actions map duplicate/limit errors to Vietnamese messages", async () => {
  for (const error of [new StructureError("Vượt số trang của gói: 4/3"), new SiteSettingsError("Đường dẫn đã được dùng", 409)]) {
    const handlers = createLandingHandlers({ tenant: async () => ({ tenantId, siteId }), entitlements: async () => () => true,
      create: async () => { throw error; }, page: async () => null, save: async () => { throw error; } });
    const result = await handlers.create(createLandingSchema.parse(base), { tenantId, slug: "demo", session });
    assert.equal(result.status, error instanceof SiteSettingsError ? 409 : 400); assert.equal(result.error, error.message);
  }
});
