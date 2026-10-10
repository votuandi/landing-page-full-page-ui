import { z } from "zod";

export type FieldWidget = "localized" | "localizedTextarea" | "media" | "link" | "richText" | "collectionQuery";
export type FieldMeta = { widget: FieldWidget; collection?: string };
export const fieldRegistry = z.registry<FieldMeta>();

/** CMS đọc cả trường đã được bọc optional/default/nullable. */
export function fieldMeta(schema: z.core.$ZodType): FieldMeta | undefined {
  const meta = fieldRegistry.get(schema);
  if (meta) return meta;
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault || schema instanceof z.ZodNullable) {
    return fieldMeta(schema.unwrap());
  }
  return undefined;
}
