import assert from "node:assert/strict";
import { test } from "node:test";
import { effectivePermissions, ForbiddenError, type Session } from "@solar/auth";
import { RevisionConflictError, StructureError, type DraftInput } from "@solar/db";
import { validateSiteStructure } from "@solar/presets";
import { sectionRegistry } from "@solar/sections";
import { createAction } from "../lib/action.ts";
import { createPageSectionHandlers, loadPageEditor, loadSectionContent, saveContentSchema, saveSectionsSchema, pageRevisionSchema, pageIdSchema, type PageSectionsDeps } from "../lib/pageSections.ts";

const tenantId = "e7000000-0000-4000-8000-000000000001", siteId = "e7000000-0000-4000-8000-000000000002", pageId = "e7000000-0000-4000-8000-000000000003";
const hero = { id: "hero", type: "hero", variant: "t12", enabled: true };
const session = (role: "owner" | "viewer" = "owner"): Session => ({ id: "session", accountId: "e7000000-0000-4000-8000-000000000004", tenantId, realm: "site", audience: "admin", kind: "user", role,
  permissions: effectivePermissions({ role, audience: "admin" }), expiresAt: new Date(Date.now() + 10000), mustChangePassword: false });
function setup(options: { role?: "owner" | "viewer"; foreign?: boolean; can?: (f: string) => boolean; conflict?: boolean; ghost?: boolean } = {}) {
  let reads = 0;
  const writes: DraftInput[] = [];
  const current = { ...session(options.role), ...(options.ghost ? { kind: "ghost" as const, accountId: undefined } : {}) };
  const can = options.can ?? (() => true);
  const page = { id: pageId, siteId: options.foreign ? "foreign" : siteId, slug: "", title: { vi: "Trang chủ" }, revision: 2, sections: [hero], draftSections: null, hasDraft: false };
  const deps: PageSectionsDeps = {
    tenant: async () => { reads++; return { tenantId, siteId, slug: "mau" }; },
    page: async () => { reads++; return page; },
    entitlements: async () => can,
    contents: async () => [{ sectionId: "hero", type: "hero" }],
    content: async () => null,
    actor: async s => { if (!s.accountId) return null; return { siteUserId: s.accountId }; },
    save: async (_tenant, input) => {
      if (options.conflict) throw new RevisionConflictError(3);
      if (!input.draftSections) { writes.push(input); return { revision: 3 }; }
      const structure = { pageTypes: ["home", "contact", "policy"], pages: [{ slug: "", sections: input.draftSections as typeof hero[] }, { slug: "lien-he", sections: [] }] };
      const baseline = { ...structure, pages: [{ slug: "", sections: [hero] }, { slug: "lien-he", sections: [] }] };
      const issues = validateSiteStructure(structure, { can, baseline, pagesLimit: Infinity });
      if (issues.length) throw new StructureError(issues.join("; "));
      writes.push(input); return { revision: 3 };
    },
    publish: async () => { if (options.conflict) throw new RevisionConflictError(3); return { revision: 3 }; },
    preview: async () => "https://mau.preview.solar.vn/api/preview?token=test&path=%2F",
  };
  const action = createAction(async () => ({ tenantId, slug: "mau", session: current }));
  const h = createPageSectionHandlers(deps);
  const actions = { save: action("pages.structure", saveSectionsSchema, h.save), publish: action("pages.publish", pageRevisionSchema, h.publish), preview: action("pages.view", pageIdSchema, h.preview) };
  const form = (sections: unknown = [{ ...hero, variant: "t15" }]) => {
    const f = new FormData(); f.set("pageId", pageId); f.set("revision", "2"); f.set("sections", typeof sections === "string" ? sections : JSON.stringify(sections)); return f;
  };
  const load = () => loadPageEditor(pageId, { ...deps, requirePermission: async () => current });
  return { actions, deps, form, writes, reads: () => reads, load };
}

function contentSetup(options: Parameters<typeof setup>[0] = {}) {
  const s = setup(options), current = session(options.role);
  const action = createAction(async () => ({ tenantId, slug: "mau", session: { ...current, ...(options.ghost ? { accountId: undefined, kind: "ghost" as const } : {}) } }));
  const save = action("content.edit", saveContentSchema, createPageSectionHandlers(s.deps).saveContent);
  return { ...s, save: (value: unknown = sectionRegistry.types.hero.defaults, sectionId = "hero") => {
    const f = s.form(); f.set("sectionId", sectionId); f.set("data", typeof value === "string" ? value : JSON.stringify(value)); return save({}, f);
  }, loadContent: (sectionId = "hero") => loadSectionContent(pageId, sectionId, { ...s.deps, requirePermission: async permission => {
    if (!current.permissions.has(permission)) throw new ForbiddenError(); return current;
  } }) };
}
test("content requires content.edit", async () => {
  const s = contentSetup({ role: "viewer" });
  await assert.rejects(s.loadContent(), ForbiddenError); assert.equal((await s.save()).status, 403); assert.equal(s.reads(), 0);
});
test("rejects foreign page and unknown section", async () => {
  for (const s of [contentSetup({ foreign: true }), contentSetup()]) {
    const id = "unknown";
    assert.equal(await s.loadContent(id), null); assert.equal((await s.save(undefined, id)).status, 404); assert.equal(s.writes.length, 0);
  }
  const foreign = contentSetup({ foreign: true }); assert.equal(await foreign.loadContent(), null); assert.equal((await foreign.save()).status, 404);
});
test("rejects section outside plan", async () => {
  const s = contentSetup({ can: () => false });
  const original = s.deps.page; s.deps.page = async (...args) => ({ ...(await original(...args))!, sections: [{ id: "hero", type: "calculator", variant: "t15", enabled: true }] });
  assert.equal(await s.loadContent(), null); assert.equal((await s.save()).status, 403); assert.equal(s.writes.length, 0);
});
test("rejects invalid content", async () => {
  const s = contentSetup();
  for (const value of ["{", "null", "{}", { ...sectionRegistry.types.hero.defaults, title: 123 }, "a".repeat(500001)]) assert.equal((await s.save(value)).status, 400);
  assert.equal(s.writes.length, 0);
});
test("content conflict returns 409", async () => { const s = contentSetup({ conflict: true }); assert.equal((await s.save()).status, 409); assert.equal(s.writes.length, 0); });
test("loads draft content first", async () => {
  const s = contentSetup(), def = sectionRegistry.types.hero;
  assert.deepEqual((await s.loadContent())?.data, def.defaults);
  const draft = { ...def.defaults, badge: { vi: "[DỮ LIỆU MẪU] Nháp" } };
  s.deps.content = async () => ({ type: "hero", schemaVersion: def.schemaVersion, data: def.defaults, draftData: draft });
  assert.deepEqual((await s.loadContent())?.data, def.schema.parse(draft));
  s.deps.content = async () => ({ type: "hero", schemaVersion: def.schemaVersion, data: {}, draftData: null });
  assert.equal((await s.loadContent())?.recovered, true); assert.deepEqual((await s.loadContent())?.data, def.defaults);
});
test("old schemaVersion is read-only", async () => {
  const s = contentSetup(), def = sectionRegistry.types.hero;
  s.deps.content = async () => ({ type: "hero", schemaVersion: def.schemaVersion - 1, data: def.defaults, draftData: null });
  assert.match((await s.loadContent())?.readOnly ?? "", /cập nhật phiên bản/); assert.equal((await s.save()).status, 409); assert.equal(s.writes.length, 0);
});
test("ghost cannot save content", async () => { const s = contentSetup({ ghost: true }); assert.equal((await s.save()).status, 403); assert.equal(s.writes.length, 0); });
test("content saves parsed draft only and returns revision", async () => {
  const s = contentSetup(); assert.deepEqual(await s.save(), { ok: true, revision: 3 });
  assert.deepEqual(s.writes[0].sections, [{ sectionId: "hero", type: "hero", draftData: sectionRegistry.types.hero.defaults }]); assert.equal(s.writes[0].draftSections, undefined);
});
test("save requires pages.structure", async () => {
  const s = setup({ role: "viewer" }); assert.equal((await s.actions.save({}, s.form())).status, 403); assert.equal(s.reads(), 0);
  const editor = await s.load(); assert.deepEqual(editor?.can, { reorder: false, variantSwitch: false }); assert.equal(editor?.canPublish, false);
});
test("publish requires pages.publish and preview requires pages.view before reading page", async () => {
  const s = setup({ role: "viewer" });
  assert.equal((await s.actions.publish({}, s.form())).status, 403); assert.equal(s.reads(), 0);
  const action = createAction(async () => ({ tenantId, slug: "mau", session: { ...session(), permissions: new Set() } }));
  const preview = action("pages.view", pageIdSchema, createPageSectionHandlers(s.deps).preview);
  assert.equal((await preview({}, s.form())).status, 403); assert.equal(s.reads(), 0);
});
test("rejects page of another site", async () => {
  const s = setup({ foreign: true }); assert.equal(await s.load(), null);
  for (const a of Object.values(s.actions)) assert.equal((await a({}, s.form())).status, 404);
  assert.equal(s.writes.length, 0);
});
test("conflict returns 409", async () => {
  const s = setup({ conflict: true });
  for (const a of [s.actions.save, s.actions.publish]) assert.deepEqual(await a({}, s.form()), { ok: false, status: 409, error: "Trang đã thay đổi. Tải lại trước khi lưu." });
  assert.equal(s.writes.length, 0);
});
test("structure change rejected by plan", async () => {
  const s = setup({ can: f => !["sectionReorder", "variantSwitch"].includes(f) });
  const result = await s.actions.save({}, s.form([{ ...hero, enabled: false }]));
  assert.equal(result.status, 400); assert.match(result.error!, /Gói không/); assert.equal(s.writes.length, 0);
  assert.deepEqual((await s.load())?.can, { reorder: false, variantSwitch: false });
});
test("maxPerPage overflow returns 400", async () => {
  const s = setup(); const result = await s.actions.save({}, s.form([hero, ...[1, 2].map(i => ({ id: `calc-${i}`, type: "calculator", variant: "t15", enabled: i === 1 }))]));
  assert.equal(result.status, 400); assert.match(result.error!, /Chỉ được có tối đa 1 "Dự toán chi phí"/); assert.equal(s.writes.length, 0);
});
test("StructureError returns 400 for save and publish without matching message prefixes", async () => {
  const s = setup();
  const message = 'Cấu trúc trang không hợp lệ; Chỉ được có tối đa 1 "Dự toán chi phí" trên một trang (trang /)';
  s.deps.save = s.deps.publish = async () => { throw new StructureError(message); };
  for (const action of [s.actions.save, s.actions.publish]) {
    assert.deepEqual(await action({}, s.form()), { ok: false, status: 400, error: message });
  }
});

test("ordinary Error returns generic 500 even with a structure message prefix", async () => {
  const s = setup();
  for (const message of ["Gói không cho truy cập thông tin nội bộ", "sensitive internal database error"]) {
    s.deps.save = s.deps.publish = async () => { throw new Error(message); };
    for (const action of [s.actions.save, s.actions.publish]) {
      assert.deepEqual(await action({}, s.form()), { ok: false, status: 500, error: "Không thể thực hiện lúc này. Vui lòng thử lại." });
    }
  }
});

test("rejects malformed sections", async () => {
  for (const value of ["{", "null", "{}", [{ ...hero }, { ...hero }], [{ ...hero, anchor: "bad anchor" }], [{ ...hero, data: { vi: "injected" } }], [{ ...hero, enabled: "yes" }]]) {
    const s = setup(); const result = await s.actions.save({}, s.form(value));
    assert.equal(result.status, 400); assert.equal(result.error, "Dữ liệu không hợp lệ"); assert.equal(s.writes.length, 0);
  }
});
test("unknown variant rejected", async () => {
  const s = setup(); const result = await s.actions.save({}, s.form([{ ...hero, variant: "ghost" }]));
  assert.equal(result.status, 400); assert.match(result.error!, /Kiểu hiển thị không tồn tại/); assert.equal(s.writes.length, 0);
});
test("saving variant keeps content; adding uses defaults only for absent content", async () => {
  const s = setup(); assert.equal((await s.actions.save({}, s.form())).ok, true);
  assert.deepEqual(s.writes[0].sections, []);
  await s.actions.save({}, s.form([hero, { id: "new", type: "projects", variant: "t15", enabled: true }]));
  assert.deepEqual(s.writes[1].sections, [{ sectionId: "new", type: "projects", draftData: sectionRegistry.types.projects.defaults }]);
  s.deps.contents = async () => [{ sectionId: "hero", type: "hero" }, { sectionId: "new", type: "projects" }];
  await s.actions.save({}, s.form([hero, { id: "new", type: "projects", variant: "t15", enabled: true }]));
  assert.deepEqual(s.writes[2].sections, []);
});
test("existing section type cannot change and unexpected storage errors remain generic", async () => {
  const s = setup();
  const result = await s.actions.save({}, s.form([{ ...hero, type: "projects", variant: "t15" }]));
  assert.equal(result.status, 400); assert.equal(s.writes.length, 0);
  s.deps.save = async () => { throw new Error("sensitive internal database error"); };
  const failed = await s.actions.save({}, s.form());
  assert.equal(failed.status, 500); assert.doesNotMatch(failed.error!, /sensitive|database/);
});
test("ghost without actor cannot write; preview still works", async () => {
  const s = setup({ ghost: true });
  assert.equal((await s.actions.save({}, s.form())).status, 403);
  assert.equal((await s.actions.publish({}, s.form())).status, 403);
  assert.equal((await s.actions.preview({}, s.form())).ok, true);
});
