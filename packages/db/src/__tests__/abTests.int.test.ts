import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant } from "../repository.ts";
import { abTestSchema, parseAbTest, saveAbTest, recordAbView, runningAbTest, abTestStats } from "../abTests.ts";
import { savePageSettings } from "../landingPages.ts";
import { StructureError } from "../publish.ts";

const title = { lead: { vi: "B", en: "B English" }, highlight: { vi: "Nổi bật" }, sub: { vi: "" }, subHighlight: { vi: "" } };
const copy = { title, ctaLabel: { vi: "Nhận tư vấn", en: "Contact" } };
const options = { skip: !process.env.DATABASE_URL || !process.env.PLATFORM_DATABASE_URL };
async function fixture(work: (ctx: { db: ReturnType<typeof createDb>; ops: ReturnType<typeof createPlatformDb>; tenantId: string; siteId: string; pageId: string; repo: ReturnType<typeof forTenant> }) => Promise<void>, planId = "premium") {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId, status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t15" });
    const page = await repo.page.create({ siteId: site.id, slug: "uu-dai", kind: "landing", sections: [{ id: "hero", type: "hero", variant: "t15", enabled: true }], publishedAt: new Date() });
    await work({ db, ops, tenantId, siteId: site.id, pageId: page.id, repo });
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
}

test("abTest trang null đọc được; hỏng không lộ nội dung, quá 60 ký tự bị chặn", t => {
  const log = t.mock.method(console, "error", () => {});
  assert.equal(parseAbTest(null), null);
  assert.equal(log.mock.callCount(), 0);
  assert.equal(parseAbTest({ secret: "private-corrupt" }), null);
  assert.equal(log.mock.callCount(), 1);
  assert.doesNotMatch(JSON.stringify(log.mock.calls), /private-corrupt/);
  const raw = { id: randomUUID(), status: "running", ...copy };
  assert.deepEqual(abTestSchema.parse(raw), raw);
  for (const value of [null, {}, { ...raw, title: { ...title, lead: { vi: "a".repeat(61) } } }, { ...raw, ctaLabel: { vi: "a".repeat(81) } }, { ...raw, status: "ended" }, { ...raw, extra: true }]) assert.equal(abTestSchema.safeParse(value).success, false);
});

test("bật A/B, độc lập cài đặt trang, sửa B giữ id, chọn thắng và id mới", options, () => fixture(async ({ db, tenantId, pageId, repo }) => {
  await saveAbTest(db, tenantId, { pageId, action: "start", ...copy });
  const first = parseAbTest((await repo.page.get(pageId))!.abTest)!;
  assert.ok(first); assert.equal(first.status, "running"); assert.deepEqual(first.title, title);
  assert.equal((await repo.outbox.list()).length, 1);
  await savePageSettings(db, tenantId, { pageId, title: { vi: "Trang" }, settings: { hideHeader: true } });
  assert.deepEqual(parseAbTest((await repo.page.get(pageId))!.abTest), first);
  await saveAbTest(db, tenantId, { pageId, action: "start", ...copy, ctaLabel: { vi: "B mới" } });
  assert.equal(parseAbTest((await repo.page.get(pageId))!.abTest)!.id, first.id);
  assert.deepEqual((await repo.page.get(pageId))!.settings, { hideHeader: true });
  for (const winner of ["B", "A"] as const) {
    await saveAbTest(db, tenantId, { pageId, action: "end", winner });
    const ended = parseAbTest((await repo.page.get(pageId))!.abTest)!;
    assert.equal(ended.status, "ended"); assert.equal(ended.winner, winner);
    await saveAbTest(db, tenantId, { pageId, action: "start", ...copy });
    assert.notEqual(parseAbTest((await repo.page.get(pageId))!.abTest)!.id, ended.id);
  }
}));

test("không có hero, hero tắt, trang chủ, catalog, quá 60 ký tự, tenant khác không được bật", options, () => fixture(async ({ db, tenantId, pageId, repo }) => {
  await assert.rejects(saveAbTest(db, randomUUID(), { pageId, action: "start", ...copy }));
  for (const patch of [{ slug: "", kind: "home" as const }, { slug: "lien-he", kind: "system" as const }, { slug: "uu-dai", kind: "landing" as const, draftSections: [] }, { draftSections: [{ id: "hero", type: "hero", variant: "t15", enabled: false }] }]) {
    await repo.page.update(pageId, patch);
    await assert.rejects(saveAbTest(db, tenantId, { pageId, action: "start", ...copy }), StructureError);
  }
  await assert.rejects(saveAbTest(db, tenantId, { pageId, action: "start", ...copy, title: { ...title, lead: { vi: "a".repeat(61) } } }));
}));

// minwy `slides` and t10 `segmentViews` replace the hero title/CTA, so B would never show while views were counted.
test("hero dùng slides hoặc segmentViews không bật được A/B", options, () => fixture(async ({ db, tenantId, siteId, pageId, repo }) => {
  const content = await repo.sectionContent.create({ siteId, pageId, sectionId: "hero", type: "hero", data: {}, draftData: {} });
  await saveAbTest(db, tenantId, { pageId, action: "start", ...copy });
  for (const draftData of [{ slides: [{ title: { vi: "Slide" } }] }, { segmentViews: { label: { vi: "Bạn là" }, items: [] } }]) {
    await repo.sectionContent.update(content.id, { draftData });
    await assert.rejects(saveAbTest(db, tenantId, { pageId, action: "start", ...copy }), /slide hoặc phân khúc/);
  }
  // Ending a test is always allowed.
  await saveAbTest(db, tenantId, { pageId, action: "end", winner: "A" });
}));

test("gói pro và kill switch chặn abTest", options, () => fixture(async ({ db, ops, tenantId, pageId }) => {
  await assert.rejects(saveAbTest(db, tenantId, { pageId, action: "start", ...copy }), StructureError);
  await ops.tenant.update({ where: { id: tenantId }, data: { planId: "premium", featureOverrides: { abTest: { on: false, reason: "Test" } } } });
  await assert.rejects(saveAbTest(db, tenantId, { pageId, action: "start", ...copy }), StructureError);
}, "pro"));

test("hai start song song giữ cùng id; end ngăn lượt xem đến sau", options, () => fixture(async ({ db, tenantId, siteId, pageId, repo }) => {
  const results = await Promise.all(Array.from({ length: 3 }, () => saveAbTest(db, tenantId, { pageId, action: "start", ...copy })));
  assert.equal(new Set(results.map(result => result.abTest.id)).size, 1);
  const id = results[0].abTest.id;
  const outcomes = await Promise.all([
    ...Array.from({ length: 5 }, () => recordAbView(db, tenantId, siteId, id, "B")),
    saveAbTest(db, tenantId, { pageId, action: "end", winner: "B" }).then(() => false),
  ]);
  assert.equal((await abTestStats(db, tenantId, id)).B.views, outcomes.filter(Boolean).length);
  assert.equal(parseAbTest((await repo.page.get(pageId))!.abTest)!.status, "ended");
  assert.equal(await recordAbView(db, tenantId, siteId, id, "B"), false);
}));

test("đếm lượt xem nguyên tử, thống kê bỏ spam, tenant khác/site khác/test ended không đếm", options, () => fixture(async ({ db, tenantId, siteId, pageId, repo }) => {
  await saveAbTest(db, tenantId, { pageId, action: "start", ...copy });
  const ab = parseAbTest((await repo.page.get(pageId))!.abTest)!;
  assert.deepEqual(await runningAbTest(db, tenantId, siteId, "uu-dai"), { id: ab.id });
  assert.equal(await runningAbTest(db, tenantId, siteId, "khac"), null);
  await Promise.all(Array.from({ length: 8 }, () => recordAbView(db, tenantId, siteId, ab.id, "B")));
  await recordAbView(db, tenantId, siteId, ab.id, "A");
  assert.equal(await recordAbView(db, randomUUID(), siteId, ab.id, "B"), false);
  assert.equal(await recordAbView(db, tenantId, randomUUID(), ab.id, "B"), false);
  for (const status of ["new", "spam"] as const) await repo.lead.create({ siteId, source: "contact", phone: "0901234567", data: {}, status, abTestId: ab.id, abVariant: "B" });
  assert.deepEqual(await abTestStats(db, tenantId, ab.id), { A: { views: 1, leads: 0 }, B: { views: 8, leads: 1 } });
  assert.deepEqual(await abTestStats(db, randomUUID(), ab.id), { A: { views: 0, leads: 0 }, B: { views: 0, leads: 0 } });
  await saveAbTest(db, tenantId, { pageId, action: "end", winner: "B" });
  assert.equal(await recordAbView(db, tenantId, siteId, ab.id, "B"), false);
  assert.equal(await runningAbTest(db, tenantId, siteId, "uu-dai"), null);
  await saveAbTest(db, tenantId, { pageId, action: "start", ...copy });
  const restarted = parseAbTest((await repo.page.get(pageId))!.abTest)!;
  assert.deepEqual(await abTestStats(db, tenantId, restarted.id), { A: { views: 0, leads: 0 }, B: { views: 0, leads: 0 } });
}));
