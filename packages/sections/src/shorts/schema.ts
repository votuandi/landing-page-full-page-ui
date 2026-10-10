import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, collectionQuery } from "../fields";
import { storyItem } from "../collections/schemas";
import { shortsFixture } from "./fixtures";

export const shortsSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  description: localized({ multiline: true, max: 600 }).optional(), query: collectionQuery("stories"),
  items: z.array(storyItem).max(48).default([]),
  kindLabels: z.object({ progress: localized(), done: localized(), customer: localized() }), ctaLabel: localized({ max: 100 }),
});

export const shorts = defineSectionType({
  type: "shorts", schemaVersion: 1, schema: shortsSchema,
  defaults: shortsSchema.parse(shortsFixture),
  meta: {"label": {"vi": "Video công trình", "en": "Project videos"}, "icon": "shorts", "entitlement": "shorts", "collections": ["stories"]},
});
