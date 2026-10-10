import { z } from "zod";
import { defineSectionType } from "../define";
import { localized } from "../fields";
import { statsFixture } from "./fixtures";

export const statsSchema = z.object({
  eyebrow: localized({ max: 100 }).optional(), title: localized({ max: 200 }).optional(),
  items: z.array(z.object({ value: z.number().finite().nonnegative().optional(), sinceYear: z.number().int().min(1900).max(2100).optional(),
    decimals: z.number().int().min(0).max(2).default(0), suffix: localized({ max: 30 }).optional(), label: localized({ max: 100 }),
  }).refine((item) => (item.value !== undefined) !== (item.sinceYear !== undefined), "Exactly one of value or sinceYear required")).min(1).max(4),
});

export const stats = defineSectionType({
  type: "stats", schemaVersion: 1, schema: statsSchema,
  defaults: statsSchema.parse(statsFixture),
  meta: {"label": {"vi": "Số liệu nổi bật", "en": "Key figures"}, "icon": "stats", "entitlement": "stats"},
});
