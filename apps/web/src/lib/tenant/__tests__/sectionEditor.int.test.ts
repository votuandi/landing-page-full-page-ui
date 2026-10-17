import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { createDb, createPlatformDb, forTenant, saveDraft, publishPage, withTenantTransaction } from "@solar/db";
import { sectionRegistry } from "@solar/sections";
import { createSiteData } from "../siteData";

async function fixture(work: (ctx: {
  db: ReturnType<typeof createDb>; repo: ReturnType<typeof forTenant>; tenantId: string; siteId: string; pageId: string;
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
    await work({ db, repo, tenantId, siteId: site.id, pageId: page.id, actor, data });
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
}
const options = { skip: !process.env.DATABASE_URL };
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
  assert.deepEqual(await repo.sectionContent.get(added!.id), added);
}));
