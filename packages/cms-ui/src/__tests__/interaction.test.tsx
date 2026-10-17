import { button, byPath, click, mount, setConfirm, submitButton, type } from "./dom.ts";
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { useState } from "react";
import { z } from "zod";
import { link, localized, mediaRef, richText, sectionRegistry, collectionQuery } from "@solar/sections";
import { SchemaForm, type SchemaFormProps } from "../SchemaForm.tsx";
import type { FieldProps, Pickers } from "../context.ts";

type Harness = { submitted: unknown[]; changes: unknown[] };

function Controlled<S extends z.ZodType>({ initial, log, ...props }: Omit<SchemaFormProps<S>, "value" | "onChange" | "onSubmit"> & { initial: unknown; log: Harness }) {
  const [value, setValue] = useState(initial);
  return <SchemaForm {...props} value={value as z.input<S>}
    onChange={(next) => { log.changes.push(next); setValue(next); }}
    onSubmit={(data) => log.submitted.push(data)} />;
}

async function render<S extends z.ZodType>(schema: S, initial: unknown, extra: Partial<SchemaFormProps<S>> = {}) {
  const log: Harness = { submitted: [], changes: [] };
  const mounted = await mount(<Controlled schema={schema} initial={structuredClone(initial)} log={log} {...extra} />);
  cleanup.push(mounted.unmount);
  return { ...mounted, log, last: () => log.changes.at(-1) };
}

const cleanup: (() => void)[] = [];
afterEach(() => { cleanup.splice(0).forEach((fn) => fn()); setConfirm(true); });

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
