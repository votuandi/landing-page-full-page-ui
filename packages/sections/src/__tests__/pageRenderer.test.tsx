import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { z } from "zod";
import { defineSectionType, defineVariants, type SectionVariant } from "../define";
import { pageConfigSchema, type PageConfig } from "../page";
import { createRegistry } from "../registry";
import { PageRenderer, type PageRendererProps } from "../render/PageRenderer";
import { demo, v1 } from "./fixtures";

const site = { tenantId: "tenant-mau", locale: "vi" as const, themeId: "t15" };

const premium = defineSectionType({
  type: "premium",
  schemaVersion: 1,
  schema: z.object({ title: z.string() }),
  defaults: { title: "[DỮ LIỆU MẪU] Premium" },
  meta: { label: { vi: "Tính năng trả phí" }, icon: "lock", entitlement: "calculator" },
});
let premiumLoads = 0;
const premiumVariant: SectionVariant<typeof premium> = ({ data }) => data.title;
const registry = createRegistry({
  demo: defineVariants(demo, "v1", { v1 }),
  premium: defineVariants(premium, "v1", { v1: async () => { premiumLoads++; return { default: premiumVariant }; } }),
});

const page = (sections: object[]): PageConfig => pageConfigSchema.parse({ sections });
const render = async (props: Omit<PageRendererProps, "site" | "registry">) =>
  renderToStaticMarkup(await PageRenderer({ site, registry, ...props }));

test("render đúng thứ tự cấu hình, bỏ section tắt và type lạ, gắn id neo", async (t) => {
  t.mock.method(console, "warn", () => {});
  const html = await render({ page: page([
    { id: "c", type: "demo", variant: "v1", data: { title: "C" } },
    { id: "tat", type: "demo", variant: "v1", enabled: false, data: { title: "Tắt" } },
    { id: "a", type: "demo", variant: "v1", anchor: "du-toan", data: { title: "A" } },
    { id: "la", type: "khong-co", variant: "v1", data: {} },
    { id: "b", type: "premium", variant: "v1", data: { title: "B" } },
  ]) });
  assert.equal(html,
    '<div data-section-id="c" data-section-type="demo">C</div>'
    + '<div id="du-toan" data-section-id="a" data-section-type="demo">A</div>'
    + '<div data-section-id="b" data-section-type="premium">B</div>');
});

test("section không đủ entitlement bị bỏ và không tải chunk variant", async () => {
  premiumLoads = 0;
  const features: string[] = [];
  const html = await render({
    page: page([{ id: "p", type: "premium", variant: "v1", data: { title: "P" } }]),
    canUse: (feature) => { features.push(feature); return false; },
  });
  assert.equal(html, "");
  assert.deepEqual(features, ["calculator"]);
  assert.equal(premiumLoads, 0);
});

test("lỗi chuẩn bị dữ liệu chỉ làm section đó rỗng và log tenantId, sectionId", async (t) => {
  const error = t.mock.method(console, "error", () => {});
  const html = await render({
    page: page([
      { id: "ok", type: "demo", variant: "v1", data: { title: "OK" } },
      { id: "loi-du-lieu", type: "demo", variant: "v1", data: { title: "X" } },
      { id: "sai-schema", type: "demo", variant: "v1", data: { title: 1 } },
      { id: "ok-2", type: "demo", variant: "v1", data: { title: "OK 2" } },
    ]),
    loadData: ({ section, data }) => {
      if (section.id === "loi-du-lieu") throw new Error("collection lỗi");
      return data;
    },
  });
  assert.equal(html,
    '<div data-section-id="ok" data-section-type="demo">OK</div>'
    + '<div data-section-id="loi-du-lieu" data-section-type="demo" data-section-fallback=""></div>'
    + '<div data-section-id="sai-schema" data-section-type="demo" data-section-fallback=""></div>'
    + '<div data-section-id="ok-2" data-section-type="demo">OK 2</div>');
  assert.equal(error.mock.callCount(), 2);
  for (const [index, sectionId] of ["loi-du-lieu", "sai-schema"].entries()) {
    const [message, detail] = error.mock.calls[index].arguments as [string, Record<string, unknown>];
    assert.equal(message, "[sections] chuẩn bị section lỗi");
    assert.equal(detail.tenantId, "tenant-mau");
    assert.equal(detail.sectionId, sectionId);
  }
});

test("loadData trả dữ liệu đã chuẩn bị cho variant", async () => {
  const html = await render({
    page: page([{ id: "a", type: "demo", variant: "v1", data: { title: "Gốc" } }]),
    loadData: async ({ data }) => ({ ...(data as object), title: "Đã chuẩn bị" }),
  });
  assert.equal(html, '<div data-section-id="a" data-section-type="demo">Đã chuẩn bị</div>');
});

test("pageConfigSchema từ chối id trùng và anchor sai, enabled mặc định true", () => {
  assert.equal(pageConfigSchema.safeParse({ sections: [
    { id: "a", type: "demo", variant: "v1", data: {} }, { id: "a", type: "demo", variant: "v1", data: {} },
  ] }).success, false);
  assert.equal(pageConfigSchema.safeParse({ sections: [
    { id: "a", type: "demo", variant: "v1", anchor: "#Du toan", data: {} },
  ] }).success, false);
  assert.equal(page([{ id: "a", type: "demo", variant: "v1", data: {} }]).sections[0].enabled, true);
});
