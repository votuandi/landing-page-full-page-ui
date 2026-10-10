import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";

import { dealerFixture } from "./fixtures";

export const dealerSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized(),
  stats: z.array(z.object({ value: z.number().nonnegative(), suffix: localized().optional(), label: localized() })).max(4).default([]),
  policies: z.array(z.object({ title: localized(), body: localized() })).min(1).max(8),
  faqs: z.array(z.object({ question: localized(), answer: localized() })).max(10).default([]),
  gallery: z.array(z.object({ title: localized(), image: mediaRef() })).max(8).default([]),
  form: z.object({ title: localized(), description: localized().optional(), businessTypes: z.array(localized()).min(1).max(8), submitLabel: localized(), successTitle: localized(), successMessage: localized() }),
  policyTab: localized(), faqTab: localized(),
});

export const dealer = defineSectionType({
  type: "dealer", schemaVersion: 1, schema: dealerSchema,
  defaults: dealerSchema.parse(dealerFixture),
  meta: {"label":{"vi":"Trở thành đại lý"},"icon":"dealer","entitlement":"dealer","maxPerPage":1},
});
