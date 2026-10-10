import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { fieldMeta, richText, type RichTextValue } from "../fields";
import { RichText } from "../render/RichText";
import { SectionLink } from "../render/SectionLink";

const paragraph = { type: "paragraph" as const, children: [{ type: "text" as const, text: "[DỮ LIỆU MẪU] Nội dung" }] };

test("richText chỉ nhận JSON whitelist, có metadata và giới hạn block/text", () => {
  const schema = richText();
  const value = { vi: [paragraph], en: [] };
  assert.deepEqual(schema.parse(value), value);
  assert.deepEqual(fieldMeta(schema.optional()), { widget: "richText" });
  for (const invalid of [
    "<p>HTML thô</p>", { vi: "<p>HTML thô</p>" }, { vi: [{ type: "html", html: "<img src=x>" }] },
    { vi: Array(201).fill(paragraph) }, { vi: [{ type: "paragraph", children: [{ type: "text", text: "a".repeat(5001) }] }] },
    { vi: [{ type: "heading", level: 1, children: [] }] },
    { vi: [{ type: "paragraph", children: [{ type: "link", link: { kind: "url", value: "javascript:alert(1)", label: { vi: "" } }, children: [] }] }] },
    { vi: [{ type: "paragraph", children: [{ type: "link", link: { kind: "page", value: "", label: { vi: "" } }, children: [{ type: "link", children: [] }] }] }] },
  ]) assert.equal(schema.safeParse(invalid).success, false);
  assert.equal(schema.safeParse({ vi: Array(200).fill(paragraph) }).success, true);
});

test("RichText escape script và ảnh độc thành text React", () => {
  const html = renderToStaticMarkup(<RichText value={{ vi: [{
    type: "paragraph", children: [{ type: "text", text: '<script>alert(1)</script><img src=x onerror="alert(1)">' }],
  }] }} locale="vi" />);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.doesNotMatch(html, /<script|<img/);
});

test("RichText render heading 2..4, strong/em, list và link từ whitelist", () => {
  const marked = { type: "text" as const, text: "Đậm nghiêng", bold: true, italic: true };
  const value = richText().parse({ vi: [
    ...[2, 3, 4].map((level) => ({ type: "heading", level, children: [marked] })),
    { type: "list", ordered: false, items: [[marked]] },
    { type: "list", ordered: true, items: [[marked]] },
    { type: "paragraph", children: [{
      type: "link", link: { kind: "url", value: "https://example.com", label: { vi: "Nhãn không hiển thị" } },
      children: [{ type: "text", text: "Liên kết" }],
    }] },
  ] });
  const html = renderToStaticMarkup(<RichText value={value} locale="vi" />);
  for (const tag of ["h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "p", "a"]) assert.ok(html.includes(`<${tag}`));
  assert.match(html, /href="https:\/\/example.com" target="_blank" rel="noopener noreferrer"/);
  assert.ok(html.includes(">Liên kết</a>"));
  assert.ok(!html.includes("Nhãn không hiển thị"));
});

test("RichText dùng EN có nội dung, fallback VI khi EN thiếu/rỗng", () => {
  for (const value of [{ vi: [paragraph] }, { vi: [paragraph], en: [] }]) {
    assert.ok(renderToStaticMarkup(<RichText value={value} locale="en" />).includes("Nội dung"));
  }
  const value = { vi: [paragraph], en: [{ ...paragraph, children: [{ type: "text" as const, text: "Sample" }] }] };
  assert.ok(renderToStaticMarkup(<RichText value={value} locale="en" />).includes("Sample"));
  assert.ok(renderToStaticMarkup(<RichText value={value} locale="vi" />).includes("Nội dung"));
});

test("RichText bỏ node lạ, heading lạ và chặn URL độc dù dữ liệu chưa parse", () => {
  const value = { vi: [
    { type: "script", children: [], text: "Không render" },
    { type: "heading", level: "script", children: [{ type: "text", text: "Không render" }] },
    { type: "paragraph", children: [
      { type: "html", text: "Không render" },
      { type: "link", link: { kind: "url", value: "javascript:alert(1)", label: { vi: "" } }, children: [
        { type: "text", text: "An toàn" }, { type: "html", text: "Không render" },
      ] },
    ] },
  ] } as unknown as RichTextValue;
  const html = renderToStaticMarkup(<RichText value={value} locale="vi" />);
  assert.ok(html.includes('href="#"'));
  assert.ok(html.includes("An toàn"));
  assert.ok(!html.includes("Không render"));
  assert.doesNotMatch(html, /javascript:|<script/);
});

test("SectionLink render nhãn theo locale, children và fallback calculator có query", () => {
  const base = { kind: "page" as const, value: "dich-vu", label: { vi: "Dịch vụ", en: "Services" } };
  assert.equal(renderToStaticMarkup(<SectionLink link={base} locale="en" />), '<a href="/dich-vu">Services</a>');
  assert.equal(renderToStaticMarkup(<SectionLink link={base} locale="vi" className="text-primary">Khác</SectionLink>),
    '<a href="/dich-vu" class="text-primary">Khác</a>');
  const html = renderToStaticMarkup(<SectionLink link={{ ...base, kind: "calculator", value: "phan-khuc=factory&hoa-don=15000000" }} locale="vi" />);
  assert.ok(html.includes('href="/?phan-khuc=factory&amp;hoa-don=15000000#du-toan"'));
});

test("source sections không có API render HTML thô ngoài test", () => {
  function check(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== "__tests__") check(path);
      if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
        assert.ok(!readFileSync(path, "utf8").includes("dangerouslySetInnerHTML"), path);
      }
    }
  }
  check(resolve("src"));
});
