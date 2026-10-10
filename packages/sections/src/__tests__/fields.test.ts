import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import {
  collectionQuery, fieldMeta, handleCalculatorClick, link, localized, mediaRef, pickLocale, resolveLink,
} from "../fields";
import type { Link } from "../fields";

test("localized giữ VI bắt buộc, EN tùy chọn và giới hạn độ dài", () => {
  const schema = localized({ max: 5 });
  assert.deepEqual(schema.parse({ vi: "", en: "Solar" }), { vi: "", en: "Solar" });
  assert.equal(schema.safeParse({ en: "Solar" }).success, false);
  assert.equal(schema.safeParse({ vi: "123456" }).success, false);
  assert.equal(schema.safeParse({ vi: "Mẫu", en: "123456" }).success, false);
  assert.equal(pickLocale({ vi: "Mẫu", en: "Sample" }, "en"), "Sample");
  assert.equal(pickLocale({ vi: "Mẫu", en: "" }, "en"), "Mẫu");
  assert.equal(pickLocale({ vi: "Mẫu" }, "en"), "Mẫu");
  assert.equal(pickLocale({ vi: "Mẫu", en: "Sample" }, "vi"), "Mẫu");
});

test("fieldMeta đọc widget qua optional, default, nullable và không dùng globalRegistry", () => {
  const schema = localized();
  assert.deepEqual(fieldMeta(schema.optional().default({ vi: "" }).nullable()), { widget: "localized" });
  assert.deepEqual(fieldMeta(localized({ multiline: true })), { widget: "localizedTextarea" });
  assert.equal(fieldMeta(z.string().optional()), undefined);
  assert.equal(z.globalRegistry.get(schema), undefined);
  assert.deepEqual(fieldMeta(mediaRef()), { widget: "media" });
  assert.deepEqual(fieldMeta(collectionQuery("projects").optional()), {
    widget: "collectionQuery", collection: "projects",
  });
});

test("mediaRef yêu cầu id, alt bản địa hóa và focal trong 0..1", () => {
  const schema = mediaRef();
  const valid = { id: "media-1", alt: { vi: "" }, focal: { x: 0, y: 1 } };
  assert.deepEqual(schema.parse(valid), valid);
  assert.deepEqual(schema.parse({ id: "media-1", alt: { vi: "Ảnh" } }), { id: "media-1", alt: { vi: "Ảnh" } });
  for (const invalid of [
    { ...valid, id: "" }, { id: "media-1" },
    { ...valid, focal: { x: -0.1, y: 0 } }, { ...valid, focal: { x: 0, y: 1.1 } },
  ]) assert.equal(schema.safeParse(invalid).success, false);
});

test("collectionQuery áp default và chỉ nhận filter scalar, sort và id hợp lệ", () => {
  const schema = collectionQuery("projects");
  assert.deepEqual(schema.parse({}), { filter: {}, limit: 6 });
  const valid = { filter: { segment: "farm", power: 20, featured: true }, sort: { field: "date", dir: "desc" }, limit: 48, ids: ["project-1"] };
  assert.deepEqual(schema.parse(valid), valid);
  for (const invalid of [
    { limit: 0 }, { limit: 49 }, { limit: 1.5 }, { filter: { nested: {} } },
    { sort: { field: "", dir: "asc" } }, { sort: { field: "date", dir: "up" } },
    { ids: [""] }, { ids: Array(49).fill("project-1") },
  ]) assert.equal(schema.safeParse(invalid).success, false);
});

const label = { vi: "[DỮ LIỆU MẪU] Liên kết" };

test("link parse đủ sáu kind, label và metadata", () => {
  const schema = link();
  assert.deepEqual(fieldMeta(schema), { widget: "link" });
  for (const [kind, value] of [
    ["page", ""], ["page", "dich-vu/dien-mat-troi"], ["page", "san-pham?category=panel&brand=A"], ["url", "https://example.com/path"],
    ["url", "http://example.com"], ["anchor", "du-toan"], ["phone", "+84 912 345 678"],
    ["zalo", "0912345678"], ["calculator", ""], ["calculator", "phan-khuc=factory&hoa-don=15000000"],
  ]) assert.deepEqual(schema.parse({ kind, value, label }), { kind, value, label });
  assert.equal(schema.safeParse({ kind: "page", value: "" }).success, false);
  assert.equal(schema.safeParse({ kind: "unknown", value: "", label }).success, false);
});

test("link chặn protocol nguy hiểm, slug thoát đường dẫn và số điện thoại sai", () => {
  const schema = link();
  for (const value of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "//evil.com", "not a URL"]) {
    assert.equal(schema.safeParse({ kind: "url", value, label }).success, false);
  }
  for (const value of ["../admin", "a/../admin", "/admin", "//evil.com", "a#b", "a\\b", "a?b=1#c", "a?b c", "?//x#y"]) {
    assert.equal(schema.safeParse({ kind: "page", value, label }).success, false);
  }
  for (const value of ["#du-toan", "", "a/b"]) {
    assert.equal(schema.safeParse({ kind: "anchor", value, label }).success, false);
  }
  for (const kind of ["phone", "zalo"]) {
    for (const value of ["", "123", "123456789012"]) {
      assert.equal(schema.safeParse({ kind, value, label }).success, false);
    }
  }
});

test("resolveLink tạo href và cờ external đúng cho mọi kind", () => {
  const cases: [Link["kind"], string, string, boolean][] = [
    ["page", "", "/", false], ["page", "dich-vu/dien-mat-troi", "/dich-vu/dien-mat-troi", false],
    ["page", "san-pham?category=panel", "/san-pham?category=panel", false],
    ["url", "https://example.com", "https://example.com", true],
    ["anchor", "du-toan", "#du-toan", false],
    ["phone", "+84 912 345 678", "tel:0912345678", false],
    ["zalo", "0912345678", "https://zalo.me/0912345678", true],
  ];
  for (const [kind, value, href, external] of cases) {
    assert.deepEqual(resolveLink({ kind, value, label }), { href, external });
  }
  for (const value of ["javascript:alert(1)", "data:text/html,bad", "//evil.com"]) {
    assert.equal(resolveLink({ kind: "url", value, label }).href, "#");
  }
});

test("calculator đọc slug và chuẩn hóa query cho fallback không JavaScript", () => {
  const resolved = resolveLink({
    kind: "calculator", value: "phan-khuc=nha-xuong&hoa-don=15000000&nhu-cau=Mau&nguon=story-cta", label,
  });
  assert.deepEqual(resolved, {
    href: "/?phan-khuc=factory&hoa-don=15000000&nhu-cau=Mau&nguon=story-cta#du-toan",
    external: false,
    calculator: { segment: "factory", bill: 15000000, topic: "Mau", source: "story-cta" },
  });
  assert.equal(resolveLink({ kind: "calculator", value: "", label }).href, "/#du-toan");
  const invalid = resolveLink({ kind: "calculator", value: "phan-khuc=unknown&hoa-don=-1&junk=1", label });
  assert.equal(invalid.href, "/#du-toan");
  assert.equal(invalid.calculator?.segment, undefined);
  assert.equal(invalid.calculator?.bill, undefined);
});

test("click calculator thường chặn navigation và gửi prefill đúng", () => {
  let prevented = false;
  const received: unknown[] = [];
  const prefill = { segment: "factory" as const, bill: 15000000 };
  handleCalculatorClick({
    button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false,
    preventDefault: () => { prevented = true; },
  }, prefill, (value) => received.push(value));
  assert.equal(prevented, true);
  assert.deepEqual(received, [prefill]);
});

test("click có phím bổ trợ hoặc nút chuột khác giữ navigation trình duyệt", () => {
  for (const modifier of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { button: 2 }]) {
    handleCalculatorClick({
      button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false,
      preventDefault: () => assert.fail("Không được chặn navigation"), ...modifier,
    }, {}, () => assert.fail("Không được gọi bus"));
  }
});
