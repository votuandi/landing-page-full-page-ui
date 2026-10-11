import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef, link } from "../fields";
import { pageHeroFixture } from "./fixtures";

export const pageHeroSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  subtitle: localized({ multiline: true, max: 600 }), media: mediaRef(),
  breadcrumb: z.array(link()).max(6).optional(), ctas: z.array(link()).max(2).optional(),
});

export const pageHero = defineSectionType({
  type: "page-hero", schemaVersion: 1, schema: pageHeroSchema,
  defaults: pageHeroSchema.parse(pageHeroFixture),
  meta: { label: { vi: "Banner trang con", en: "Page hero" }, icon: "image", maxPerPage: 1 },
});
