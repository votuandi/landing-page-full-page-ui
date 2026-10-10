import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, collectionQuery } from "../fields";
import { testimonialItem } from "../collections/schemas";
import { segmentLabelsSchema } from "../shared/contentSchema";
import { testimonialsFixture } from "./fixtures";

export const testimonialsSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  query: collectionQuery("testimonials"), items: z.array(testimonialItem).max(48).default([]),
  ratings: z.array(z.object({ label: localized(), score: z.number().min(0).max(5), count: z.number().int().nonnegative(), url: z.url().refine((url) => new URL(url).protocol === "https:") })).max(2), segmentLabels: segmentLabelsSchema,
});

export const testimonials = defineSectionType({
  type: "testimonials", schemaVersion: 1, schema: testimonialsSchema,
  defaults: testimonialsSchema.parse(testimonialsFixture),
  meta: {"label": {"vi": "Khách hàng nói gì", "en": "What clients say"}, "icon": "testimonials", "entitlement": "testimonials", "collections": ["testimonials"]},
});
