import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";
import { storySource } from "../collections/schemas";
import { uniqueBy } from "../shared/schema";
import { brandsFixture } from "./fixtures";

export const brandsSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  description: localized({ multiline: true, max: 600 }).optional(),
  groups: z.array(z.object({ id: z.string().min(1), label: localized() })).min(1).max(12).refine(uniqueBy("id"), "Duplicate group id"),
  items: z.array(z.object({ name: localized(), group: z.string().min(1), logo: mediaRef().optional() })).min(1).max(48),
  signingVideo: z.object({ title: localized(), caption: localized(), poster: mediaRef(), source: storySource }).optional(),
}).refine((data) => data.items.every((item) => data.groups.some((group) => group.id === item.group)), "Unknown brand group");

export const brands = defineSectionType({
  type: "brands", schemaVersion: 1, schema: brandsSchema,
  defaults: brandsSchema.parse(brandsFixture),
  meta: {"label": {"vi": "Thương hiệu phân phối", "en": "Distributed brands"}, "icon": "brands"},
});
