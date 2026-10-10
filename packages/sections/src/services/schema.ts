import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef, link } from "../fields";
import { storySource } from "../collections/schemas";
import { segmentEnum } from "../shared/schema";
import { servicesFixture } from "./fixtures";

export const servicesSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized().optional(),
  items: z.array(z.object({ id: z.string().min(1).max(100), title: localized(), image: mediaRef(), points: z.array(localized()).max(6), segment: segmentEnum().optional(), link: link().optional() })).min(1).max(8),
  videos: z.array(z.object({ title: localized(), location: localized().optional(), poster: mediaRef(), source: storySource })).max(12).default([]),
  ctaLabel: localized().default({ vi: "Dự toán cho phân khúc này", en: "Estimate for this segment" }),
});

export const services = defineSectionType({
  type: "services", schemaVersion: 1, schema: servicesSchema,
  defaults: servicesSchema.parse(servicesFixture),
  meta: {"label":{"vi":"Giải pháp điện mặt trời"},"icon":"services"},
});
