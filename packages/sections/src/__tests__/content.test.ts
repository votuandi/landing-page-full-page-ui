import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { sectionRegistry } from "../registry";
import { applyCollectionQuery } from "../collections/query";
import { createCollectionLoader } from "../collections/loader";
import { storySource, testimonialItem } from "../collections/schemas";
import { storyEmbed } from "../shared/storyEmbed";
import { serializeJsonLd } from "../shared/jsonLd";
import { faq } from "../faq/schema";
import Faq from "../faq/t15";
import { stats } from "../stats/schema";
import Projects from "../projects/t15.island";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fieldMeta } from "../fields/widget";
import { projectsSchema } from "../projects/schema";
import { blogSchema } from "../blog/schema";
import Loadable from "next/dist/shared/lib/loadable.shared-runtime";
import StatsT15 from "../stats/t15";
import Shorts from "../shorts/t15.island";
import { shorts } from "../shorts/schema";
import { migrateShortsV1 } from "../shorts/migrations";
import { pickLocale } from "../fields";
import type { Locale } from "../site";

const collectionItems = {
  projects: [{ id: "p", title: "Sample project", segment: "shop", location: "HCM", kwp: 10, image: { id: "/p.webp", alt: { vi: "Ảnh", en: "Project image" } } }],
  shorts: [{ id: "s", title: "Sample video", segment: "shop", location: "HCM", kwp: 10, kind: "done", poster: { id: "/s.webp", alt: { vi: "Ảnh", en: "Poster" } }, source: { provider: "file", idOrSrc: "/s.mp4" } }],
  testimonials: [{ id: "t", name: "Sample client", segment: "shop", location: "HCM", kwp: 10, quote: "Sample quote", rating: 5 }],
  blog: [{ id: "b", title: "Sample post", excerpt: "Sample excerpt", cover: { id: "/b.webp", alt: { vi: "Ảnh", en: "Post image" } }, readMinutes: 5, href: "/tin-tuc/sample" }],
};

async function renderContent(type: string, overrides: Record<string, unknown> = {}, locale: Locale = "en") {
  const def = sectionRegistry.getType(type)!;
  const data = def.schema.parse({ ...def.defaults as Record<string, unknown>, ...overrides });
  const Component = (await import(`../${type}/t15`)).default;
  // Preload the real next/dynamic islands so static markup includes their SSR content.
  await Loadable.preloadAll();
  return renderToStaticMarkup(createElement(Component, { data, site: { ...site, locale }, sectionId: type }));
}

function assertText(html: string, text: string) {
  const encoded = renderToStaticMarkup(createElement("span", null, text)).slice(6, -7);
  assert.ok(html.includes(encoded), `Missing text: ${text}`);
}

const types = ["projects", "shorts", "stats", "energy-monitoring", "process", "testimonials", "trust", "brands", "faq", "blog", "cta-banner"];
const site = { tenantId: "test", locale: "vi", themeId: "t15" } as const;

test("11 content types have valid fixtures, files and registry variants", async () => {
  for (const type of types) {
    const def = sectionRegistry.getType(type);
    assert.ok(def, type);
    const fixture = await import(`../${type}/fixtures`);
    assert.deepEqual(def.schema.parse(Object.values(fixture)[0]), def.defaults);
    for (const file of ["schema.ts", "fixtures.ts", "index.ts", "t15.tsx"]) {
      assert.ok(existsSync(resolve(__dirname, "../../../../src", type, file)), `${type}/${file}`);
    }
    assert.equal(sectionRegistry.getVariant(type, "t15")?.fallback, false);
  }
});

test("video sources reject executable, cross-origin and traversal paths", () => {
  for (const idOrSrc of ["javascript:alert(1)", "//evil/video.mp4", "/a/../video.mp4", "/a/%2e%2e/video.mp4", "/\\evil/video.mp4"]) {
    assert.equal(storySource.safeParse({ provider: "file", idOrSrc }).success, false, idOrSrc);
  }
  for (const provider of ["youtube", "tiktok", "bunny"]) {
    assert.equal(storySource.safeParse({ provider, idOrSrc: "javascript:alert(1)" }).success, false);
  }
  assert.equal(storySource.safeParse({ provider: "youtube", idOrSrc: "dQw4w9WgXcQ", originalUrl: "http://evil" }).success, false);
  assert.match(storyEmbed({ provider: "youtube", idOrSrc: "dQw4w9WgXcQ" }).src, /^https:\/\/www.youtube-nocookie.com\/embed\//);
  assert.match(storyEmbed({ provider: "tiktok", idOrSrc: "123456789" }).src, /tiktok.com\/player\/v1\/123456789/);
  assert.equal(storyEmbed({ provider: "file", idOrSrc: "/a.mp4" }).kind, "video");
});

test("content schemas reject ambiguous stats, empty FAQ and invalid ratings", () => {
  assert.equal(stats.schema.safeParse({ ...stats.defaults, items: [{ value: 10, sinceYear: 2010, label: { vi: "Mẫu" } }] }).success, false);
  assert.equal(stats.schema.safeParse({ ...stats.defaults, items: [{ label: { vi: "Mẫu" } }] }).success, false);
  assert.equal(faq.schema.safeParse({ ...faq.defaults, items: [] }).success, false);
  assert.equal(testimonialItem.safeParse({ id: "a", name: "Mẫu", segment: "shop", location: "HCM", kwp: 6, quote: "Mẫu", rating: 5.1 }).success, false);
});

test("collection query preserves ids order then filters, sorts and limits without mutating input", () => {
  const items = [{ id: "a", segment: "shop", kwp: 10 }, { id: "b", segment: "farm", kwp: 20 }, { id: "c", segment: "shop", kwp: 30 }];
  assert.deepEqual(applyCollectionQuery(items, { ids: ["c", "a"], filter: {}, limit: 8 }).map((i) => i.id), ["c", "a"]);
  assert.deepEqual(applyCollectionQuery(items, { filter: { segment: "shop" }, sort: { field: "kwp", dir: "desc" }, limit: 1 }).map((i) => i.id), ["c"]);
  assert.deepEqual(items.map((i) => i.id), ["a", "b", "c"]);
});

test("collection query widgets retain metadata and type-specific limits", () => {
  assert.deepEqual(fieldMeta(projectsSchema.shape.query), { widget: "collectionQuery", collection: "projects" });
  assert.deepEqual(fieldMeta(blogSchema.shape.query), { widget: "collectionQuery", collection: "posts" });
  assert.equal(projectsSchema.shape.query.parse({}).limit, 8);
  assert.equal(blogSchema.shape.query.parse({}).limit, 3);
  assert.equal(blogSchema.shape.query.safeParse({ limit: 2 }).success, false);
  assert.equal(blogSchema.shape.query.safeParse({ limit: 7 }).success, false);
});

test("loader fills collection items, preserves fixtures without source and propagates source failures", async () => {
  const data = sectionRegistry.getType("projects")!.defaults;
  const section = { id: "projects", type: "projects", variant: "t15", enabled: true, data };
  const load = createCollectionLoader({ projects: (context) => { assert.equal(context.tenantId, "test"); return [{ id: "a" }]; } });
  assert.deepEqual((await load({ section, data, site }) as { items: unknown[] }).items, [{ id: "a" }]);
  assert.equal(await createCollectionLoader({})({ section, data, site }), data);
  const other = { ...section, type: "faq" };
  assert.equal(await load({ section: other, data, site }), data);
  await assert.rejects(async () => createCollectionLoader({ projects: () => { throw new Error("offline"); } })({ section, data, site }), /offline/);
});

test("FAQ emits locale-aware safe JSON-LD only when enabled", () => {
  const unsafe = "</script><script>alert(1)</script>&\u2028\u2029";
  const encoded = serializeJsonLd({ unsafe });
  assert.doesNotMatch(encoded, /<\/|[<>&\u2028\u2029]/);
  assert.deepEqual(JSON.parse(encoded), { unsafe });
  const data = faq.schema.parse({ ...faq.defaults, items: [{ question: { vi: unsafe, en: "Question" }, answer: { vi: "Trả lời", en: "Answer" } }] });
  const html = renderToStaticMarkup(createElement(Faq, { data, site, sectionId: "faq" }));
  assert.match(html, /FAQPage/);
  assert.match(html, /acceptedAnswer/);
  assert.doesNotMatch(html, /<script>alert/);
  const english = renderToStaticMarkup(createElement(Faq, { data, site: { ...site, locale: "en" }, sectionId: "faq" }));
  assert.match(english, /"name":"Question"/);
  assert.doesNotMatch(renderToStaticMarkup(createElement(Faq, { data: { ...data, jsonLd: false }, site, sectionId: "faq" })), /application\/ld\+json/);
});

test("project video card has a no-JS calculator link with story-cta source", () => {
  const html = renderToStaticMarkup(createElement(Projects, {
    items: [{ id: "p", title: "Mẫu", location: "HCM", segment: "shop", kwp: 10, imageAlt: "Mẫu", video: { provider: "file", idOrSrc: "/a.mp4" } }],
    labels: { household: "Nhà", shop: "Cửa hàng", factory: "Xưởng", farm: "Trại" }, showFilter: true,
    savingLabel: "Tiết kiệm", allLabel: "Tất cả", ctaLabel: "Nhận báo giá công trình tương tự", locale: "vi",
  }));
  assert.match(html, /href="\?[^" ]*nguon=story-cta[^" ]*#du-toan"/);
  assert.match(html, /Nhận báo giá công trình tương tự/);
});

test("stats SSR renders current-year experience, decimals, suffix and final values in VI/EN", async () => {
  const sinceYear = 2014;
  const years = Math.max(0, new Date().getFullYear() - sinceYear);
  const data = stats.schema.parse({ items: [
    { sinceYear, label: { vi: "Kinh nghiệm", en: "Experience" }, suffix: { vi: " năm", en: " years" } },
    { value: 4200.25, decimals: 1, label: { vi: "Công suất", en: "Capacity" }, suffix: { vi: " kWp", en: " kWp" } },
  ] });
  await Loadable.preloadAll();
  for (const locale of ["vi", "en"] as const) {
    const html = renderToStaticMarkup(createElement(StatsT15, { data, site: { ...site, locale }, sectionId: "stats" }));
    const suffix = locale === "en" ? " years" : " năm";
    const decimal = locale === "en" ? "4,200.3" : "4.200,3";
    assert.ok(html.includes(`>${years}<span class="text-2xl">${suffix}</span></dd>`));
    assert.ok(html.includes(`>${decimal}<span class="text-2xl"> kWp</span></dd>`));
    assertText(html, locale === "en" ? "Experience" : "Kinh nghiệm");
    assertText(html, locale === "en" ? "Capacity" : "Công suất");
  }
});

for (const type of types) {
  test(`${type} renders English heading and collection content`, async () => {
    const items = collectionItems[type as keyof typeof collectionItems];
    const html = await renderContent(type, items ? { items } : {});
    const { title } = sectionRegistry.getType(type)!.defaults as { title: { vi: string; en: string } };
    assertText(html, title.en);
    assert.ok(html.includes(`<h2 id="${type}-title"`));
    if (items) {
      const item = items[0];
      assertText(html, "title" in item ? item.title : item.quote);
    }
  });
}

for (const locale of ["vi", "en"] as const) {
  test(`projects hides absent savings and omits empty collections (${locale})`, async () => {
    const html = await renderContent("projects", { items: collectionItems.projects, savingLabel: { vi: "Tiết kiệm cần ẩn", en: "Hidden savings" } }, locale);
    assertText(html, "Sample project");
    assert.doesNotMatch(html, /Tiết kiệm cần ẩn|Hidden savings/);
    assert.equal(await renderContent("projects", { items: [] }, locale), "");
    assert.equal(await renderContent("shorts", { items: [] }, locale), "");
  });

  test(`testimonials renders ratings without items (${locale})`, async () => {
    const html = await renderContent("testimonials", { items: [], ratings: [{ label: { vi: "Đánh giá mẫu", en: "Sample ratings" }, score: 4.8, count: 12, url: "https://example.com/reviews" }] }, locale);
    assertText(html, locale === "en" ? "Sample ratings" : "Đánh giá mẫu");
    assertText(html, "4.8/5");
    assert.doesNotMatch(html, /<figure|<blockquote/);
    assert.equal(await renderContent("testimonials", { items: [], ratings: [] }, locale), "");
  });

  test(`brands renders wordmarks without signing video (${locale})`, async () => {
    const html = await renderContent("brands", { signingVideo: undefined }, locale);
    const { items } = sectionRegistry.getType("brands")!.defaults as { items: { name: { vi: string; en?: string } }[] };
    assertText(html, pickLocale(items[0].name, locale));
    assert.doesNotMatch(html, /Watch video:|Xem video:/);
  });

  test(`trust renders certificate metadata without images (${locale})`, async () => {
    const { items } = sectionRegistry.getType("trust")!.defaults as { items: { number: { vi: string; en?: string }; scope: { vi: string; en?: string } }[] };
    const html = await renderContent("trust", { items: items.map((item) => ({ ...item, image: undefined })) }, locale);
    assertText(html, pickLocale(items[0].number, locale));
    assertText(html, pickLocale(items[0].scope, locale));
    assert.doesNotMatch(html, /<img/);
  });

  test(`cta-banner renders primary CTA without secondary CTA (${locale})`, async () => {
    const html = await renderContent("cta-banner", { secondaryCta: undefined }, locale);
    const { primaryCta } = sectionRegistry.getType("cta-banner")!.defaults as { primaryCta: { label: { vi: string; en?: string } } };
    assertText(html, pickLocale(primaryCta.label, locale));
    assert.equal((html.match(/<a\s/g) ?? []).length, 1);
  });

  test(`projects and shorts announce empty filtered lists (${locale})`, () => {
    const labels = { household: "Nhà", shop: "Cửa hàng", factory: "Xưởng", farm: "Trại" };
    const projectsHtml = renderToStaticMarkup(createElement(Projects, { items: [], labels, showFilter: true, savingLabel: "Savings", allLabel: "All", ctaLabel: "Quote", locale }));
    const shortsHtml = renderToStaticMarkup(createElement(Shorts, { items: [], labels, ctaLabel: "Quote", locale }));
    assertText(projectsHtml, locale === "en" ? "No projects for this segment yet." : "Chưa có công trình cho phân khúc này.");
    assertText(shortsHtml, locale === "en" ? "No videos for this segment yet." : "Chưa có video cho phân khúc này.");
    assert.match(projectsHtml, /role="status"/);
    assert.match(shortsHtml, /role="status"/);
  });

  test(`shorts uses tenant segment labels from schema (${locale})`, async () => {
    const segmentLabels = { ...shorts.defaults.segmentLabels, shop: { vi: "Cửa hàng của khách", en: "Tenant shops" } };
    const html = await renderContent("shorts", { items: collectionItems.shorts, segmentLabels }, locale);
    assertText(html, pickLocale(segmentLabels.shop, locale));
    assert.doesNotMatch(html, />Shops<|>Cửa hàng</);
  });
}

test("shorts v1 migration adds labels without changing content or overwriting tenant labels", () => {
  const { segmentLabels, ...v1 } = shorts.schema.parse({ ...shorts.defaults, items: collectionItems.shorts });
  const original = structuredClone(v1);
  assert.equal(shorts.schemaVersion, 2);
  assert.deepEqual(shorts.schema.parse(migrateShortsV1(v1)), { ...v1, segmentLabels });
  assert.deepEqual(shorts.schema.parse(v1), { ...v1, segmentLabels });
  const custom = { ...segmentLabels, shop: { vi: "Cửa hàng của khách", en: "Tenant shops" } };
  assert.deepEqual(migrateShortsV1({ ...v1, segmentLabels: custom }).segmentLabels, custom);
  assert.deepEqual(v1, original);
});
