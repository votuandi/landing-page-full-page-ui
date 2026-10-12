import { z } from "zod";
import { defineSectionType } from "../define";
import { migrateCtaBannerV1 } from "./migrations";
import { localized, mediaRef, link } from "../fields";
import { ctaBannerFixture } from "./fixtures";

export const ctaBannerSchema = z.object({
  eyebrow: localized({ max: 100 }).optional(), title: localized({ max: 200 }),
  description: localized({ multiline: true, max: 1000 }), image: mediaRef(), primaryCta: link(), secondaryCta: link().optional(),
  checklistTitle: localized({ max: 200 }).optional(),
  checklist: z.array(z.object({ icon: z.enum(["location", "power", "document"]), label: localized({ max: 300 }) })).max(8).optional(),
});

export const ctaBanner = defineSectionType({
  migrations: { 1: migrateCtaBannerV1 },
  type: "cta-banner", schemaVersion: 2, schema: ctaBannerSchema,
  defaults: ctaBannerSchema.parse(ctaBannerFixture),
  meta: {"label": {"vi": "Đội ngũ kỹ sư", "en": "Engineering team"}, "icon": "cta-banner"},
});
