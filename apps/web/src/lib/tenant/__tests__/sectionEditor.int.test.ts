import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createDb, createPlatformDb, forTenant, saveDraft, publishPage, withTenantTransaction, StructureError } from "@solar/db";
import { sectionRegistry } from "@solar/sections";
import { createSiteData } from "../siteData";
import { createAction, type ActionContext } from "../../../../../admin/src/lib/action.ts";
import { createPageSectionHandlers, pageRevisionSchema } from "../../../../../admin/src/lib/pageSections.ts";

async function fixture(work: (ctx: {
  db: ReturnType<typeof createDb>; ops: ReturnType<typeof createPlatformDb>; repo: ReturnType<typeof forTenant>; tenantId: string; siteId: string; pageId: string;
  actor: { siteUserId: string }; data: ReturnType<typeof createSiteData>;
}) => Promise<void>) {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU] Section editor", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId);
    const site = await repo.site.create({ name: "[DỮ LIỆU MẪU] Section editor", themeId: "t15" });
    const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [] });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU] Owner", email: "owner@test.vn", role: "owner" });
    const actor = { siteUserId: user.id };
    const section = { id: "hero", type: "hero", variant: "t12", enabled: true };
    await saveDraft(db, tenantId, { pageId: page.id, expectedRevision: 0, actor, draftSections: [section],
      sections: [{ sectionId: "hero", type: "hero", draftData: { ...sectionRegistry.types.hero.defaults, eyebrow: { vi: "[DỮ LIỆU MẪU] Nội dung riêng", en: "Custom content" } } }] });
    await publishPage(db, tenantId, { pageId: page.id, expectedRevision: 1, actor });
    const data = createSiteData(id => forTenant(db, id), undefined, undefined,
      (id, task) => withTenantTransaction(db, id, task, { isolationLevel: "RepeatableRead" }));
    await work({ db, ops, repo, tenantId, siteId: site.id, pageId: page.id, actor, data });
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
}
const options = { skip: !process.env.DATABASE_URL };

test("new section content records the current schemaVersion so it remains editable", options, async () => fixture(async ({ repo, pageId }) => {
  const row = await repo.sectionContent.first({ where: { pageId, sectionId: "hero" } });
  assert.equal(row?.schemaVersion, sectionRegistry.types.hero.schemaVersion);
}));

test("content save writes draftData only", options, async () => fixture(async ({ db, repo, tenantId, siteId, pageId, actor, data }) => {
  const before = await repo.sectionContent.first({ where: { pageId, sectionId: "hero" } }), jobs = await repo.outbox.count();
  const next = { ...sectionRegistry.types.hero.defaults, badge: { vi: "[DỮ LIỆU MẪU] Nháp mới" } };
  await saveDraft(db, tenantId, { pageId, expectedRevision: 2, actor, sections: [{ sectionId: "hero", type: "hero", draftData: next }] });
  const after = await repo.sectionContent.first({ where: { pageId, sectionId: "hero" } });
  assert.deepEqual(after?.data, before?.data); assert.deepEqual(after?.draftData, next);
  assert.equal(await repo.outbox.count(), jobs);
  assert.deepEqual((await data.loadPublishedPage(tenantId, siteId, ""))?.config.sections[0].data, before?.data);
  assert.deepEqual((await data.loadDraftPage(tenantId, siteId, ""))?.config.sections[0].data, next);
}));

test("saveDraft rejects a second calculator with StructureError and rolls back", options, async () => fixture(async ({ db, repo, tenantId, pageId, actor }) => {
  const hero = { id: "hero", type: "hero", variant: "t12", enabled: true };
  const calculator = { id: "calculator", type: "calculator", variant: "t15", enabled: true };
  await saveDraft(db, tenantId, { pageId, expectedRevision: 2, actor, draftSections: [hero, calculator] });
  const before = await repo.page.get(pageId);
  await assert.rejects(saveDraft(db, tenantId, { pageId, expectedRevision: 3, actor,
    draftSections: [hero, calculator, { ...calculator, id: "calculator-2", enabled: false }] }), error => {
    assert.ok(error instanceof Error);
    assert.equal(error.name, "StructureError");
    assert.ok(error instanceof StructureError);
    assert.equal(error.message, 'Chỉ được có tối đa 1 "Dự toán chi phí" trên một trang (trang /)');
    return true;
  });
  assert.deepEqual(await repo.page.get(pageId), before);
}));

test("saveDraft rejects reorder without sectionReorder with StructureError and rolls back", options, async () => fixture(async ({ db, ops, repo, tenantId, pageId, actor }) => {
  const sections = [{ id: "hero", type: "hero", variant: "t12", enabled: true }, { id: "projects", type: "projects", variant: "t15", enabled: true }];
  await repo.page.update(pageId, { sections });
  await ops.tenant.update({ where: { id: tenantId }, data: { planId: "basic" } });
  const before = await repo.page.get(pageId);
  await assert.rejects(saveDraft(db, tenantId, { pageId, expectedRevision: 2, actor, draftSections: [...sections].reverse() }), error => {
    assert.ok(error instanceof Error);
    assert.equal(error.name, "StructureError");
    assert.ok(error instanceof StructureError);
    assert.equal(error.message, "Gói không cho thêm, bớt, bật/tắt hoặc sắp xếp section: /");
    return true;
  });
  assert.deepEqual(await repo.page.get(pageId), before);
}));

test("publish action rejects legacy overflow with 400 and keeps publication unchanged", options, async () => fixture(async ({ db, repo, tenantId, siteId, pageId, actor }) => {
  const sections = [1, 2].map(i => ({ id: `calculator-${i}`, type: "calculator", variant: "t15", enabled: true }));
  // Legacy data predates the limit; publishing must still validate the whole site.
  await repo.page.update(pageId, { sections });
  const before = await repo.page.get(pageId), versions = await repo.pageVersion.count(), jobs = await repo.outbox.count();
  const context: ActionContext = { tenantId, slug: tenantId, session: { id: "test", accountId: actor.siteUserId, tenantId,
    realm: "site", audience: "admin", kind: "user", role: "owner", permissions: new Set(["pages.publish"]),
    expiresAt: new Date(Date.now() + 60_000), mustChangePassword: false } };
  const handlers = createPageSectionHandlers({
    theme: async () => "t15", removed: async () => [],
    tenant: async () => ({ tenantId, siteId, slug: tenantId }),
    page: async () => { const page = await repo.page.get(pageId); return page ? { ...page, hasDraft: false } : null; },
    actor: async () => actor,
    publish: (id, input) => publishPage(db, id, input),
    save: async () => { throw new Error("Unexpected save"); },
    contents: async () => [], content: async () => null, entitlements: async () => () => true, preview: async () => "",
  });
  const publish = createAction(async () => context)("pages.publish", pageRevisionSchema, handlers.publish);
  const form = new FormData(); form.set("pageId", pageId); form.set("revision", "2");
  assert.deepEqual(await publish({}, form), { ok: false, status: 400,
    error: 'Chỉ được có tối đa 1 "Dự toán chi phí" trên một trang (trang /)' });
  assert.deepEqual(await repo.page.get(pageId), before);
  assert.equal(await repo.pageVersion.count(), versions);
  assert.equal(await repo.outbox.count(), jobs);
}));
test("variant switch keeps content and only changes draft", options, async () => fixture(async ({ db, repo, tenantId, siteId, pageId, actor, data }) => {
  const before = await repo.sectionContent.first({ where: { pageId, sectionId: "hero" } });
  await saveDraft(db, tenantId, { pageId, expectedRevision: 2, actor, draftSections: [{ id: "hero", type: "hero", variant: "t15", enabled: true }] });
  assert.deepEqual(await repo.sectionContent.first({ where: { pageId, sectionId: "hero" } }), before);
  const draft = await data.loadDraftPage(tenantId, siteId, ""), published = await data.loadPublishedPage(tenantId, siteId, "");
  assert.equal(draft?.config.sections[0].variant, "t15"); assert.equal(published?.config.sections[0].variant, "t12");
  assert.deepEqual(draft?.config.sections[0].data, published?.config.sections[0].data);
  const component = await sectionRegistry.getVariant("hero", draft!.config.sections[0].variant)!.load();
  assert.equal(typeof component.default, "function");
}));
test("draft writes no invalidate, publish enqueues page tag", options, async () => fixture(async ({ db, repo, tenantId, pageId, actor }) => {
  const before = await repo.outbox.count({ where: { topic: "invalidate" } });
  await saveDraft(db, tenantId, { pageId, expectedRevision: 2, actor, draftSections: [{ id: "hero", type: "hero", variant: "t15", enabled: false }] });
  assert.equal(await repo.outbox.count({ where: { topic: "invalidate" } }), before);
  await publishPage(db, tenantId, { pageId, expectedRevision: 3, actor });
  assert.equal(await repo.outbox.count({ where: { topic: "invalidate" } }), before + 1);
  const job = await repo.outbox.first({ where: { topic: "invalidate" }, orderBy: { createdAt: "desc" } });
  assert.ok((job?.payload as { tags: string[] }).tags.includes(`tenant:${tenantId}:page:`));
}));
test("add creates defaults, remove keeps content", options, async () => fixture(async ({ db, repo, tenantId, pageId, actor }) => {
  const draftSections = [{ id: "hero", type: "hero", variant: "t12", enabled: true }, { id: "projects-new", type: "projects", variant: "t15", enabled: true }];
  await saveDraft(db, tenantId, { pageId, expectedRevision: 2, actor, draftSections,
    sections: [{ sectionId: "projects-new", type: "projects", draftData: sectionRegistry.types.projects.defaults }] });
  const added = await repo.sectionContent.first({ where: { pageId, sectionId: "projects-new" } });
  assert.deepEqual(added?.data, sectionRegistry.types.projects.defaults); assert.deepEqual(added?.draftData, added?.data);
  await saveDraft(db, tenantId, { pageId, expectedRevision: 3, actor, draftSections: draftSections.slice(0, 1) });
  const retained = (await repo.sectionContent.get(added!.id))!;
  assert.ok(retained.removedAt instanceof Date);
  assert.deepEqual({ ...retained, removedAt: added!.removedAt, updatedAt: added!.updatedAt }, added);
}));
