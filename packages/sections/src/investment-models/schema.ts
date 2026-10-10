import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, link } from "../fields";

import { investmentModelsFixture } from "./fixtures";

export const investmentModelsSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized().optional(),
  models: z.array(z.object({ id: z.string().min(1).max(100), title: localized(), summary: localized(), points: z.array(localized()).max(6), highlight: z.boolean().optional(), badge: localized().optional() })).min(2).max(6), cta: link().optional(),
});

export const investmentModels = defineSectionType({
  type: "investment-models", schemaVersion: 1, schema: investmentModelsSchema,
  defaults: investmentModelsSchema.parse(investmentModelsFixture),
  meta: {"label":{"vi":"Hình thức đầu tư"},"icon":"investment-models","entitlement":"investmentModels"},
});
