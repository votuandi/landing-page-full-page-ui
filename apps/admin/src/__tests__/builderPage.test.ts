import assert from "node:assert/strict";
import test from "node:test";
import { effectivePermissions, ForbiddenError, type Session } from "@solar/auth";
import { sectionRegistry } from "@solar/sections";
import { createAction } from "../lib/action.ts";
import { builderPath, createPageSectionHandlers, loadBuilder, pageIdSchema, type PageSectionsDeps } from "../lib/pageSections.ts";
const tenantId = "e7000000-0000-4000-8000-000000000001", siteId = "e7000000-0000-4000-8000-000000000002", pageId = "e7000000-0000-4000-8000-000000000003";
function setup() {
  const session: Session = { id: "session", accountId: "owner", tenantId, realm: "site", audience: "admin", kind: "user", role: "owner", permissions: effectivePermissions({ role: "owner", audience: "admin" }), expiresAt: new Date(Date.now() + 10000), mustChangePassword: false };
  const hero = { id: "hero", type: "hero", variant: "t12", enabled: true }, calculator = { id: "calculator", type: "calculator", variant: "t15", enabled: false };
  const page = { id: pageId, siteId, slug: "gioi-thieu", title: { vi: "Giới thiệu" }, revision: 2, sections: [hero, calculator], draftSections: null, hasDraft: true };
  let contentReads = 0;
  const paths: string[] = [];
  const deps: PageSectionsDeps = {
    tenant: async () => ({ tenantId, siteId, slug: "mau" }), page: async () => page,
    entitlements: async () => feature => feature !== "calculator", theme: async () => "t12", removed: async () => [], contents: async () => [], content: async () => null,
    contentRows: async () => { contentReads++; return [{ sectionId: "hero", type: "hero", schemaVersion: sectionRegistry.types.hero.schemaVersion, data: {}, draftData: sectionRegistry.types.hero.defaults }]; },
    actor: async () => ({ siteUserId: "owner" }), save: async () => ({ revision: 3 }), publish: async () => ({ revision: 3 }),
    versions: async () => [], restore: async () => ({ revision: 3 }), presence: async () => [],
    preview: async (_tenant, _site, _slug, path) => { paths.push(path); return `https://mau.preview.solar.vn/api/preview?token=test&${new URLSearchParams({ path })}`; },
  };
  const load = () => loadBuilder(pageId, { ...deps, requirePermission: async permission => { if (!session.permissions.has(permission)) throw new ForbiddenError(); return session; } });
  return { deps, page, session, paths, load, contentReads: () => contentReads };
}
test("loadBuilder tạo link preview có builder=1", async () => {
  const s = setup(), result = await s.load();
  assert.equal(new URL(result!.previewUrl).searchParams.get("path"), "/gioi-thieu?builder=1");
  assert.equal(s.contentReads(), 1);
  assert.deepEqual(result!.forms.hero.data, sectionRegistry.types.hero.defaults);
  assert.equal(result!.forms.calculator, undefined); assert.equal(result!.sections.length, 2);
  assert.equal(builderPath("", false), "/?builder=1&reorder=0");
  assert.equal(result!.themeId, "t12");
  assert.equal(result!.themeSupportsDark, true);
  assert.ok(result!.allowedTypes.includes("hero"));
  assert.ok(!result!.allowedTypes.includes("calculator"));
  assert.deepEqual(result!.lockedTypes, ["calculator"]);
});

test("loadBuilder không có quyền cấu trúc vẫn nạp thư viện chỉ xem", async () => {
  for (const noPermission of [true, false]) {
    const s = setup();
    if (noPermission) s.session.permissions = new Set([...s.session.permissions].filter(permission => permission !== "pages.structure"));
    else s.deps.entitlements = async () => feature => feature !== "sectionReorder";
    const result = await s.load();
    assert.equal(result!.canReorder, false);
    assert.ok(result!.allowedTypes.includes("hero"));
    assert.match(s.paths[0], /reorder=0/);
  }
});
test("gói không có builder trả null", async () => {
  const s = setup(); s.deps.entitlements = async () => () => false;
  assert.equal(await s.load(), null); assert.equal(s.contentReads(), 0); assert.equal(s.paths.length, 0);
});
test("trang của site khác trả null", async () => {
  const s = setup(); s.page.siteId = "foreign"; assert.equal(await s.load(), null);
  const action = createAction(async () => ({ tenantId, slug: "mau", session: s.session }));
  const f = new FormData(); f.set("pageId", pageId);
  assert.equal((await action("pages.view", pageIdSchema, createPageSectionHandlers(s.deps).builderPreview)({}, f)).status, 404);
  assert.equal(s.paths.length, 0);
});
test("builderPreview kiểm gói và quyền trước khi tạo link", async () => {
  const s = setup(), f = new FormData(); f.set("pageId", pageId);
  const action = createAction(async () => ({ tenantId, slug: "mau", session: s.session }));
  const preview = action("pages.view", pageIdSchema, createPageSectionHandlers(s.deps).builderPreview);
  s.session.permissions = new Set([...s.session.permissions].filter(permission => permission !== "pages.structure"));
  assert.equal((await preview({}, f)).ok, true); assert.equal(s.paths[0], "/gioi-thieu?builder=1&reorder=0");
  s.deps.entitlements = async () => () => false;
  assert.equal((await preview({}, f)).status, 403);
  s.session.permissions = new Set([...s.session.permissions].filter(permission => permission !== "pages.view")); assert.equal((await preview({}, f)).status, 403);
  await assert.rejects(s.load(), ForbiddenError);
});
