import { z } from "zod";
import { defineSectionType } from "../define";
import { link, localized, mediaRef } from "../fields";
import { heroFixture } from "./fixtures";

const card = z.object({ label: localized({ max: 60 }), value: z.string().max(20), unit: localized({ max: 20 }).optional() });

export const heroSchema = z.object({
  badge: localized({ max: 120 }),
  title: z.object({
    lead: localized({ max: 60 }),
    highlight: localized({ max: 60 }),
    sub: localized({ max: 60 }),
    subHighlight: localized({ max: 60 }),
  }),
  description: localized({ multiline: true, max: 400 }),
  primaryCta: link(),
  secondaryCta: link().optional(),
  rating: z.object({
    score: z.number().min(0).max(5),
    count: z.number().int().min(0),
    url: z.url({ protocol: /^https?$/ }),
    label: localized({ max: 40 }),
  }).optional(),
  stats: z.array(z.object({
    value: z.number().min(0),
    decimals: z.number().int().min(0).max(2).default(0),
    suffix: z.string().max(4).optional(),
    unit: localized({ max: 12 }),
    label: localized({ max: 40 }),
  })).max(3),
  image: mediaRef(),
  /** Chip thiết bị nổi cạnh ảnh; vị trí theo thứ tự, chip thứ 4 ẩn trên mobile. */
  chips: z.array(z.object({
    label: localized({ max: 40 }),
    icon: z.enum(["sun", "cpu", "battery", "light"]),
    tone: z.enum(["accent", "secondary", "primary", "leaf"]),
  })).max(4),
  outputCard: card.extend({ liveLabel: z.string().max(12) }).optional(),
  savingCard: card.optional(),
  co2Card: card.optional(),
});

export const hero = defineSectionType({
  type: "hero",
  schemaVersion: 1,
  schema: heroSchema,
  defaults: heroSchema.parse(heroFixture),
  meta: { label: { vi: "Banner chính", en: "Hero" }, icon: "image", maxPerPage: 1 },
});
