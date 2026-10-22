import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { sectionRegistry } from "@solar/sections";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant } from "../repository.ts";
import { saveDraft, publishPage, RevisionConflictError } from "../publish.ts";

test("publication locks the page revision, snapshots content and enqueues invalidation atomically", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 });
  const tenantId = randomUUID(), plan = `publish-${tenantId}`;
  try {
    await ops.plan.create({ data: { id: plan, name: "Test", features: [], limits: {} } });
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "Test", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId);
    const site = await repo.site.create({ name: "Test", themeId: "t15" });
    const user = await repo.siteUser.create({ name: "Owner", email: "owner@test.vn", role: "owner" });
    const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [] });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    const actor = { siteUserId: user.id };
    const descriptor = { id: "hero", type: "hero", variant: "t15", enabled: true };
    const draftData = sectionRegistry.types.hero.defaults;
    const input = { pageId: page.id, expectedRevision: 0, draftSections: [descriptor], sections: [{ sectionId: "hero", type: "hero", draftData }], actor };
    const saves = await Promise.allSettled([saveDraft(db, tenantId, input), saveDraft(db, tenantId, input)]);
    assert.equal(saves.filter(r => r.status === "fulfilled").length, 1, saves.map(r => r.status === "rejected" ? String(r.reason) : "saved").join("; "));
    const conflict = saves.find(r => r.status === "rejected");
    assert.ok(conflict?.status === "rejected" && conflict.reason instanceof RevisionConflictError);
    assert.equal(conflict.reason.currentRevision, 1);
    assert.equal((await repo.page.get(page.id))?.publishedAt, null);
    assert.equal(await repo.outbox.count(), 0);
    const result = await publishPage(db, tenantId, { pageId: page.id, expectedRevision: 1, actor });
    assert.equal(result.revision, 2);
    const version = await repo.pageVersion.get(result.versionId);
    assert.equal(version?.publishedBySiteUserId, user.id);
    assert.deepEqual(version?.snapshot, { sections: [descriptor], contents: [{ sectionId: "hero", type: "hero", schemaVersion: sectionRegistry.types.hero.schemaVersion, data: draftData }] });
    assert.equal((await repo.page.get(page.id))?.draftSections, null);
    assert.equal((await repo.sectionContent.first())?.draftData, null);
    const jobs = await repo.outbox.list();
    assert.equal(jobs.length, 1);
    assert.match(JSON.stringify(jobs[0].payload), new RegExp(`tenant:${tenantId}:page:`));
    assert.match(JSON.stringify(jobs[0].payload), new RegExp(`tenant:${tenantId}:site`));
    await assert.rejects(publishPage(db, tenantId, { pageId: page.id, expectedRevision: 1, actor }), RevisionConflictError);
    assert.equal(await repo.pageVersion.count(), 1);
    assert.equal(await repo.outbox.count(), 1);
    await assert.rejects(saveDraft(db, tenantId, { ...input, expectedRevision: 2, sections: [{ sectionId: "hero", type: "hero", draftData: { title: 123 } }] }));
    assert.equal((await repo.page.get(page.id))?.revision, 2, "invalid content rolls back the revision lock");
    await assert.rejects(publishPage(db, tenantId, { pageId: page.id, expectedRevision: 2, actor: { siteUserId: randomUUID() } }));
    assert.equal((await repo.page.get(page.id))?.revision, 2, "failed snapshot rolls back publication");
    assert.equal(await repo.outbox.count(), 1);
    await assert.rejects(saveDraft(db, randomUUID(), input));
    await assert.rejects(saveDraft(db, tenantId, { ...input, expectedRevision: 2,
      draftSections: [{ ...descriptor, variant: "missing" }] }), /variant/);
    await assert.rejects(saveDraft(db, tenantId, { ...input, expectedRevision: 2, draftSections: undefined,
      sections: [{ sectionId: "hero", type: "blog", draftData: sectionRegistry.types.blog.defaults }] }), /immutable/);
    await ops.tenant.update({ where: { id: tenantId }, data: { planId: "basic" } });
    await assert.rejects(saveDraft(db, tenantId, { ...input, expectedRevision: 2, draftSections: [], sections: [] }), /section/);
    assert.equal((await repo.page.get(page.id))?.revision, 2, "structure/variant/type checks roll back the lock");
    await ops.tenant.update({ where: { id: tenantId }, data: { planId: "premium" } });
    const invalid = await repo.page.create({ siteId: site.id, slug: "invalid slug", sections: [] });
    await assert.rejects(publishPage(db, tenantId, { pageId: invalid.id, expectedRevision: 0, actor }), /tag/i);
    assert.equal((await repo.page.get(invalid.id))?.revision, 0, "outbox validation failure rolls back publication and version");
    assert.equal(await repo.pageVersion.count(), 1);
    assert.equal(await repo.outbox.count(), 1);
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await ops.plan.deleteMany({ where: { id: plan } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});

test("lockedByPlan: hạ gói vẫn lưu/xuất bản, xóa không mất nội dung và nâng lại giữ dữ liệu", { skip: !process.env.DATABASE_URL }, async () => {
  const db = createDb({ pool: 2 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU]", email: "owner@test.vn", role: "owner" }), actor = { siteUserId: user.id };
    const shorts = { id: "shorts", type: "shorts", variant: "t15", enabled: true }, hero = { id: "hero", type: "hero", variant: "t15", enabled: true };
    const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [shorts, hero], publishedAt: new Date() });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    const content = await repo.sectionContent.create({ siteId: site.id, pageId: page.id, sectionId: "shorts", type: "shorts", data: sectionRegistry.types.shorts.defaults });
    await ops.tenant.update({ where: { id: tenantId }, data: { planId: "pro" } });
    await saveDraft(db, tenantId, { pageId: page.id, expectedRevision: 0, actor, draftSections: [hero, shorts] });
    await publishPage(db, tenantId, { pageId: page.id, expectedRevision: 1, actor });
    assert.deepEqual((await repo.page.get(page.id))?.sections, [hero, shorts]);
    assert.deepEqual((await repo.sectionContent.get(content.id))?.data, content.data);
    await assert.rejects(saveDraft(db, tenantId, { pageId: page.id, expectedRevision: 2, actor, draftSections: [hero, { ...shorts, enabled: false }] }), /Section ngoài gói: shorts/);
    await saveDraft(db, tenantId, { pageId: page.id, expectedRevision: 2, actor, draftSections: [hero] });
    await publishPage(db, tenantId, { pageId: page.id, expectedRevision: 3, actor });
    assert.deepEqual((await repo.sectionContent.get(content.id))?.data, content.data);
    await ops.tenant.update({ where: { id: tenantId }, data: { planId: "premium" } });
    await saveDraft(db, tenantId, { pageId: page.id, expectedRevision: 4, actor, draftSections: [hero, shorts] });
    await publishPage(db, tenantId, { pageId: page.id, expectedRevision: 5, actor });
    assert.deepEqual((await repo.sectionContent.get(content.id))?.data, content.data);
    assert.deepEqual((await repo.page.get(page.id))?.sections, [hero, shorts]);
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
});
