import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef, link } from "../fields";
import { ctaBannerFixture } from "./fixtures";

export const ctaBannerSchema = z.object({
  eyebrow: localized({ max: 100 }).optional(), title: localized({ max: 200 }),
  description: localized({ multiline: true, max: 1000 }), image: mediaRef(), primaryCta: link(), secondaryCta: link().optional(),
});

export const ctaBanner = defineSectionType({
  type: "cta-banner", schemaVersion: 1, schema: ctaBannerSchema,
  defaults: ctaBannerSchema.parse(ctaBannerFixture),
  meta: {"label": {"vi": "Đội ngũ kỹ sư", "en": "Engineering team"}, "icon": "cta-banner"},
});
