import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef, richText, link } from "../fields";
import { storySource } from "../collections/schemas";
import { aboutStoryFixture } from "./fixtures";

export const aboutStorySchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), body: richText(), image: mediaRef().optional(),
  video: z.object({ poster: mediaRef(), source: storySource }).optional(),
  stats: z.array(z.object({ value: z.number().nonnegative().optional(), sinceYear: z.number().int().min(1900).max(2100).optional(), suffix: localized().optional(), label: localized() })
    .refine((item) => (item.value !== undefined) !== (item.sinceYear !== undefined), "Exactly one of value or sinceYear required")).max(4).default([]),
  milestones: z.array(z.object({ year: z.string().min(1).max(10), title: localized(), description: localized() })).max(10).default([]),
  values: z.array(z.object({ title: localized(), description: localized() })).max(6).default([]), ctas: z.array(link()).max(2).default([]),
});

export const aboutStory = defineSectionType({
  type: "about-story", schemaVersion: 1, schema: aboutStorySchema,
  defaults: aboutStorySchema.parse(aboutStoryFixture),
  meta: {"label":{"vi":"Câu chuyện"},"icon":"about-story"},
});
