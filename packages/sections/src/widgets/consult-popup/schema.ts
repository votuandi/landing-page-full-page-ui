import { z } from "zod";
import { defineSectionType } from "../../define";
import { localized, link } from "../../fields";
import { fixture } from "./fixtures";

export const consultPopupSchema = z.object({
  delayMs: z.number().int().min(0).max(600000).default(30000), scrollRatio: z.number().min(0.1).max(1).default(0.6), autoOpen: z.boolean().default(true),
  title: localized(), description: localized(), openFormLabel: localized(), submitLabel: localized(),
  channels: z.array(z.object({ kind: z.enum(["zalo", "messenger"]), link: link() })).max(2), success: localized(), privacy: localized(),
});
export const consultPopup = defineSectionType({
  type: "consult-popup", schemaVersion: 1, schema: consultPopupSchema, defaults: consultPopupSchema.parse(fixture),
  meta: {"label": {"vi": "consult-popup"}, "icon": "consult-popup"},
});
