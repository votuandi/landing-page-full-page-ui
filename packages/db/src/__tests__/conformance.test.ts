// Bất biến chạy trên MỌI dữ liệu đi kèm sản phẩm (seed demo; preset × gói ở presets.test.mjs "every preset … every plan").
// `codegraph impact` không thấy file dữ liệu, nên quy tắc/validator/fallback mới dễ làm hỏng dữ liệu có sẵn mà không test
// nào của story chạm tới (E7-S04: maxPerPage chặn preset t08; E6-S04: seed t12 gói pro + theme signature → fallback).
// Story thêm quy tắc như vậy → thêm một test ở đây (plan mục "Dữ liệu có sẵn chịu ảnh hưởng").
import assert from "node:assert/strict";
import test from "node:test";
import { loadPreset, presets, siteStructureOf, validateSiteStructure } from "@solar/presets";
import { plans, themeAllowed } from "@solar/plans";
import { buildDemo } from "../../prisma/seed-data.ts";
import { randomUUID } from "node:crypto";
import { collectionInputSchema } from "../collections.ts";
import { exportProductsCsv, previewProductCsv } from "../productCsv.ts";
import type { CollectionRow } from "../collectionWrite.ts";
import { parseTenantBackup } from "../tenantBackup.ts";
import { demoBackup } from "./tenantBackup.fixture.ts";
import { ThemeOverridesSchema } from "../../../tokens/src/css";
import { siteProfileSchema } from "../siteProfile.ts";
import { storySource, collectRefs, sectionRegistry } from "@solar/sections";
import { backupMediaReferenceIds, descriptorMediaIds, snapshotMediaIds } from "../mediaRetention.ts";
import { COLLECTIONS, collectionDefs } from "../collections.ts";

test("E8-S06: every preset retains all section media references in descriptors and snapshots", () => {
  for (const preset of presets) {
    const sections = loadPreset(preset.id).page.sections;
    const expected = sections.flatMap(section => collectRefs(sectionRegistry.getType(section.type)!.schema, section.data).media);
    assert.ok(expected.length > 0, `${preset.id}: fixture must exercise media refs`);
    for (const collected of [descriptorMediaIds(sections), snapshotMediaIds({ sections: [], contents: sections }), snapshotMediaIds({ sections, contents: [] })]) {
      for (const id of expected) assert.ok(collected.includes(id), `${preset.id}: collector lost ${id}`);
    }
  }
});

test("E8-S06: every seed backup retains all media referenced by content, drafts and history", () => {
  for (const id of ["t15", "t12"] as const) {
    const bundle = parseTenantBackup(demoBackup(id));
    const expected = [
      ...collectRefs(siteProfileSchema, bundle.site.profile).media,
      ...bundle.sectionContents.flatMap(section => [section.data, section.draftData].flatMap(data => collectRefs(sectionRegistry.getType(section.type)!.schema, data).media)),
      ...COLLECTIONS.flatMap(name => bundle.collections[name].flatMap(row => collectRefs(collectionDefs[name].data, row.data).media)),
    ];
    assert.ok(expected.length > 0, `${id}: seed must exercise media refs`);
    const retained = backupMediaReferenceIds(bundle);
    for (const mediaId of expected) assert.ok(retained.has(mediaId.toLowerCase()), `${id}: collector lost ${mediaId}`);
  }
});

test("E8-S04: static seed story sources still parse alongside Media UUID file sources", () => {
  for (const id of ["t15", "t12"] as const) for (const story of buildDemo(id).collections.stories) assert.doesNotThrow(() => storySource.parse(story.data.source));
  assert.deepEqual(storySource.parse({ provider: "file", idOrSrc: "20c7d32c-e48f-40de-a9ea-3db1b71735c6" }), { provider: "file", idOrSrc: "20c7d32c-e48f-40de-a9ea-3db1b71735c6" });
});

test("themeOverrides of seeds parse (E7-S15)", () => {
  for (const id of ["t15", "t12"] as const) {
    const bundle = demoBackup(id);
    assert.doesNotThrow(() => ThemeOverridesSchema.parse(bundle.site.themeOverrides));
    assert.doesNotThrow(() => siteProfileSchema.parse(bundle.site.profile));
  }
  // Presets contain only a theme ID and sections; profile/overrides belong to the site.
  assert.doesNotThrow(() => ThemeOverridesSchema.parse({}));
  assert.doesNotThrow(() => siteProfileSchema.parse({}));
});

test("tenant backup bundle of every seed demo parses", () => {
  for (const id of ["t15", "t12"] as const) assert.doesNotThrow(() => parseTenantBackup(demoBackup(id)), id);
});

test("E8-S02: bundled seeds/presets contain no private or quarantine storage keys", () => {
  for (const id of ["t15", "t12"] as const) assert.doesNotMatch(JSON.stringify(buildDemo(id)), /(?:private|quarantine)\/[0-9a-f-]{36}\//);
  for (const preset of presets) assert.doesNotMatch(JSON.stringify(preset), /(?:private|quarantine)\/[0-9a-f-]{36}\//);
});

test("product CSV round-trips every seeded product", () => {
  for (const id of ["t15", "t12"] as const) {
    const demo = buildDemo(id);
    const wrap = (r: object) => ({ id: randomUUID(), publishedAt: new Date(), ...r }) as CollectionRow;
    const categories = demo.collections.categories.map(wrap), brands = demo.collections.brands.map(wrap);
    const products = demo.collections.products.map(p => wrap({ ...p, categoryId: categories.find(c => c.slug === p.categorySlug)!.id,
      brandId: brands.find(b => b.slug === p.brandSlug)!.id, price: p.price ?? null, salePrice: p.salePrice ?? null }));
    const csv = exportProductsCsv(products, categories, brands);
    const result = previewProductCsv(csv, products, { categories, brands }, { bilingual: true });
    assert.ok(result.rows.every(r => r.kind === "unchanged")); assert.equal(result.inputs.length, 0);
    for (const p of products) {
      const rebuilt = previewProductCsv(exportProductsCsv([p], categories, brands), [], { categories, brands }, { bilingual: true });
      const original = collectionInputSchema("product").safeParse({
        slug: p.slug, title: p.title, status: p.status, columns: { categoryId: p.categoryId, brandId: p.brandId, price: p.price, salePrice: p.salePrice, featured: p.featured, segments: p.segments }, data: p.data,
      });
      if (original.success) assert.deepEqual(collectionInputSchema("product").parse(rebuilt.inputs[0]), original.data);
      else {
        assert.equal(rebuilt.rows[0].kind, "error", p.slug);
        for (const issue of original.error.issues) assert.ok(rebuilt.rows[0].errors.some(e => e.column === issue.path[1]), p.slug);
      }
    }
  }
});

test("seed demo: theme được gói cho phép, render không rơi về theme fallback (E6-S04)", () => {
  for (const id of ["t15", "t12"] as const) {
    const demo = buildDemo(id);
    assert.ok(themeAllowed(demo.planId, loadPreset(id).theme.meta.group), `${id}: ${demo.themeId} on ${demo.planId}`);
  }
});

// E7-S13: bộ lọc structure chung của checkStructure/setPageTypes. Fixture e2e tenant/admin dựng từ seedDemoTenant,
// fixture tenant còn tắt `about` (giữ Page `ve-chung-toi`) — cả hai trạng thái phải còn lưu/xuất bản được.
test("site structure filter keeps seeds valid (E7-S13)", () => {
  for (const id of ["t15", "t12"] as const) {
    const demo = buildDemo(id);
    const can = (feature: string) => (demo.featureOverrides as Record<string, { on: boolean }>)[feature]?.on
      ?? ((plans[demo.planId].features as ReadonlySet<string>).has(feature) || (demo.addons as readonly string[]).includes(feature));
    const pages = demo.pages.map(page => ({ slug: page.slug, sections: page.pageSections }));
    const policy = { can, pagesLimit: plans[demo.planId].limits.pages, baseline: siteStructureOf(demo, pages) };
    assert.equal(policy.baseline.pages.length, demo.pages.length, `${id}: filter must keep every enabled page`);
    assert.deepEqual(validateSiteStructure(policy.baseline, policy), [], id);
    if (!demo.pageTypes.includes("about")) continue;
    const disabled = siteStructureOf({ pageTypes: demo.pageTypes.filter(type => type !== "about") }, pages);
    assert.ok(!disabled.pages.some(page => page.slug === "ve-chung-toi"), `${id}: disabled about page is filtered out`);
    assert.deepEqual(validateSiteStructure(disabled, { ...policy, baseline: disabled }), [], `${id} without about`);
  }
});
