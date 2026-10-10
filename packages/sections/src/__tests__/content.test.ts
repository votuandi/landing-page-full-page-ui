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
