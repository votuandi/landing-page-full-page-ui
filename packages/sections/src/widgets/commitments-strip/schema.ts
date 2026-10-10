import { z } from "zod";
import { defineSectionType } from "../../define";
import { localized } from "../../fields";
import { fixture } from "./fixtures";

export const commitmentsStripSchema = z.object({
  ariaLabel: localized(), items: z.array(z.object({ icon: z.enum(["survey", "warranty", "paperwork", "maintenance"]), title: localized(), description: localized() })).min(1).max(4),
});
export const commitmentsStrip = defineSectionType({
  type: "commitments-strip", schemaVersion: 1, schema: commitmentsStripSchema, defaults: commitmentsStripSchema.parse(fixture),
  meta: {"label": {"vi": "commitments-strip"}, "icon": "commitments-strip"},
});
