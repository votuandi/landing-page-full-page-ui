import type { z } from "zod";
import { describe, unionIndex, type FieldNode } from "../schema/describe.ts";
import { getAt, setAt, type Path } from "../schema/path.ts";
import { validate } from "../SchemaForm.tsx";

export type InlineField = { path: Path; text: { vi: string; en?: string } };
export type InlineEdit = { path: Path; locale: "vi" | "en"; text: string };

export function inlineFields(schema: z.ZodType, data: unknown): InlineField[] {
  const fields: InlineField[] = [];
  function localized(path: Path, value: unknown) {
    if (value && typeof value === "object" && "vi" in value && typeof value.vi === "string") {
      fields.push({ path, text: value as InlineField["text"] });
    }
  }
  function visit(node: FieldNode, value: unknown, path: Path) {
    if (value === undefined || value === null) return;
    switch (node.kind) {
      case "widget":
        if (node.widget === "localized") localized(path, value);
        if (node.widget === "link") localized([...path, "label"], getAt(value, ["label"]));
        break;
      case "object":
        for (const field of node.fields) visit(field.node, getAt(value, [field.key]), [...path, field.key]);
        break;
      case "array":
        if (Array.isArray(value)) value.forEach((item, index) => visit(node.item, item, [...path, index]));
        break;
      case "record":
        for (const key of node.keys) visit(node.value, getAt(value, [key]), [...path, key]);
        break;
      case "union": visit(node.options[unionIndex(node, value)].node, value, path); break;
    }
  }
  visit(describe(schema), data, []);
  return fields;
}

export function applyInlineEdit(schema: z.ZodType, data: unknown, edit: InlineEdit) {
  const field = inlineFields(schema, data).find(field => field.path.length === edit.path.length && field.path.every((key, i) => key === edit.path[i]));
  if (!field) return null;
  const text = edit.text.replace(/\s+/g, " ").trim();
  const next = setAt(data, [...field.path, edit.locale], edit.locale === "en" && !text ? undefined : text);
  const result = validate(schema, next);
  return { data: next, valid: result.success, error: result.error };
}
