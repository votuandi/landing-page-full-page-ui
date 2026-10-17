import { z } from "zod";
import { fieldMeta, type FieldWidget } from "@solar/sections";

type Flags = { optional?: boolean; nullable?: boolean; defaultValue?: unknown };
export type FieldNode = Flags & (
  | { kind: "string"; multiline?: boolean; max?: number }
  | { kind: "number"; int?: boolean; min?: number; max?: number }
  | { kind: "boolean" }
  | { kind: "enum"; options: readonly (string | number)[] }
  | { kind: "widget"; widget: FieldWidget; collection?: string; schema: z.ZodType }
  | { kind: "object"; fields: { key: string; node: FieldNode }[] }
  | { kind: "record"; keys: readonly string[]; value: FieldNode }
  | { kind: "array"; item: FieldNode; min?: number; max?: number }
  /** Có discriminator → chọn nhánh theo thẻ; không có → nhánh đầu tiên mà giá trị parse được. */
  | { kind: "union"; discriminator?: string; options: { value: string; node: FieldNode; schema: z.ZodType }[] }
  | { kind: "json" }
);
export type FieldKind = FieldNode["kind"];

type Def = { type: string; [key: string]: unknown };
const defOf = (schema: z.core.$ZodType) => schema._zod.def as unknown as Def;

function lengthLimits(schema: z.core.$ZodType): { min?: number; max?: number } {
  const out: { min?: number; max?: number } = {};
  for (const check of (defOf(schema).checks as z.core.$ZodCheck[] | undefined) ?? []) {
    const def = check._zod.def as unknown as { check: string; minimum?: number; maximum?: number };
    if (def.check === "min_length") out.min = def.minimum;
    if (def.check === "max_length") out.max = def.maximum;
  }
  return out;
}

/** Biến zod schema thành cây trường cho form. Dạng chưa hỗ trợ → `json` (test bảo đảm không type nào rơi vào đây). */
export function describe(schema: z.core.$ZodType, flags: Flags = {}): FieldNode {
  const meta = fieldRegistryMeta(schema);
  if (meta) return { ...flags, kind: "widget", widget: meta.widget, collection: meta.collection, schema: schema as z.ZodType };
  const def = defOf(schema);
  switch (def.type) {
    case "optional": return describe(def.innerType as z.core.$ZodType, { ...flags, optional: true });
    case "nullable": return describe(def.innerType as z.core.$ZodType, { ...flags, nullable: true });
    case "default":
    case "prefault": return describe(def.innerType as z.core.$ZodType, { ...flags, defaultValue: (schema as z.ZodDefault).def.defaultValue });
    case "pipe": return describe(def.in as z.core.$ZodType, flags);
    case "string": {
      const s = schema as z.ZodString;
      return { ...flags, kind: "string", max: s.maxLength ?? undefined };
    }
    case "number": {
      const n = schema as z.ZodNumber;
      const finite = (v: number | null) => (v === null || !Number.isFinite(v) ? undefined : v);
      return { ...flags, kind: "number", int: n.isInt || undefined, min: finite(n.minValue), max: finite(n.maxValue) };
    }
    case "boolean": return { ...flags, kind: "boolean" };
    case "enum": return { ...flags, kind: "enum", options: (schema as z.ZodEnum).options as (string | number)[] };
    case "literal": return { ...flags, kind: "enum", options: [...(def.values as (string | number)[])] };
    case "object": {
      const shape = (schema as z.ZodObject).shape as Record<string, z.core.$ZodType>;
      // `link().refine(...)` tạo instance mới nên mất meta; nhận lại theo hình dạng của link().
      if (Object.keys(shape).join() === "kind,value,label" && fieldMeta(shape.label)?.widget === "localized") {
        return { ...flags, kind: "widget", widget: "link", schema: schema as z.ZodType };
      }
      return { ...flags, kind: "object", fields: Object.entries(shape).map(([key, value]) => ({ key, node: describe(value) })) };
    }
    case "record": {
      const key = describe(def.keyType as z.core.$ZodType);
      if (key.kind !== "enum") return { ...flags, kind: "json" };
      return { ...flags, kind: "record", keys: key.options.map(String), value: describe(def.valueType as z.core.$ZodType) };
    }
    case "array": return { ...flags, kind: "array", item: describe(def.element as z.core.$ZodType), ...lengthLimits(schema) };
    case "union": {
      const options = def.options as z.core.$ZodType[];
      const literals = options.map((option) => describe(option));
      if (literals.every((node) => node.kind === "enum")) {
        return { ...flags, kind: "enum", options: literals.flatMap((node) => (node.kind === "enum" ? node.options : [])) };
      }
      const discriminator = def.discriminator as string | undefined;
      if (literals.some((node) => node.kind === "json" || (discriminator && node.kind !== "object"))) return { ...flags, kind: "json" };
      return {
        ...flags, kind: "union", discriminator,
        options: literals.map((node, i) => {
          const tag = discriminator && node.kind === "object" ? node.fields.find((field) => field.key === discriminator)?.node : undefined;
          return { value: tag?.kind === "enum" ? String(tag.options[0]) : String(i), node, schema: options[i] as z.ZodType };
        }),
      };
    }
    default: return { ...flags, kind: "json" };
  }
}

function fieldRegistryMeta(schema: z.core.$ZodType) {
  // Chỉ đọc meta đăng ký trực tiếp; wrapper optional/default được describe bóc ở trên để giữ flags.
  const type = defOf(schema).type;
  return type === "optional" || type === "nullable" || type === "default" ? undefined : fieldMeta(schema);
}

/** Giá trị khởi tạo khi thêm phần tử mảng, bật trường tùy chọn hoặc đổi nhánh union. */
export function defaultFor(node: FieldNode): unknown {
  if (node.defaultValue !== undefined) return structuredClone(node.defaultValue);
  switch (node.kind) {
    case "string": return "";
    case "number": return node.min !== undefined && node.min > 0 ? node.min : 0;
    case "boolean": return false;
    case "enum": return node.options[0];
    case "widget": return WIDGET_DEFAULTS[node.widget](node.schema);
    case "object": return Object.fromEntries(node.fields
      .filter((field) => !field.node.optional)
      .map((field) => [field.key, field.node.nullable && field.node.defaultValue === undefined ? null : defaultFor(field.node)]));
    case "record": return Object.fromEntries(node.keys.map((key) => [key, defaultFor(node.value)]));
    case "array": return Array.from({ length: node.min ?? 0 }, () => defaultFor(node.item));
    case "union": return defaultFor(node.options[0].node);
    case "json": return null;
  }
}

const WIDGET_DEFAULTS: Record<FieldWidget, (schema: z.ZodType) => unknown> = {
  localized: () => ({ vi: "" }),
  localizedTextarea: () => ({ vi: "" }),
  media: () => ({ id: "", alt: { vi: "" } }),
  link: () => ({ kind: "page", value: "", label: { vi: "" } }),
  richText: () => ({ vi: [] }),
  collectionQuery: (schema) => schema.parse({}),
};

type UnionNode = Extract<FieldNode, { kind: "union" }>;

/** Nhánh hiện tại của giá trị trong union. */
export function unionIndex(node: UnionNode, value: unknown): number {
  if (node.discriminator) {
    const tag = (value as Record<string, unknown> | null)?.[node.discriminator];
    return Math.max(0, node.options.findIndex((option) => option.value === String(tag)));
  }
  const parsed = node.options.findIndex((option) => option.schema.safeParse(value).success);
  if (parsed >= 0) return parsed;
  const shaped = node.options.findIndex((option) => (option.node.kind === "string") === (typeof value === "string"));
  return Math.max(0, shaped);
}
