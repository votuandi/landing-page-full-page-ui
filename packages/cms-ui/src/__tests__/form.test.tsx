import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { z } from "zod";
import { link, localized, mediaRef, richText, sectionRegistry } from "@solar/sections";
import { SchemaForm, validate } from "../SchemaForm.tsx";
import { defaultFor, describe, unionIndex } from "../schema/describe.ts";
import { numberCodec } from "../schema/codecs.ts";
import { getAt, issuesByPath, setAt } from "../schema/path.ts";
import { blocksToMarkup, markupToBlocks } from "../richText/convert.ts";
import { toFilterValue } from "../widgets/CollectionQueryField.tsx";
import type { FieldProps } from "../context.ts";

const calculator = sectionRegistry.types.calculator;

test("calculator: bảng giá điện, đơn giá/kWp, hệ số sản lượng là ô nhập theo phân khúc/vùng", () => {
  const node = describe(calculator.schema);
  assert.equal(node.kind, "object");
  const field = (key: string) => (node.kind === "object" ? node.fields.find((f) => f.key === key)?.node : undefined);
  const tariffs = field("tariffs");
  assert.equal(tariffs?.kind, "record");
  assert.deepEqual(tariffs?.kind === "record" && tariffs.keys, ["household", "shop", "factory", "farm"]);
  assert.equal(tariffs?.kind === "record" && tariffs.value.kind, "union");
  assert.equal(field("pricePerKwp")?.kind, "record");
  assert.equal(field("peakSunHours")?.kind, "record");
  const system = field("system");
  assert.equal(system?.kind === "object" && system.fields.find((f) => f.key === "performanceRatio")?.node.kind, "number");

  let value = structuredClone(calculator.defaults) as Record<string, any>;
  const tierPath = ["tariffs", "household", "tiers", 0, "price"];
  assert.equal(getAt(value, ["tariffs", "household", "kind"]), "tiered");
  value = setAt(value, tierPath, 1999);
  value = setAt(value, ["pricePerKwp", "household"], 11_500_000);
  value = setAt(value, ["peakSunHours", "nam-bo"], 4.8);
  value = setAt(value, ["system", "performanceRatio"], 0.82);
  const parsed = validate(calculator.schema, value);
  assert.ok(parsed.success);
  assert.equal(getAt(parsed.data, tierPath), 1999);
  assert.equal(getAt(parsed.data, ["pricePerKwp", "household"]), 11_500_000);
  assert.equal(getAt(parsed.data, ["peakSunHours", "nam-bo"]), 4.8);
  assert.equal(calculator.defaults.pricePerKwp.household === 11_500_000, false, "fixture không bị sửa tại chỗ");
});

test("calculator: nhập sai kiểu bị chặn, lỗi tiếng Việt đúng chỗ", () => {
  const codec = numberCodec();
  for (const input of ["abc", "", "12a", "1.2.3"]) assert.equal(codec.fromInput(input).ok, false, input);
  assert.deepEqual(codec.fromInput("0,82"), { ok: true, value: 0.82 });
  assert.deepEqual(codec.fromInput("11 500 000"), { ok: true, value: 11_500_000 });
  assert.deepEqual(numberCodec("null").fromInput(""), { ok: true, value: null });
  // Ô hiển thị kiểu Việt Nam và đọc lại đúng số.
  assert.equal(codec.toInput(11_500_000), "11 500 000");
  assert.equal(codec.toInput(0.82), "0,82");
  for (const n of [0, -1234.5, 1e12, 0.000001]) assert.deepEqual(codec.fromInput(codec.toInput(n)), { ok: true, value: n });

  // Kiểu sai lọt vào dữ liệu (vd. API) vẫn bị schema chặn với thông báo tiếng Việt.
  const bad = setAt(setAt(structuredClone(calculator.defaults), ["pricePerKwp", "shop"], "nhiều"), ["system", "performanceRatio"], 1.5);
  const result = validate(calculator.schema, bad);
  assert.equal(result.success, false);
  const issues = issuesByPath(result.error);
  assert.equal(issues.get("pricePerKwp.shop")?.[0], "Cần nhập số");
  assert.equal(issues.get("system.performanceRatio")?.[0], "Tối đa 1");
  const short = validate(calculator.schema, setAt(structuredClone(calculator.defaults), ["eyebrow", "vi"], "x".repeat(61)));
  assert.equal(issuesByPath(short.error).get("eyebrow.vi")?.[0], "Tối đa 60 ký tự");
  // Message riêng trong schema giữ nguyên.
  const tiers = setAt(structuredClone(calculator.defaults), ["tariffs", "household", "tiers", 0, "upTo"], null);
  assert.ok(issuesByPath(validate(calculator.schema, tiers).error).get("tariffs.household.tiers")?.includes("Bậc tăng dần, chỉ bậc cuối không giới hạn"));
});

test("SSR form calculator hiện lỗi inline và khóa nút lưu khi dữ liệu sai", () => {
  const bad = setAt(structuredClone(calculator.defaults), ["system", "performanceRatio"], 1.5);
  const html = renderToStaticMarkup(<SchemaForm schema={calculator.schema} value={bad} onChange={() => {}} onSubmit={() => {}} />);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /Còn 1 lỗi cần sửa trước khi lưu/);
  assert.match(html, /type="submit"[^>]*disabled=""|disabled=""[^>]*type="submit"/);
  assert.match(html, /Bảng giá điện/);
  assert.match(html, /Đơn giá trọn gói/);
});

test("describe: enum từ union literal, optional/default/nullable, union không discriminator", () => {
  const schema = z.object({
    level: z.union([z.literal(2), z.literal(3)]),
    note: z.string().max(10).optional(),
    count: z.number().int().min(1).default(3),
    upTo: z.number().positive().nullable(),
    url: z.union([z.url(), link().refine((value) => value.kind === "zalo")]),
  });
  const node = describe(schema);
  assert.ok(node.kind === "object");
  const [level, note, count, upTo, url] = node.fields.map((f) => f.node);
  assert.deepEqual(level, { kind: "enum", options: [2, 3] });
  assert.deepEqual(note, { kind: "string", optional: true, max: 10 });
  assert.equal(count.kind === "number" && count.int, true);
  assert.equal(count.defaultValue, 3);
  assert.equal(upTo.nullable, true);
  assert.ok(url.kind === "union" && url.discriminator === undefined);
  assert.equal(url.kind === "union" && url.options[1].node.kind === "widget" && url.options[1].node.widget, "link");
  assert.equal(url.kind === "union" && unionIndex(url, { kind: "zalo", value: "0901234567", label: { vi: "" } }), 1);
  assert.equal(url.kind === "union" && unionIndex(url, "https://a.vn"), 0);
  assert.deepEqual(defaultFor(node), { level: 2, count: 3, upTo: null, url: "" });
  assert.equal(describe(mediaRef().optional()).kind, "widget");
});

test("setAt bất biến, giữ tham chiếu nhánh không đổi, undefined xóa khóa", () => {
  const value = { a: { b: [1, 2] }, c: { d: 1 }, e: "x" as string | undefined };
  const next = setAt(value, ["a", "b", 1], 5);
  assert.deepEqual(next.a.b, [1, 5]);
  assert.deepEqual(value.a.b, [1, 2]);
  assert.equal(next.c, value.c);
  assert.equal("e" in setAt(value, ["e"], undefined), false);
});

test("richText: đậm/nghiêng/link/danh sách/tiêu đề đi hai chiều và chỉ sinh whitelist", () => {
  const blocks = markupToBlocks("## Tiêu đề\n\nCó **đậm**, *nghiêng*, ***cả hai*** và [gọi ngay](tel:0901234567).\n\n- Một\n- [Báo giá](/bao-gia)\n\n1. Bước một\n2. Bước hai");
  assert.deepEqual(blocks[0], { type: "heading", level: 2, children: [{ type: "text", text: "Tiêu đề" }] });
  assert.deepEqual(blocks[1], { type: "paragraph", children: [
    { type: "text", text: "Có " }, { type: "text", text: "đậm", bold: true }, { type: "text", text: ", " },
    { type: "text", text: "nghiêng", italic: true }, { type: "text", text: ", " },
    { type: "text", text: "cả hai", bold: true, italic: true }, { type: "text", text: " và " },
    { type: "link", link: { kind: "phone", value: "0901234567", label: { vi: "gọi ngay" } }, children: [{ type: "text", text: "gọi ngay" }] },
    { type: "text", text: "." },
  ] });
  assert.equal(blocks[2].type === "list" && blocks[2].ordered, false);
  assert.equal(blocks[3].type === "list" && blocks[3].ordered, true);
  assert.deepEqual(markupToBlocks(blocksToMarkup(blocks)), blocks);
  assert.ok(richText().safeParse({ vi: blocks }).success);
  // Ký tự đặc biệt trong chữ thường được thoát, không biến thành định dạng.
  const literal = [{ type: "paragraph" as const, children: [{ type: "text" as const, text: "- 5 * 3 = [15]" }] }];
  assert.deepEqual(markupToBlocks(blocksToMarkup(literal)), literal);
  // Link javascript: không qua được schema.
  assert.equal(richText().safeParse({ vi: markupToBlocks("[x](javascript:alert(1))") }).success, false);
});

test("bilingual: tab EN chỉ hiện khi site có bilingual; override widget theo đường dẫn", () => {
  const schema = z.object({ title: localized(), price: z.number() });
  const value = { title: { vi: "Xin chào", en: "Hello" }, price: 1 };
  const mono = renderToStaticMarkup(<SchemaForm schema={schema} value={value} onChange={() => {}} />);
  assert.doesNotMatch(mono, /aria-pressed/);
  const bi = renderToStaticMarkup(<SchemaForm schema={schema} value={value} onChange={() => {}} bilingual />);
  assert.match(bi, /aria-pressed="true"/);
  const Custom = ({ value: price }: FieldProps<number>) => <output>giá {price}</output>;
  const custom = renderToStaticMarkup(<SchemaForm schema={schema} value={value} onChange={() => {}} widgets={{ price: Custom }} />);
  assert.match(custom, /<output>giá 1<\/output>/);
});

test("collectionQuery: kiểu giá trị lọc do người dùng chọn", () => {
  assert.equal(toFilterValue("001", "string"), "001");
  assert.equal(toFilterValue("001", "number"), 1);
  assert.equal(toFilterValue("true", "string"), "true");
  assert.equal(toFilterValue("true", "boolean"), true);
  assert.equal(toFilterValue("abc", "number"), "abc");
});

test("richText: URL có ngoặc, số điện thoại có dấu cách và nhãn link riêng được giữ khi sửa chữ khác", () => {
  const link = { kind: "url" as const, value: "https://example.com/doc_(vi)", label: { vi: "Nhãn riêng", en: "Own label" } };
  const blocks = [
    { type: "paragraph" as const, children: [{ type: "text" as const, text: "Xem " },
      { type: "link" as const, link, children: [{ type: "text" as const, text: "tài liệu" }] }] },
    { type: "paragraph" as const, children: [{ type: "link" as const, link: { kind: "phone" as const, value: "0901 234 567", label: { vi: "" } },
      children: [{ type: "text" as const, text: "gọi" }] }] },
  ];
  assert.deepEqual(markupToBlocks(blocksToMarkup(blocks)), blocks);
  const edited = markupToBlocks(blocksToMarkup(blocks).replace("Xem ", "Mời xem "));
  assert.deepEqual(edited[0].type === "paragraph" && edited[0].children[1].type === "link" && edited[0].children[1].link, link);
  // Không có dữ liệu cũ: ngoặc trong URL người dùng gõ tay vẫn được đọc đúng.
  const typed = markupToBlocks("[a](https://x.vn/a_(b))");
  assert.equal(typed[0].type === "paragraph" && typed[0].children[0].type === "link" && typed[0].children[0].link.value, "https://x.vn/a_(b)");
});

test("URL đang nhập dở không làm validate ném lỗi", () => {
  for (const type of ["press", "social", "tiktok", "testimonials"] as const) {
    const def = sectionRegistry.types[type];
    assert.doesNotThrow(() => validate(def.schema, JSON.parse(JSON.stringify(def.defaults).replace(/"https:\/\/[^"]*"/g, '"h"'))));
  }
});

test("richText: mọi loại link đi hai chiều", () => {
  const kinds = [["page", "san-pham?category=panel"], ["url", "https://a.vn/x"], ["anchor", "bao-gia"], ["phone", "0901234567"],
    ["zalo", "0901234567"], ["calculator", "phan-khuc=factory&hoa-don=15000000"]] as const;
  const blocks = kinds.map(([kind, value]) => ({ type: "paragraph" as const, children: [
    { type: "link" as const, link: { kind, value, label: { vi: kind } }, children: [{ type: "text" as const, text: kind }] },
  ] }));
  assert.deepEqual(markupToBlocks(blocksToMarkup(blocks)), blocks);
  assert.ok(richText().safeParse({ vi: blocks }).success);
});

test("richText: xóa link đầu trong hai link trùng đích+chữ, link còn lại giữ nhãn của nó", () => {
  const a = { kind: "page" as const, value: "bao-gia", label: { vi: "Nhãn A", en: "A" } };
  const b = { kind: "page" as const, value: "bao-gia", label: { vi: "Nhãn B", en: "B|\"x\"" } };
  const linkTo = (link: typeof a) => ({ type: "link" as const, link, children: [{ type: "text" as const, text: "Xem" }] });
  const blocks = [{ type: "paragraph" as const, children: [linkTo(a), { type: "text" as const, text: " và " }, linkTo(b)] }];
  const markup = blocksToMarkup(blocks);
  assert.deepEqual(markupToBlocks(markup), blocks);
  const removed = markupToBlocks(markup.slice(markup.indexOf(" và ") + 4));
  assert.deepEqual(removed, [{ type: "paragraph", children: [linkTo(b)] }]);
});
