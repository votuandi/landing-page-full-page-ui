import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { sectionRegistry } from "@solar/sections";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant } from "../repository.ts";
import { saveDraft, publishPage, restorePageVersion, restoreSnapshotSchema, RevisionConflictError, StructureError } from "../publish.ts";

const hero = { id: "hero", type: "hero", variant: "t15", enabled: true };
const faq = { id: "faq", type: "faq", variant: "t15", enabled: true };
const heroData = (label: string) => ({ ...sectionRegistry.types.hero.defaults,
  title: { ...sectionRegistry.types.hero.defaults.title, highlight: { vi: label } } });
async function restoreFixture(t: import("node:test").TestContext) {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  t.after(async () => {
    try { await ops.tenant.deleteMany({ where: { id: tenantId } }); }
    finally { await Promise.all([db.$disconnect(), ops.$disconnect()]); }
  });
  await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId: "premium", status: "active" } });
  const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
  const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU]", email: "owner@test.vn", role: "owner" });
  const page = await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [] });
  await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
  const actor = { siteUserId: user.id };
  let revision = 0;
  const save = async (sections = [hero, faq], label = "V1") => {
    const result = await saveDraft(db, tenantId, { pageId: page.id, actor, expectedRevision: revision, draftSections: sections,
      sections: sections.map(s => ({ sectionId: s.id, type: s.type, draftData: s.type === "hero"
        ? heroData(label) : sectionRegistry.getType(s.type)!.defaults })) });
    revision = result.revision; return result;
  };
  const publish = async () => {
    const result = await publishPage(db, tenantId, { pageId: page.id, actor, expectedRevision: revision });
    revision = result.revision; return result;
  };
  const restore = async (versionId: string, expectedRevision = revision) => {
    const result = await restorePageVersion(db, tenantId, { pageId: page.id, versionId, expectedRevision, actor });
    revision = result.revision; return result;
  };
  return { db, ops, tenantId, repo, site, page, actor, save, publish, restore };
}
const integration = { skip: !process.env.DATABASE_URL };
test("restore phiên bản 3 lần trước tái tạo đúng trang", integration, async t => {
  const f = await restoreFixture(t);
  await f.save(); const v1 = await f.publish(), snapshot = (await f.repo.pageVersion.get(v1.versionId))!.snapshot;
  await f.save([hero, faq], "V2"); await f.publish();
  await f.save([hero], "V3"); await f.publish();
  assert.ok((await f.repo.sectionContent.first({ where: { pageId: f.page.id, sectionId: "faq" } }))?.removedAt);
  await f.save([hero, { ...faq, id: "faq-new" }], "V4"); await f.publish();
  const published = (await f.repo.page.get(f.page.id))!.sections;
  await f.restore(v1.versionId);
  assert.deepEqual((await f.repo.page.get(f.page.id))!.sections, published, "restore only writes drafts");
  assert.equal(await f.repo.pageVersion.count({ where: { pageId: f.page.id } }), 4);
  assert.equal((await f.repo.sectionContent.first({ where: { pageId: f.page.id, sectionId: "faq" } }))!.removedAt, null);
  const restored = await f.publish();
  assert.deepEqual((await f.repo.page.get(f.page.id))!.sections, restoreSnapshotSchema.parse(snapshot).sections);
  assert.deepEqual((await f.repo.pageVersion.get(restored.versionId))!.snapshot, snapshot);
  assert.ok((await f.repo.sectionContent.first({ where: { pageId: f.page.id, sectionId: "faq-new" } }))!.removedAt);
});
test("hai lần lưu cùng revision: lần sau bị chặn", integration, async t => {
  const f = await restoreFixture(t);
  await f.save([hero], "A");
  await assert.rejects(saveDraft(f.db, f.tenantId, { pageId: f.page.id, actor: f.actor, expectedRevision: 0,
    sections: [{ sectionId: "hero", type: "hero", draftData: heroData("B") }] }), RevisionConflictError);
  assert.deepEqual((await f.repo.sectionContent.first({ where: { pageId: f.page.id } }))!.draftData, heroData("A"));
});
test("restore revision cũ bị chặn", integration, async t => {
  const f = await restoreFixture(t); await f.save(); const v = await f.publish();
  const before = await f.repo.page.get(f.page.id), contents = await f.repo.sectionContent.list({ where: { pageId: f.page.id } });
  await assert.rejects(f.restore(v.versionId, 0), RevisionConflictError);
  assert.deepEqual(await f.repo.page.get(f.page.id), before);
  assert.deepEqual(await f.repo.sectionContent.list({ where: { pageId: f.page.id } }), contents);
});
test("restore version trang khác bị từ chối", integration, async t => {
  const f = await restoreFixture(t); await f.save(); const v = await f.publish();
  const other = await f.repo.page.create({ siteId: f.site.id, slug: "khac", sections: [] });
  for (const [tenantId, pageId] of [[f.tenantId, other.id], [randomUUID(), f.page.id]]) {
    await assert.rejects(restorePageVersion(f.db, tenantId, { pageId, actor: f.actor, versionId: v.versionId, expectedRevision: 0 }),
      { name: "StructureError", message: "Không tìm thấy phiên bản" });
  }
  assert.equal((await f.repo.page.get(other.id))!.revision, 0);
  assert.equal((await f.repo.page.get(f.page.id))!.revision, v.revision);
});
test("restore vượt gói bị chặn", integration, async t => {
  const f = await restoreFixture(t), calculator = { id: "calculator", type: "calculator", variant: "t15", enabled: true };
  await f.save([hero, calculator]); const v = await f.publish();
  await f.save([hero]); await f.publish();
  await f.ops.tenant.update({ where: { id: f.tenantId }, data: { planId: "basic" } });
  const before = await f.repo.page.get(f.page.id);
  await assert.rejects(f.restore(v.versionId), StructureError);
  assert.deepEqual(await f.repo.page.get(f.page.id), before);
});
test("restore snapshot schema cũ được migrate", integration, async t => {
  const f = await restoreFixture(t); await f.save([hero]); const v = await f.publish();
  const version = (await f.repo.pageVersion.get(v.versionId))!;
  const snapshot = version.snapshot as { sections: typeof hero[]; contents: { sectionId: string; type: string; schemaVersion: number; data: object }[] };
  snapshot.contents[0].schemaVersion = 1;
  await f.repo.pageVersion.update(v.versionId, { snapshot });
  await f.restore(v.versionId);
  assert.deepEqual((await f.repo.sectionContent.first({ where: { pageId: f.page.id } }))!.draftData,
    sectionRegistry.types.hero.schema.parse(snapshot.contents[0].data));
});
test("restore tạo lại content đã dọn", integration, async t => {
  const f = await restoreFixture(t); await f.save([hero]); const v = await f.publish();
  await f.repo.sectionContent.delete((await f.repo.sectionContent.first({ where: { pageId: f.page.id } }))!.id);
  await f.restore(v.versionId);
  const row = (await f.repo.sectionContent.first({ where: { pageId: f.page.id } }))!;
  assert.equal(row.schemaVersion, sectionRegistry.types.hero.schemaVersion);
  assert.deepEqual(row.draftData, heroData("V1"));
});
test("restore type lệch bị chặn", integration, async t => {
  const f = await restoreFixture(t); await f.save([hero]); const v = await f.publish();
  await f.repo.sectionContent.delete((await f.repo.sectionContent.first({ where: { pageId: f.page.id } }))!.id);
  await f.repo.sectionContent.create({ siteId: f.site.id, pageId: f.page.id, sectionId: "hero", type: "faq", data: sectionRegistry.types.faq.defaults });
  const before = await f.repo.page.get(f.page.id);
  await assert.rejects(f.restore(v.versionId), StructureError);
  assert.deepEqual(await f.repo.page.get(f.page.id), before);
});
test("restore bản mới nhất là round-trip", integration, async t => {
  const f = await restoreFixture(t); await f.save(); const v = await f.publish();
  await f.restore(v.versionId); const next = await f.publish();
  assert.deepEqual((await f.repo.pageVersion.get(next.versionId))!.snapshot, (await f.repo.pageVersion.get(v.versionId))!.snapshot);
});
test("restore thiếu content dùng defaults và chặn row schema cũ, snapshot hỏng", integration, async t => {
  const f = await restoreFixture(t); await f.save([hero]); const v = await f.publish();
  const row = (await f.repo.sectionContent.first({ where: { pageId: f.page.id } }))!;
  await f.repo.pageVersion.update(v.versionId, { snapshot: { sections: [hero], contents: [] } });
  await f.restore(v.versionId);
  assert.deepEqual((await f.repo.sectionContent.get(row.id))!.draftData, sectionRegistry.types.hero.defaults);
  await f.ops.sectionContent.update({ where: { id: row.id }, data: { schemaVersion: 1 } });
  await assert.rejects(f.restore(v.versionId), /Nội dung cần cập nhật phiên bản trước khi khôi phục/);
  await f.repo.pageVersion.update(v.versionId, { snapshot: { sections: [hero], contents: [{ sectionId: "hero", type: "hero", schemaVersion: 1, data: { title: 123 } }] } });
  await assert.rejects(f.restore(v.versionId), /Phiên bản có nội dung không còn hợp lệ, không thể khôi phục/);
});

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
