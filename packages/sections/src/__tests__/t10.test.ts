import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Loadable from "next/dist/shared/lib/loadable.shared-runtime";
import { sectionRegistry } from "../registry";
import { widgetRegistry } from "../widgets/registry";

const site = { tenantId: "test", locale: "vi", themeId: "t10" } as const;
const items = {
  projects: [{ id: "p", title: "Công trình mẫu", segment: "shop", location: "Long An", kwp: 350, savingPerMonth: 12000000, image: { id: "/p.webp", alt: { vi: "Ảnh" } } }],
  testimonials: [
    { id: "a", name: "Nguyễn Minh Khang", segment: "factory", location: "Long An", kwp: 1200, quote: "Nhận xét nhà máy", rating: 5 },
    { id: "b", name: "Trần Ngọc Linh", segment: "shop", location: "TP.HCM", kwp: 350, quote: "Nhận xét cửa hàng", rating: 5 },
  ],
} as Record<string, unknown[]>;
const T10_SECTIONS = ["hero", "segments", "services", "brands", "stats", "projects", "investment-models", "energy-monitoring", "process", "testimonials", "trust", "faq", "lead-form"];

async function render(registry: typeof sectionRegistry | typeof widgetRegistry, type: string, data: unknown, locale: "vi" | "en" = "vi") {
  const resolved = registry.getVariant(type, "t10")!;
  assert.equal(resolved.fallback, false, `${type}/t10 chưa đăng ký`);
  const { default: Component } = await resolved.load();
  await Loadable.preloadAll();
  return renderToStaticMarkup(createElement(Component, { data, site: { ...site, locale }, sectionId: type }));
}
const text = (value: string) => renderToStaticMarkup(createElement("span", null, value)).slice(6, -7);

test("13 section t10 + contact-dock t10 render với defaults chung của type (VI/EN)", async () => {
  for (const type of T10_SECTIONS) {
    const def = sectionRegistry.getType(type)!;
    const data = def.schema.parse({ ...def.defaults as object, ...(items[type] ? { items: items[type] } : {}) });
    for (const locale of ["vi", "en"] as const) {
      const html = await render(sectionRegistry, type, data, locale);
      assert.ok(html.length > 0, `${type}/${locale}`);
      const title = (data as { title?: { vi: string; en?: string } | object }).title;
      if (title && "vi" in title && type !== "segments") assert.ok(html.includes(text(title[locale] || title.vi)), `${type}/${locale} thiếu tiêu đề`);
    }
  }
  const dock = widgetRegistry.getType("contact-dock")!;
  const html = await render(widgetRegistry, "contact-dock", { ...dock.defaults as object, mobileBar: true });
  assert.match(html, /Liên hệ nhanh/);
  assert.match(html, /href="tel:0901234567"/);
});

test("hero t10 hiện nút phân khúc, highlight và ghi chú khi có segmentViews", async () => {
  const def = sectionRegistry.getType("hero")!;
  const img = { id: "/h.webp", alt: { vi: "Ảnh" } };
  const data = def.schema.parse({
    ...def.defaults as object, highlights: [{ vi: "Khảo sát theo nhu cầu" }], note: { vi: "* Số liệu minh họa" },
    segmentViews: { label: { vi: "Bạn là:" }, items: [
      { segment: "factory", label: { vi: "Nhà máy" }, title: { vi: "Tiêu đề nhà máy" }, description: { vi: "Mô tả" }, highlights: [], image: img },
      { segment: "household", label: { vi: "Gia đình" }, title: { vi: "Tiêu đề gia đình" }, description: { vi: "Mô tả" }, highlights: [], image: img },
    ] },
  }) as { segmentViews: { items: object[] } };
  const html = await render(sectionRegistry, "hero", data);
  for (const value of ["Bạn là:", "Nhà máy", "Gia đình", "Khảo sát theo nhu cầu", "* Số liệu minh họa"]) assert.ok(html.includes(text(value)), value);
  assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 2);
  assert.equal(def.schema.safeParse({ ...data, segmentViews: { ...data.segmentViews, items: [data.segmentViews.items[0], data.segmentViews.items[0]] } }).success, false);
});

test("segments t10 render khối lợi ích và link chọn phân khúc chạy được khi tắt JS", async () => {
  const def = sectionRegistry.getType("segments")!;
  const base = def.defaults as { items: object[] };
  const data = def.schema.parse({ ...base, targetAnchor: "lien-he", items: [{ ...base.items[0], intro: { vi: "Đoạn mở" }, tag: { vi: "Nhãn ảnh" },
    benefits: [{ value: { vi: "20–40%" }, title: { vi: "Giảm chi phí" }, text: { vi: "Chi tiết" } }], ctaLabel: { vi: "Nhận khảo sát" },
    detailLink: { kind: "page", value: "giai-phap", label: { vi: "Khám phá" } } }] });
  const html = await render(sectionRegistry, "segments", data);
  for (const value of ["Đoạn mở", "Nhãn ảnh", "20–40%", "Nhận khảo sát", "Khám phá"]) assert.ok(html.includes(text(value)), value);
  assert.match(html, /href="\?phan-khuc=[a-z-]+#lien-he"/);
  assert.match(html, /href="\/giai-phap"/);
});

test("investment-models t10 tách 'Nhãn: nội dung' thành dt/dd", async () => {
  const def = sectionRegistry.getType("investment-models")!;
  const base = def.defaults as { models: { points: unknown[] }[] };
  const data = def.schema.parse({ ...base, models: base.models.map((model) => ({ ...model, points: [{ vi: "Vốn ban đầu: Thanh toán theo tiến độ" }] })) });
  const html = await render(sectionRegistry, "investment-models", data);
  assert.match(html, /<dt[^>]*>Vốn ban đầu<\/dt><dd[^>]*>Thanh toán theo tiến độ<\/dd>/);
});
