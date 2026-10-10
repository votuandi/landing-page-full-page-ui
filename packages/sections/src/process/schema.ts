import { z } from "zod";
import { defineSectionType } from "../define";
import { localized } from "../fields";
import { processFixture } from "./fixtures";

export const processSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  steps: z.array(z.object({ title: localized({ max: 100 }), description: localized({ multiline: true, max: 600 }), output: localized({ max: 200 }) })).min(2).max(8), outputLabel: localized({ max: 60 }),
});

export const process = defineSectionType({
  type: "process", schemaVersion: 1, schema: processSchema,
  defaults: processSchema.parse(processFixture),
  meta: {"label": {"vi": "Quy trình triển khai", "en": "How we deliver"}, "icon": "process"},
});
