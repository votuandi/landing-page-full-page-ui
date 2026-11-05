import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { sectionRegistry } from "@solar/sections";
import { createDb, createPlatformDb } from "../client.ts";
import { forTenant } from "../repository.ts";
import { createLandingPage, savePageSettings } from "../landingPages.ts";
import { SiteSettingsError } from "../siteSettings.ts";
import { StructureError, publishPage } from "../publish.ts";
import type { Prisma } from "../../generated/client.ts";

async function fixture(run: (ctx: { db: ReturnType<typeof createDb>; ops: ReturnType<typeof createPlatformDb>; tenantId: string; site: { id: string }; repo: ReturnType<typeof forTenant> }) => Promise<void>, planId = "pro") {
  const db = createDb({ pool: 3 }), ops = createPlatformDb({ pool: 1 }), tenantId = randomUUID();
  try {
    await ops.tenant.create({ data: { id: tenantId, slug: tenantId, name: "[DỮ LIỆU MẪU]", planId, status: "active" } });
    const repo = forTenant(db, tenantId), site = await repo.site.create({ name: "[DỮ LIỆU MẪU]", themeId: "t07", presetId: "t07", pageTypes: ["home", "contact", "policy"] });
    await repo.page.create({ siteId: site.id, slug: "", kind: "home", sections: [] });
    await repo.page.create({ siteId: site.id, slug: "lien-he", sections: [] });
    await run({ db, ops, tenantId, site, repo });
  } finally {
    await ops.tenant.deleteMany({ where: { id: tenantId } });
    await Promise.all([db.$disconnect(), ops.$disconnect()]);
  }
}
const input = (siteId: string, slug = "trang-trai") => ({ siteId, title: { vi: "[DỮ LIỆU MẪU] Trang trại" }, slug, source: { kind: "blank" as const } });
const options = { skip: !process.env.DATABASE_URL };

test("tạo trang trắng: draft only, slug trùng 409, malformed slug rejected", options, () => fixture(async ({ db, tenantId, site, repo }) => {
  const result = await createLandingPage(db, tenantId, input(site.id));
  const page = (await repo.page.get(result.pageId))!;
  assert.equal(page.kind, "landing"); assert.equal(page.publishedAt, null);
  assert.deepEqual(page.sections, []); assert.deepEqual(page.draftSections, []);
  assert.equal(await repo.outbox.count(), 0);
  await assert.rejects(createLandingPage(db, tenantId, input(site.id)), e => e instanceof SiteSettingsError && e.status === 409 && e.message === "Đường dẫn đã được dùng");
  await assert.rejects(createLandingPage(db, tenantId, input(site.id, "api/x")));
  assert.equal(await repo.page.count(), 3);
}));

test("từ mẫu: matches home preset variant, default content, filters entitlements", options, () => fixture(async ({ db, ops, tenantId, site, repo }) => {
  await ops.tenant.update({ where: { id: tenantId }, data: { featureOverrides: { calculator: { on: false, reason: "Test" } } } });
  const { pageId } = await createLandingPage(db, tenantId, { ...input(site.id), source: { kind: "template", id: "ho-gia-dinh" } });
  const page = (await repo.page.get(pageId))!;
  const sections = page.draftSections as { id: string; type: string; variant: string }[];
  assert.deepEqual(sections.map(s => s.type), ["hero", "process", "testimonials", "faq", "lead-form"]);
  assert.equal(sections[0].variant, "t07");
  const rows = await repo.sectionContent.list({ where: { pageId } });
  assert.equal(rows.length, sections.length);
  for (const row of rows) { assert.deepEqual(row.data, sectionRegistry.getType(row.type)!.defaults); assert.deepEqual(row.draftData, row.data); }
}));

test("nhân bản lọc: draft content/layout, original ids/version, no chrome, removed or outside-plan sections", options, () => fixture(async ({ db, ops, tenantId, site, repo }) => {
  const home = (await repo.page.first({ where: { slug: "" } }))!;
  const sections = ["site-header", "hero", "calculator", "faq", "site-footer"].map(type => ({ id: type, type, variant: "t15", enabled: true }));
  await repo.page.update(home.id, { draftSections: sections.map(s => s.type === "hero" ? { ...s, anchor: "uu-dai", layout: { background: "tint" } } : s) });
  for (const s of sections) await repo.sectionContent.create({ siteId: site.id, pageId: home.id, sectionId: s.id, type: s.type,
    data: sectionRegistry.getType(s.type)!.defaults as Prisma.InputJsonValue, draftData: sectionRegistry.getType(s.type)!.defaults as Prisma.InputJsonValue, ...(s.type === "faq" ? { removedAt: new Date() } : {}) });
  const draft = { ...sectionRegistry.types.hero.defaults, eyebrow: { vi: "[DỮ LIỆU MẪU] Bản nháp" } };
  const hero = (await repo.sectionContent.first({ where: { pageId: home.id, sectionId: "hero" } }))!;
  await repo.sectionContent.update(hero.id, { draftData: draft });
  await ops.tenant.update({ where: { id: tenantId }, data: { featureOverrides: { calculator: { on: false, reason: "Test" } } } });
  const { pageId } = await createLandingPage(db, tenantId, { ...input(site.id), source: { kind: "duplicate", pageId: home.id } });
  const page = (await repo.page.get(pageId))!;
  // Pro has no `builder`: the copy drops the layout, otherwise its first publish fails "Gói không cho tùy chỉnh bố cục section".
  assert.deepEqual(page.draftSections, [{ ...sections[1], anchor: "uu-dai" }]);
  const copies = await repo.sectionContent.list({ where: { pageId } });
  assert.equal(copies.length, 1); assert.deepEqual(copies[0].draftData, draft);
  assert.equal(copies[0].schemaVersion, hero.schemaVersion);
  assert.deepEqual((await repo.page.get(home.id))?.draftSections, sections.map(s => s.type === "hero" ? { ...s, anchor: "uu-dai", layout: { background: "tint" } } : s));
  const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU]", email: "owner@test.vn", role: "owner" });
  await publishPage(db, tenantId, { pageId, expectedRevision: page.revision, actor: { siteUserId: user.id } });
  assert.notEqual((await repo.page.get(pageId))?.publishedAt, null);
}));

test("nhân bản trên Premium giữ layout và xuất bản được", options, () => fixture(async ({ db, tenantId, site, repo }) => {
  const home = (await repo.page.first({ where: { slug: "" } }))!;
  const hero = { id: "hero", type: "hero", variant: "t15", enabled: true, layout: { background: "tint" } };
  await repo.page.update(home.id, { draftSections: [hero] });
  await repo.sectionContent.create({ siteId: site.id, pageId: home.id, sectionId: "hero", type: "hero", data: sectionRegistry.types.hero.defaults as Prisma.InputJsonValue });
  const { pageId } = await createLandingPage(db, tenantId, { ...input(site.id), source: { kind: "duplicate", pageId: home.id } });
  const page = (await repo.page.get(pageId))!;
  assert.deepEqual(page.draftSections, [hero]);
  const user = await repo.siteUser.create({ name: "[DỮ LIỆU MẪU]", email: "owner@test.vn", role: "owner" });
  await publishPage(db, tenantId, { pageId, expectedRevision: page.revision, actor: { siteUserId: user.id } });
}, "premium"));

test("tenant khác / missing source: 404 without creating a page", options, () => fixture(async ({ db, tenantId, site, repo }) => {
  await fixture(async foreign => {
    const home = (await foreign.repo.page.first({ where: { slug: "" } }))!;
    for (const pageId of [home.id, randomUUID()]) await assert.rejects(createLandingPage(db, tenantId, { ...input(site.id), source: { kind: "duplicate", pageId } }), e => e instanceof SiteSettingsError && e.status === 404);
    await assert.rejects(createLandingPage(db, foreign.tenantId, input(site.id)), e => e instanceof SiteSettingsError && e.status === 404);
  });
  assert.equal(await repo.page.count(), 2);
}));

test("vượt limit: song song at last slot allows exactly one request", options, () => fixture(async ({ db, tenantId, site, repo }) => {
  await createLandingPage(db, tenantId, input(site.id, "mot"));
  const results = await Promise.allSettled(["hai", "ba"].map(slug => createLandingPage(db, tenantId, input(site.id, slug))));
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const rejected = results.find(r => r.status === "rejected") as PromiseRejectedResult;
  assert.ok(rejected.reason instanceof StructureError); assert.match(rejected.reason.message, /Vượt số trang của gói: 4\/3/);
  assert.equal(await repo.page.count(), 4);
}));

test("gói không landingPages: database rejects creation", options, () => fixture(async ({ db, tenantId, site, repo }) => {
  await assert.rejects(createLandingPage(db, tenantId, input(site.id)), e => e instanceof StructureError && /gói/i.test(e.message));
  assert.equal(await repo.page.count(), 2);
}, "basic"));

test("save settings: rejects home/catalog, invalid settings and tenant khác before writing", options, () => fixture(async ({ db, tenantId, site, repo }) => {
  for (const slug of ["", "lien-he"]) {
    const page = (await repo.page.first({ where: { slug } }))!;
    await assert.rejects(savePageSettings(db, tenantId, { pageId: page.id, title: { vi: "X" }, settings: {} }), /landing/);
  }
  const { pageId } = await createLandingPage(db, tenantId, input(site.id));
  await assert.rejects(savePageSettings(db, tenantId, { pageId, title: { vi: "X" }, settings: { seo: { title: { vi: "a".repeat(71) } } } }));
  await assert.rejects(savePageSettings(db, randomUUID(), { pageId, title: { vi: "X" }, settings: {} }), e => e instanceof SiteSettingsError && e.status === 404);
}));

test("save settings: no revision conflict, published invalidates page and sitemap", options, () => fixture(async ({ db, tenantId, site, repo }) => {
  const { pageId } = await createLandingPage(db, tenantId, input(site.id));
  const settings = { seo: { title: { vi: "Trang trại", en: "Farm" }, description: { vi: "Mô tả" }, noindex: true }, hideHeader: true, hideFooter: true };
  await savePageSettings(db, tenantId, { pageId, title: { vi: "Tiêu đề mới" }, settings });
  assert.deepEqual((await repo.page.get(pageId))?.settings, settings);
  assert.equal((await repo.page.get(pageId))?.revision, 0);
  assert.equal(await repo.outbox.count(), 0);
  await repo.page.update(pageId, { publishedAt: new Date() });
  await savePageSettings(db, tenantId, { pageId, title: { vi: "Tiêu đề" }, settings });
  const jobs = JSON.stringify(await repo.outbox.list());
  assert.ok(jobs.includes(`tenant:${tenantId}:page:trang-trai`)); assert.ok(jobs.includes(`tenant:${tenantId}:site`));
}));
