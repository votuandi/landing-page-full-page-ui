import { button, byPath, click, setConfirm, submitButton, type } from "./dom.ts";
import { render } from "./harness.tsx";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { z } from "zod";
import { link, localized, mediaRef, richText, sectionRegistry, collectionQuery } from "@solar/sections";
import type { FieldProps, Pickers } from "../context.ts";

for (const def of Object.values(sectionRegistry.types)) {
  test(`${def.type}: render thật, bấm lưu không chỉnh sửa → onSubmit nhận đúng dữ liệu vào`, async () => {
    const { container, log } = await render(def.schema, def.defaults, { bilingual: true });
    assert.equal(submitButton(container).disabled, false);
    await click(submitButton(container));
    assert.equal(log.submitted.length, 1);
    assert.deepEqual(log.submitted[0], def.defaults);
    assert.equal(log.changes.length, 0, "render không được tự sửa dữ liệu");
  });
}

const calculator = sectionRegistry.types.calculator;

test("calculator: gõ giá điện, đơn giá/kWp, giờ nắng, PR rồi lưu", async () => {
  const { container, log } = await render(calculator.schema, calculator.defaults);
  await type(byPath(container, "tariffs.household.tiers.0.price"), "1 999");
  await type(byPath(container, "pricePerKwp.household"), "11 500 000");
  await type(byPath(container, "peakSunHours.nam-bo"), "4,8");
  await type(byPath(container, "system.performanceRatio"), "0,82");
  await click(submitButton(container));
  const data = log.submitted[0] as typeof calculator.defaults;
  assert.equal((data.tariffs.household as { tiers: { price: number }[] }).tiers[0].price, 1999);
  assert.equal(data.pricePerKwp.household, 11_500_000);
  assert.equal(data.peakSunHours["nam-bo"], 4.8);
  assert.equal(data.system.performanceRatio, 0.82);
});

test("calculator: gõ chữ vào ô số → lỗi tại ô, dữ liệu không đổi, không lưu được", async () => {
  const { container, log, last } = await render(calculator.schema, calculator.defaults);
  const input = byPath(container, "pricePerKwp.shop");
  await type(input, "nhiều");
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.match(container.textContent ?? "", /Chỉ nhập số/);
  assert.equal(log.changes.length, 0, "giá trị sai kiểu không được ghi vào dữ liệu");
  assert.equal(submitButton(container).disabled, true);
  await click(submitButton(container));
  assert.equal(log.submitted.length, 0);
  await type(input, "12000000");
  assert.equal(submitButton(container).disabled, false);
  assert.equal((last() as typeof calculator.defaults).pricePerKwp.shop, 12_000_000);
});

test("ô số đang sai vẫn khóa lưu sau khi xóa phần tử đứng trước nó trong mảng", async () => {
  const { container, log } = await render(calculator.schema, calculator.defaults);
  await type(byPath(container, "tariffs.household.tiers.1.price"), "abc");
  assert.equal(submitButton(container).disabled, true);
  await click(button(container, "Xóa: Bậc giá 1"));
  const moved = byPath(container, "tariffs.household.tiers.0.price");
  assert.equal(moved.value, "abc");
  assert.equal(submitButton(container).disabled, true);
  await click(submitButton(container));
  assert.equal(log.submitted.length, 0);
});

test("mảng: thêm, nhân bản, lên/xuống, min/max, hủy xác nhận xóa", async () => {
  const schema = z.object({ items: z.array(z.object({ title: localized() })).min(1).max(3) });
  const { container, last } = await render(schema, { items: [{ title: { vi: "A" } }, { title: { vi: "B" } }] });
  await click(button(container, "Xuống dưới: Danh sách 1"));
  assert.deepEqual(last(), { items: [{ title: { vi: "B" } }, { title: { vi: "A" } }] });
  await click(button(container, "Nhân bản: Danh sách 1"));
  assert.equal((last() as { items: unknown[] }).items.length, 3);
  assert.equal(button(container, "+ Thêm mục").disabled, true, "đủ max thì không thêm được");
  setConfirm(false);
  await click(button(container, "Xóa: Danh sách 1"));
  assert.equal((last() as { items: unknown[] }).items.length, 3, "hủy xác nhận thì không xóa");
});

test("trường chuỗi tùy chọn: xóa trắng = bỏ trường, lưu được", async () => {
  const schema = z.object({ url: z.url().optional() });
  const { container, log, last } = await render(schema, { url: "https://a.vn" });
  await type(byPath(container, "url"), "");
  assert.deepEqual(last(), {});
  await click(submitButton(container));
  assert.deepEqual(log.submitted[0], {});
});

test("nhóm tùy chọn: thêm rồi bỏ (có xác nhận)", async () => {
  const schema = z.object({ cta: link().optional() });
  const { container, last } = await render(schema, {});
  await click(button(container, "+ Thêm"));
  assert.deepEqual(last(), { cta: { kind: "page", value: "", label: { vi: "" } } });
  await type(byPath(container, "cta.label"), "Báo giá");
  setConfirm(false);
  await click(button(container, /^Bỏ /));
  assert.ok((last() as { cta?: unknown }).cta, "hủy thì giữ");
  setConfirm(true);
  await click(button(container, /^Bỏ /));
  assert.deepEqual(last(), {});
});

test("union: hủy xác nhận giữ nhánh cũ, đồng ý → giá trị khởi tạo của nhánh mới", async () => {
  const schema = z.object({ tariff: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("flat"), rate: z.number() }),
    z.object({ kind: z.literal("tiered"), tiers: z.array(z.number()).min(1) }),
  ]) });
  const { container, last } = await render(schema, { tariff: { kind: "flat", rate: 2000 } });
  const branch = byPath<HTMLSelectElement>(container, "tariff.$branch");
  setConfirm(false);
  await type(branch, "1");
  assert.equal(last(), undefined);
  setConfirm(true);
  await type(branch, "1");
  assert.deepEqual(last(), { tariff: { kind: "tiered", tiers: [0] } });
});

test("richText: sửa bản VI khi site không song ngữ vẫn giữ bản EN; toolbar đậm bọc vùng chọn", async () => {
  const schema = z.object({ body: richText() });
  const en = [{ type: "paragraph" as const, children: [{ type: "text" as const, text: "Hello" }] }];
  const { container, last } = await render(schema, { body: { vi: [{ type: "paragraph", children: [{ type: "text", text: "Xin chào" }] }], en } });
  const area = byPath<HTMLTextAreaElement>(container, "body");
  await type(area, "Xin chào bạn");
  assert.deepEqual((last() as { body: { en: unknown } }).body.en, en);
  area.setSelectionRange(9, 12);
  await click(button(container, "Đậm (**chữ**)"));
  assert.deepEqual((last() as { body: { vi: unknown } }).body.vi, [{ type: "paragraph", children: [
    { type: "text", text: "Xin chào " }, { type: "text", text: "bạn", bold: true },
  ] }]);
});

test("localized: tab EN khi bilingual; xóa trắng EN = bỏ khóa en", async () => {
  const schema = z.object({ title: localized() });
  const { container, last } = await render(schema, { title: { vi: "Chào", en: "Hi" } }, { bilingual: true });
  await click(button(container, "Tiếng Anh"));
  const input = byPath(container, "title");
  assert.equal(input.value, "Hi");
  await type(input, "");
  assert.deepEqual(last(), { title: { vi: "Chào" } });
});

test("media picker: chọn, hủy, lỗi", async () => {
  const schema = z.object({ image: mediaRef() });
  let answer: () => Promise<unknown> = async () => ({ id: "m-2", alt: { vi: "Ảnh mới" } });
  const pickers: Pickers = { media: () => answer() as never };
  const { container, last } = await render(schema, { image: { id: "m-1", alt: { vi: "Cũ" } } }, { pickers });
  await click(button(container, "Đổi ảnh…"));
  assert.deepEqual(last(), { image: { id: "m-2", alt: { vi: "Ảnh mới" } } });
  answer = async () => null;
  await click(button(container, "Đổi ảnh…"));
  assert.equal((last() as { image: { id: string } }).image.id, "m-2");
  answer = async () => { throw new Error("mạng"); };
  await click(button(container, "Đổi ảnh…"));
  assert.match(container.textContent ?? "", /Không mở được thư viện media/);
});

test("link: chọn trang từ danh sách, đổi loại có xác nhận", async () => {
  const schema = z.object({ cta: link() });
  const pickers: Pickers = { pages: [{ slug: "", label: "Trang chủ" }, { slug: "gioi-thieu", label: "Giới thiệu" }] };
  const { container, last } = await render(schema, { cta: { kind: "page", value: "", label: { vi: "Xem" } } }, { pickers });
  await type(byPath<HTMLSelectElement>(container, "cta.value"), "gioi-thieu");
  assert.equal((last() as { cta: { value: string } }).cta.value, "gioi-thieu");
  setConfirm(false);
  await type(byPath<HTMLSelectElement>(container, "cta.kind"), "phone");
  assert.equal((last() as { cta: { kind: string } }).cta.kind, "page");
});

test("collectionQuery: lọc giữ kiểu người dùng chọn, chọn id từ picker, picker lỗi", async () => {
  const schema = z.object({ query: collectionQuery("projects") });
  const pickers: Pickers = { collectionItems: async () => [{ id: "p1", label: "Dự án 1" }] };
  const { container, log, last } = await render(schema, { query: { filter: {}, limit: 6 } }, { pickers });
  await click(button(container, "+ Thêm điều kiện"));
  await type(container.querySelector<HTMLInputElement>('[aria-label="Tên trường lọc 1"]')!, "code");
  await type(container.querySelector<HTMLInputElement>('[aria-label="Giá trị lọc 1"]')!, "001");
  assert.deepEqual((last() as { query: { filter: unknown } }).query.filter, { code: "001" });
  await click([...container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].find((el) => el.parentElement?.textContent?.includes("Dự án 1"))!);
  await click(submitButton(container));
  assert.deepEqual(log.submitted[0], { query: { filter: { code: "001" }, limit: 6, ids: ["p1"] } });

  const failing = await render(schema, { query: { filter: {}, limit: 6 } }, { pickers: { collectionItems: async () => { throw new Error("x"); } } });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.match(failing.container.textContent ?? "", /Không tải được danh sách mục/);
});

test("override: widget theo wildcard record/mảng và theo kind, nhãn theo đường dẫn; khớp chính xác thắng", async () => {
  const schema = z.object({
    prices: z.record(z.enum(["a", "b"]), z.number()),
    rows: z.array(z.object({ n: z.number() })),
    flag: z.boolean(),
  });
  const Tag = (name: string) => {
    const Widget = ({ path }: FieldProps) => <output>{name}:{path.join(".")}</output>;
    Widget.displayName = `Tag(${name})`;
    return Widget;
  };
  const { container } = await render(schema, { prices: { a: 1, b: 2 }, rows: [{ n: 1 }], flag: true }, {
    widgets: { "prices.*": Tag("wild"), "prices.b": Tag("exact"), "rows.*.n": Tag("row"), boolean: Tag("kind") },
    labels: { prices: "Bảng giá riêng" },
  });
  const outputs = [...container.querySelectorAll("output")].map((el) => el.textContent);
  assert.deepEqual(outputs, ["wild:prices.a", "exact:prices.b", "row:rows.0.n", "kind:flag"]);
  assert.match(container.textContent ?? "", /Bảng giá riêng/);
});

test("boolean và enum: sửa rồi lưu", async () => {
  const schema = z.object({ featured: z.boolean(), tone: z.enum(["light", "dark"]), level: z.union([z.literal(2), z.literal(3)]) });
  const { container, log } = await render(schema, { featured: false, tone: "light", level: 2 });
  await click(byPath(container, "featured"));
  await type(byPath<HTMLSelectElement>(container, "tone"), "dark");
  await type(byPath<HTMLSelectElement>(container, "level"), "3");
  await click(submitButton(container));
  assert.deepEqual(log.submitted[0], { featured: true, tone: "dark", level: 3 });
});

test("mọi trường lá của calculator có control nối đúng đường dẫn", async () => {
  const { container } = await render(calculator.schema, calculator.defaults);
  for (const path of ["eyebrow", "title.lead", "tariffs.household.kind", "tariffs.household.tiers.0.upTo", "tariffs.shop.averageRate",
    "vatRate", "pricePerKwp.farm", "peakSunHours.bac-bo", "segmentRatios.factory", "system.minRoofArea",
    "inputs.household.bill.default", "inputs.farm.roof.max", "defaultProvince", "steps.0", "tips.0", "leadSource"]) {
    const control = path === "tariffs.household.kind" ? byPath(container, "tariffs.household.$branch") : byPath(container, path);
    assert.ok(control, path);
  }
});

test("mảng: thêm thành công, chặn xóa ở min, sắp xếp khi dòng có ô số đang sai vẫn khóa lưu", async () => {
  const schema = z.object({ rows: z.array(z.object({ n: z.number(), label: z.string() })).min(1).max(4) });
  const { container, last } = await render(schema, { rows: [{ n: 1, label: "A" }] });
  assert.equal(button(container, "Xóa: Hàng 1").disabled, true, "đang ở min");
  await click(button(container, "+ Thêm mục"));
  assert.deepEqual(last(), { rows: [{ n: 1, label: "A" }, { n: 0, label: "" }] });
  await type(byPath(container, "rows.0.n"), "x");
  await click(button(container, "Xuống dưới: Hàng 1"));
  assert.equal(byPath(container, "rows.1.n").value, "x", "ô sai đi theo dòng");
  assert.equal(submitButton(container).disabled, true);
});

test("richText: hai link trùng đích và chữ giữ nhãn riêng; nghiêng, danh sách, link trên vùng chọn; chuyển VI/EN", async () => {
  const a = { kind: "page" as const, value: "bao-gia", label: { vi: "Nhãn A", en: "A" } };
  const b = { kind: "page" as const, value: "bao-gia", label: { vi: "Nhãn B", en: "B" } };
  const linkTo = (link: typeof a) => ({ type: "link" as const, link, children: [{ type: "text" as const, text: "Xem" }] });
  const vi = [
    { type: "paragraph" as const, children: [{ type: "text" as const, text: "Mở đầu" }] },
    { type: "paragraph" as const, children: [linkTo(a), { type: "text" as const, text: " và " }, linkTo(b)] },
  ];
  const schema = z.object({ body: richText() });
  const { container, last } = await render(schema, { body: { vi, en: [{ type: "paragraph", children: [{ type: "text", text: "Intro" }] }] } }, { bilingual: true });
  const area = byPath<HTMLTextAreaElement>(container, "body");
  await type(area, area.value.replace("Mở đầu", "Mở đầu mới"));
  const links = ((last() as { body: { vi: typeof vi } }).body.vi[1].children).filter((node) => node.type === "link");
  assert.deepEqual(links.map((node) => node.type === "link" && node.link.label.vi), ["Nhãn A", "Nhãn B"]);

  area.setSelectionRange(0, 6);
  await click(button(container, "Nghiêng (*chữ*)"));
  assert.deepEqual((last() as { body: { vi: typeof vi } }).body.vi[0].children[0], { type: "text", text: "Mở đầu", italic: true });
  area.setSelectionRange(0, 0);
  await click(button(container, "Danh sách gạch đầu dòng"));
  assert.equal((last() as { body: { vi: typeof vi } }).body.vi[0].type, "list");

  await click(button(container, "Tiếng Anh"));
  const en = byPath<HTMLTextAreaElement>(container, "body");
  assert.equal(en.value, "Intro");
  en.setSelectionRange(0, 5);
  await click(button(container, /^Liên kết/));
  const enBlocks = (last() as { body: { en: { children: { type: string; link?: { kind: string; value: string } }[] }[] } }).body.en;
  assert.deepEqual(enBlocks[0].children[0].link, { kind: "page", value: "", label: { vi: "Intro" } });
  assert.equal((last() as { body: { vi: typeof vi } }).body.vi[0].type, "list", "sửa EN không đụng VI");
});

test("media picker trả chậm: dòng đã đổi chỗ thì ảnh vẫn vào đúng dòng", async () => {
  const schema = z.object({ items: z.array(z.object({ image: mediaRef() })) });
  let resolve: (ref: unknown) => void = () => {};
  const pickers: Pickers = { media: () => new Promise((r) => { resolve = r; }) as never };
  const { container, last } = await render(schema, { items: [{ image: { id: "a", alt: { vi: "A" } } }, { image: { id: "b", alt: { vi: "B" } } }] }, { pickers });
  await click(container.querySelectorAll<HTMLButtonElement>("button")[[...container.querySelectorAll("button")].findIndex((el) => el.textContent === "Đổi ảnh…")]);
  await click(button(container, "Xuống dưới: Danh sách 1"));
  await act(async () => resolve({ id: "a2", alt: { vi: "A mới" } }));
  assert.deepEqual((last() as { items: { image: { id: string } }[] }).items.map((item) => item.image.id), ["b", "a2"]);
});

test("collectionQuery: chọn kiểu Số giữ khi ô trống và khóa lưu; IDs thủ công, limit, sort", async () => {
  const schema = z.object({ query: collectionQuery("projects") });
  const { container, log, last } = await render(schema, { query: { filter: {}, limit: 6 } });
  await click(button(container, "+ Thêm điều kiện"));
  const kind = container.querySelector<HTMLSelectElement>('[aria-label="Kiểu giá trị lọc 1"]')!;
  await type(kind, "number");
  assert.equal(kind.value, "number");
  assert.equal(submitButton(container).disabled, true);
  await type(container.querySelector<HTMLInputElement>('[aria-label="Tên trường lọc 1"]')!, "year");
  await type(container.querySelector<HTMLInputElement>('[aria-label="Giá trị lọc 1"]')!, "2024");
  assert.equal(submitButton(container).disabled, false);
  await type(byPath<HTMLTextAreaElement>(container, "query.ids"), "p1\np2");
  await type(byPath(container, "query.limit"), "3");
  await click(button(container, "+ Thêm"));
  await type(byPath(container, "query.sort.field"), "year");
  await type(byPath<HTMLSelectElement>(container, "query.sort.dir"), "desc");
  await click(submitButton(container));
  assert.deepEqual(log.submitted[0], { query: { filter: { year: 2024 }, limit: 3, ids: ["p1", "p2"], sort: { field: "year", dir: "desc" } } });
  assert.ok(last());
});

test("override: theo tên widget, nhãn wildcard; ưu tiên đường dẫn chính xác > wildcard > widget/kind", async () => {
  const schema = z.object({ a: mediaRef(), b: mediaRef(), rows: z.array(z.object({ title: z.string() })) });
  const Tag = (name: string) => {
    const Widget = ({ path }: FieldProps) => <output>{name}:{path.join(".")}</output>;
    Widget.displayName = `Tag(${name})`;
    return Widget;
  };
  const value = { a: { id: "1", alt: { vi: "" } }, b: { id: "2", alt: { vi: "" } }, rows: [{ title: "x" }] };
  const { container } = await render(schema, value, {
    widgets: { media: Tag("widget"), b: Tag("exact"), "rows.*.title": Tag("wild") },
    labels: { "rows.*": "Hàng" },
  });
  assert.deepEqual([...container.querySelectorAll("output")].map((el) => el.textContent), ["widget:a", "exact:b", "wild:rows.0.title"]);
  assert.match(container.textContent ?? "", /Hàng/);
});
