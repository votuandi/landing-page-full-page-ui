import { button, byPath, click, mount, submitButton, type } from "./dom.ts";
import { render } from "./harness.tsx";
import assert from "node:assert/strict";
import { test } from "node:test";
import { act, useState } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { z } from "zod";
import { collectionQuery, mediaRef, richText, sectionRegistry } from "@solar/sections";
import { SchemaForm } from "../SchemaForm.tsx";
import { describe, unionIndex, type FieldNode } from "../schema/describe.ts";
import type { FieldProps, Pickers } from "../context.ts";

const calculator = sectionRegistry.types.calculator;
const GROUPS = ["object", "widget", "array", "union", "record"];

/** Đường dẫn mọi trường lá phải có control (nhóm tùy chọn chưa bật chỉ cần nút "+ Thêm"). */
function leafPaths(node: FieldNode, value: unknown, path: string[], out: string[] = []): string[] {
  const at = (...keys: (string | number)[]) => [...path, ...keys.map(String)].join(".");
  if (value === undefined && node.optional && GROUPS.includes(node.kind)) return out;
  const record = value as Record<string, unknown> | undefined;
  switch (node.kind) {
    case "enum": if (node.options.length > 1 || node.optional) out.push(at()); break;
    case "string": case "number": case "boolean": out.push(at()); break;
    case "widget":
      if (node.widget === "media") {
        out.push(at("id"), at("alt"));
        if (record?.focal) out.push(at("focal", "x"), at("focal", "y"));
      } else if (node.widget === "link") out.push(at("kind"), at("value"), at("label"));
      else if (node.widget === "collectionQuery") out.push(at("limit"), at("ids"));
      else out.push(at());
      break;
    case "object": node.fields.forEach((field) => leafPaths(field.node, record?.[field.key], [...path, field.key], out)); break;
    case "record": node.keys.forEach((key) => leafPaths(node.value, record?.[key], [...path, key], out)); break;
    case "array": ((value as unknown[]) ?? []).forEach((item, i) => leafPaths(node.item, item, [...path, String(i)], out)); break;
    case "union": out.push(at("$branch")); leafPaths(node.options[unionIndex(node, value)].node, value, path, out); break;
    default: out.push(`JSON:${at()}`);
  }
  return out;
}

for (const def of Object.values(sectionRegistry.types)) {
  test(`${def.type}: mọi trường lá có control đúng đường dẫn`, async () => {
    const { container } = await render(def.schema, def.defaults, { bilingual: true });
    const ids = new Set([...container.querySelectorAll("[id]")].map((el) => el.id.slice(el.id.indexOf("-") + 1)));
    assert.deepEqual(leafPaths(describe(def.schema), def.defaults, []).filter((path) => !ids.has(path)), []);
  });
}

test("SSR hai lần rồi hydrate: không lệch id/aria; HTML server không ẩn nội dung thu gọn", async () => {
  const props = { schema: calculator.schema, value: calculator.defaults, onChange() {}, onSubmit() {} };
  renderToString(<SchemaForm {...props} />);
  const html = renderToString(<SchemaForm {...props} />);
  assert.doesNotMatch(html, /\shidden=""/, "khi tắt JS mọi dòng phải đọc được");
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  const errors: unknown[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => { errors.push(args); };
  try {
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => { root = hydrateRoot(container, <SchemaForm {...props} />, { onRecoverableError: (error) => errors.push(error) }); });
    assert.deepEqual(errors, []);
    assert.ok(container.querySelector('[aria-expanded="false"]'), "sau hydrate danh sách dài thu gọn lại");
    act(() => root!.unmount());
  } finally {
    console.error = original;
    container.remove();
  }
});

test("dòng thu gọn có ô số đang sai: tiêu đề báo Có lỗi, mở lại vẫn thấy chữ đã gõ", async () => {
  const { container } = await render(calculator.schema, calculator.defaults);
  const toggle = button(container, /Bậc giá 1 ·/);
  if (toggle.getAttribute("aria-expanded") === "false") await click(toggle);
  await type(byPath(container, "tariffs.household.tiers.0.price"), "abc");
  await click(toggle);
  assert.equal(toggle.getAttribute("aria-expanded"), "false");
  assert.match(toggle.textContent ?? "", /Có lỗi/);
  await click(toggle);
  assert.equal(byPath(container, "tariffs.household.tiers.0.price").value, "abc");
  assert.equal(submitButton(container).disabled, true);
});

test("richText: danh sách đánh số trên vùng chọn nhiều dòng rồi lưu", async () => {
  const schema = z.object({ body: richText() });
  const { container, log } = await render(schema, { body: { vi: [{ type: "paragraph", children: [{ type: "text", text: "Một\nHai" }] }] } });
  const area = byPath<HTMLTextAreaElement>(container, "body");
  area.setSelectionRange(0, area.value.length);
  await click(button(container, "Danh sách đánh số"));
  await click(submitButton(container));
  assert.deepEqual(log.submitted[0], { body: { vi: [{ type: "list", ordered: true, items: [
    [{ type: "text", text: "Một" }], [{ type: "text", text: "Hai" }],
  ] }] } });
});

test("media picker trả về sau khi dòng đã bị xóa: không ghi, không lỗi", async () => {
  const schema = z.object({ items: z.array(z.object({ image: mediaRef() })) });
  let resolve: (ref: unknown) => void = () => {};
  const pickers: Pickers = { media: () => new Promise((done) => { resolve = done; }) as never };
  const initial = { items: [{ image: { id: "a", alt: { vi: "" } } }, { image: { id: "b", alt: { vi: "" } } }] };
  const { container, last } = await render(schema, initial, { pickers });
  await click([...container.querySelectorAll("button")].find((el) => el.textContent === "Đổi ảnh…")!);
  await click(button(container, "Xóa: Danh sách 1"));
  await act(async () => resolve({ id: "a2", alt: { vi: "" } }));
  assert.deepEqual(last(), { items: [{ image: { id: "b", alt: { vi: "" } } }] });
});

test("bộ lọc: khóa số đổi thứ tự không lệch kiểu, xóa trắng số khóa lưu, khóa trùng giữ dòng, boolean", async () => {
  const schema = z.object({ query: collectionQuery("projects") });
  const { container, log } = await render(schema, { query: { filter: { a: "text", b: 42 }, limit: 6 } });
  const field = <T extends Element = HTMLInputElement>(label: string) => container.querySelector<T>(`[aria-label="${label}"]`)!;
  await type(field("Tên trường lọc 2"), "1");
  assert.deepEqual([field<HTMLSelectElement>("Kiểu giá trị lọc 1").value, field<HTMLSelectElement>("Kiểu giá trị lọc 2").value], ["string", "number"]);
  assert.equal(submitButton(container).disabled, false);
  await type(field("Giá trị lọc 2"), "");
  assert.equal(submitButton(container).disabled, true);
  await type(field("Giá trị lọc 2"), "7");
  await type(field("Tên trường lọc 2"), "a");
  assert.equal(container.querySelectorAll('[aria-label^="Tên trường lọc"]').length, 2, "khóa trùng không làm mất dòng");
  assert.match(container.textContent ?? "", /Tên trường lọc bị trùng/);
  assert.equal(submitButton(container).disabled, true);
  await type(field("Tên trường lọc 2"), "featured");
  await type(field<HTMLSelectElement>("Kiểu giá trị lọc 2"), "boolean");
  await type(field<HTMLSelectElement>("Giá trị lọc 2"), "false");
  await click(submitButton(container));
  assert.deepEqual(log.submitted[0], { query: { filter: { a: "text", featured: false }, limit: 6 } });
});

test("nhãn wildcard cho dòng mảng object (khác nhãn mặc định) cùng lúc với override widget", async () => {
  const schema = z.object({ rows: z.array(z.object({ title: z.string(), image: mediaRef() })) });
  const Media = ({ path }: FieldProps) => <output>media:{path.join(".")}</output>;
  Media.displayName = "Media";
  const { container } = await render(schema, { rows: [{ title: "x", image: { id: "1", alt: { vi: "" } } }] }, {
    labels: { "rows.*": "TEN_RIENG", "rows.*.title": "Tiêu đề dòng" }, widgets: { media: Media },
  });
  assert.ok(button(container, "Xóa: TEN_RIENG 1"));
  assert.match(container.textContent ?? "", /Tiêu đề dòng/);
  assert.equal(container.querySelector("output")?.textContent, "media:rows.0.image");
});

test("richText qua form: xóa link đầu trong hai link trùng, nhãn có \ | xuống dòng → lưu giữ đúng metadata", async () => {
  const schema = z.object({ body: richText() });
  const page = (label: { vi: string; en?: string }) => ({ type: "link" as const, link: { kind: "page" as const, value: "bao-gia", label },
    children: [{ type: "text" as const, text: "Xem" }] });
  const a = page({ vi: "Nhãn A", en: "A" });
  const b = page({ vi: "A\\", en: "B|C\ndòng 2" });
  const c = page({ vi: "Nhãn\nhai dòng" });
  const initial = { body: { vi: [
    { type: "paragraph", children: [{ type: "text", text: "Mở đầu" }] },
    { type: "paragraph", children: [a, { type: "text", text: " và " }, b, { type: "text", text: " rồi " }, c] },
  ] } };
  const { container, log } = await render(schema, initial);
  const area = byPath<HTMLTextAreaElement>(container, "body");
  const markup = area.value;
  await type(area, markup.replace("Mở đầu", "Mở đầu mới").replace(/\[Xem\]\(\/bao-gia \["Nhãn A","A"\]\) và /, ""));
  await click(submitButton(container));
  assert.deepEqual(log.submitted[0], { body: { vi: [
    { type: "paragraph", children: [{ type: "text", text: "Mở đầu mới" }] },
    { type: "paragraph", children: [b, { type: "text", text: " rồi " }, c] },
  ] } });
});

function Remote({ schema, initial, onReady, onSubmit }: {
  schema: z.ZodType; initial: unknown; onReady(set: (next: unknown) => void): void; onSubmit(data: unknown): void;
}) {
  const [value, setValue] = useState(initial);
  onReady(setValue);
  return <SchemaForm schema={schema} value={value as never} onChange={setValue} onSubmit={onSubmit} />;
}

test("controlled value: parent thay bộ lọc → UI cập nhật, sửa tiếp không ghi đè dữ liệu mới; draft đang gõ được giữ", async () => {
  const schema = z.object({ query: collectionQuery("projects") });
  let setValue: (next: unknown) => void = () => {};
  const submitted: unknown[] = [];
  const { container, unmount } = await mount(<Remote schema={schema} initial={{ query: { filter: { a: "old" }, limit: 6 } }}
    onReady={(set) => { setValue = set; }} onSubmit={(data) => submitted.push(data)} />);
  try {
    const field = <T extends Element = HTMLInputElement>(label: string) => container.querySelector<T>(`[aria-label="${label}"]`)!;
    await act(async () => setValue({ query: { filter: { b: "new" }, limit: 6 } }));
    assert.equal(field("Tên trường lọc 1").value, "b");
    await type(field("Giá trị lọc 1"), "changed");
    await click(submitButton(container));
    assert.deepEqual(submitted[0], { query: { filter: { b: "changed" }, limit: 6 } });
    // Draft kiểu Số đang trống vẫn giữ sau phản hồi của chính thao tác.
    await type(field<HTMLSelectElement>("Kiểu giá trị lọc 1"), "number");
    assert.equal(field<HTMLSelectElement>("Kiểu giá trị lọc 1").value, "number");
    assert.equal(submitButton(container).disabled, true);
  } finally {
    unmount();
  }
});

test("override widget trên chính dòng object của mảng: chính xác và wildcard", async () => {
  const schema = z.object({ rows: z.array(z.object({ title: z.string() })), cols: z.array(z.object({ title: z.string() })) });
  const Row = ({ path, label }: FieldProps) => <output>{label}:{path.join(".")}</output>;
  Row.displayName = "Row";
  const Exact = ({ path }: FieldProps) => <output>exact:{path.join(".")}</output>;
  Exact.displayName = "Exact";
  const { container } = await render(schema, { rows: [{ title: "a" }, { title: "b" }], cols: [{ title: "c" }] }, {
    widgets: { "rows.*": Row, "cols.0": Exact },
  });
  assert.deepEqual([...container.querySelectorAll("output")].map((el) => el.textContent), ["Hàng 1:rows.0", "Hàng 2:rows.1", "exact:cols.0"]);
  assert.equal(container.querySelectorAll('[id$="-rows.0.title"]').length, 0, "không dựng control mặc định khi đã override");
});

test("controlled value khi bản nháp đang trùng khóa: parent truyền bộ lọc hợp lệ → dựng lại đủ khóa, sửa và lưu đúng", async () => {
  const schema = z.object({ query: collectionQuery("projects") });
  let setValue: (next: unknown) => void = () => {};
  const submitted: unknown[] = [];
  const { container, unmount } = await mount(<Remote schema={schema} initial={{ query: { filter: { a: "same", b: "same" }, limit: 6 } }}
    onReady={(set) => { setValue = set; }} onSubmit={(data) => submitted.push(data)} />);
  try {
    const field = (label: string) => container.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)!;
    await type(field("Tên trường lọc 2"), "a");
    assert.equal(submitButton(container).disabled, true);
    await act(async () => setValue({ query: { filter: { a: "same", b: "same" }, limit: 6 } }));
    assert.deepEqual([field("Tên trường lọc 1").value, field("Tên trường lọc 2").value], ["a", "b"]);
    assert.doesNotMatch(container.textContent ?? "", /Tên trường lọc bị trùng/);
    await type(field("Giá trị lọc 2"), "moi");
    await click(submitButton(container));
    assert.deepEqual(submitted[0], { query: { filter: { a: "same", b: "moi" }, limit: 6 } });
  } finally {
    unmount();
  }
});
