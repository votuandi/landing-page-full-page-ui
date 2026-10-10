import { z } from "zod";
import { link } from "./link";
import { fieldRegistry } from "./widget";

const text = z.object({
  type: z.literal("text"),
  text: z.string().max(5000),
  bold: z.boolean().optional(),
  italic: z.boolean().optional(),
});
const inline = z.discriminatedUnion("type", [
  text,
  z.object({ type: z.literal("link"), link: link(), children: z.array(text) }),
]);
const block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), children: z.array(inline) }),
  z.object({ type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3), z.literal(4)]), children: z.array(inline) }),
  z.object({ type: z.literal("list"), ordered: z.boolean(), items: z.array(z.array(inline)) }),
]);

export function richText() {
  return z.object({ vi: z.array(block).max(200), en: z.array(block).max(200).optional() })
    .register(fieldRegistry, { widget: "richText" });
}

export type RichTextValue = z.output<ReturnType<typeof richText>>;
export type RichTextBlock = z.output<typeof block>;
export type RichTextInline = z.output<typeof inline>;
export type RichTextText = z.output<typeof text>;
