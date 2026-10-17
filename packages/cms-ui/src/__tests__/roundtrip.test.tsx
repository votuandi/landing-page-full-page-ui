import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { sectionRegistry, type RichTextBlock } from "@solar/sections";
import { SchemaForm, validate } from "../SchemaForm.tsx";
import { describe, unionIndex, type FieldNode } from "../schema/describe.ts";
import { numberCodec } from "../schema/codecs.ts";
import { setAt, type Path } from "../schema/path.ts";
import { blocksToMarkup, markupToBlocks } from "../richText/convert.ts";

const types = Object.values(sectionRegistry.types);

function unsupported(node: FieldNode, path: string, out: string[] = []): string[] {
  if (node.kind === "json") out.push(path);
  if (node.kind === "object") for (const field of node.fields) unsupported(field.node, `${path}.${field.key}`, out);
  if (node.kind === "array") unsupported(node.item, `${path}.*`, out);
  if (node.kind === "record") unsupported(node.value, `${path}.<key>`, out);
  if (node.kind === "union") for (const option of node.options) unsupported(option.node, `${path}|${option.value}`, out);
  return out;
}

/** Đi qua đúng codec mà ô nhập dùng: giá trị → chữ trong ô → giá trị, ghi lại bằng setAt như khi người dùng gõ. */
function throughForm(node: FieldNode, value: unknown, root: unknown, path: Path): unknown {
  if (value === undefined || value === null) return root;
  switch (node.kind) {
    case "number": {
      const codec = numberCodec(node.nullable ? "null" : node.optional ? "undefined" : undefined);
      const decoded = codec.fromInput(codec.toInput(value as number));
      assert.ok(decoded.ok, `số không đọc lại được ở ${path.join(".")}`);
      return setAt(root, path, decoded.value);
    }
    case "widget": {
      if (node.widget !== "richText") return root;
      const rich = value as { vi: RichTextBlock[]; en?: RichTextBlock[] };
      let next = setAt(root, [...path, "vi"], markupToBlocks(blocksToMarkup(rich.vi)));
      if (rich.en) next = setAt(next, [...path, "en"], markupToBlocks(blocksToMarkup(rich.en)));
      return next;
    }
    case "object": return node.fields.reduce((acc, field) =>
      throughForm(field.node, (value as Record<string, unknown>)[field.key], acc, [...path, field.key]), root);
    case "record": return node.keys.reduce((acc, key) =>
      throughForm(node.value, (value as Record<string, unknown>)[key], acc, [...path, key]), root);
    case "array": return (value as unknown[]).reduce<unknown>((acc, item, i) => throughForm(node.item, item, acc, [...path, i]), root);
    case "union": return throughForm(node.options[unionIndex(node, value)].node, value, root, path);
    default: return root;
  }
}

test("registry có đủ 28 section + header/footer", () => {
  assert.equal(types.length, 30);
});

for (const def of types) {
  test(`${def.type}: mọi trường có ô nhập, fixture → form → submit không đổi`, () => {
    const node = describe(def.schema);
    assert.deepEqual(unsupported(node, def.type), [], "có trường rơi về JSON");

    const fixture = structuredClone(def.defaults);
    const submitted = throughForm(node, fixture, fixture, []);
    const result = validate(def.schema, submitted);
    assert.ok(result.success, JSON.stringify(result.error?.issues.slice(0, 3)));
    assert.deepEqual(result.data, def.defaults);

    const html = renderToStaticMarkup(
      <SchemaForm schema={def.schema} value={fixture} onChange={() => {}} onSubmit={() => {}} bilingual />,
    );
    assert.doesNotMatch(html, /chưa có ô nhập riêng/);
    assert.doesNotMatch(html, /disabled=""[^>]*type="submit"|type="submit"[^>]*disabled=""/, "fixture hợp lệ thì nút lưu phải bật");
    assert.match(html, /<(input|textarea|select)\b/);
  });
}
