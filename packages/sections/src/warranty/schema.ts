import { z } from "zod";
import { defineSectionType } from "../define";
import { localized } from "../fields";

import { warrantyFixture } from "./fixtures";

export const warrantySchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized(),
  rows: z.array(z.object({ item: localized(), period: localized(), note: localized().optional() })).min(1).max(12), footnote: localized().optional(),
});

export const warranty = defineSectionType({
  type: "warranty", schemaVersion: 1, schema: warrantySchema,
  defaults: warrantySchema.parse(warrantyFixture),
  meta: {"label":{"vi":"Bảo hành"},"icon":"warranty"},
});
