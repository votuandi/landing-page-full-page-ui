import { z } from "zod";
import { fieldRegistry } from "./fields/widget";

export type CollectedRefs = { media: string[]; collections: Record<string, string[]> };

/** Walk Zod 4 schemas without validating content (CMS validation is separate). */
export function collectRefs(schema: z.ZodType, value: unknown): CollectedRefs {
  const refs: CollectedRefs = { media: [], collections: {} };
  const object = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === "object" && !Array.isArray(value);
  function walk(node: z.core.$ZodType, value: unknown): void {
    const meta = fieldRegistry.get(node);
    if (meta?.widget === "media" && object(value) && typeof value.id === "string") refs.media.push(value.id);
    if (meta?.widget === "collectionQuery" && meta.collection && object(value)) {
      // Define an own property even for names such as __proto__; unknown names are rejected by DB.
      if (!Object.prototype.hasOwnProperty.call(refs.collections, meta.collection)) Object.defineProperty(refs.collections, meta.collection, { value: [], enumerable: true, writable: true });
      if (Array.isArray(value.ids)) refs.collections[meta.collection].push(...value.ids.filter((id): id is string => typeof id === "string"));
    }
    if (node instanceof z.ZodOptional || node instanceof z.ZodNullable || node instanceof z.ZodDefault || node instanceof z.ZodNonOptional || node instanceof z.ZodCatch) {
      walk(node.unwrap(), value);
    } else if (node instanceof z.ZodObject && object(value)) {
      for (const [key, child] of Object.entries(node.shape)) walk(child as z.ZodType, value[key]);
    } else if (node instanceof z.ZodArray && Array.isArray(value)) {
      for (const item of value) walk(node.element, item);
    } else if (node instanceof z.ZodUnion) {
      // Inspect all branches, including partial objects, so invalid sibling fields cannot hide refs.
      for (const option of node.options) walk(option, value);
    } else if (node instanceof z.ZodRecord && object(value)) {
      for (const item of Object.values(value)) walk(node.valueType, item);
    } else if (node instanceof z.ZodPipe) {
      walk(node.in, value);
      walk(node.out, value);
    } else if (node instanceof z.ZodLazy) {
      walk(node.unwrap(), value);
    }
  }
  walk(schema, value);
  refs.media = [...new Set(refs.media)];
  for (const [name, ids] of Object.entries(refs.collections)) refs.collections[name] = [...new Set(ids)];
  return refs;
}
