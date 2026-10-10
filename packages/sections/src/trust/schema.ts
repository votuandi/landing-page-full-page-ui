import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";
import { uniqueBy } from "../shared/schema";
import { trustFixture } from "./fixtures";

export const trustSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  description: localized({ multiline: true, max: 600 }).optional(),
  items: z.array(z.object({ id: z.string().min(1), title: localized(), subtitle: localized(), issuer: localized(), number: localized(), validUntil: localized(), scope: localized({ multiline: true, max: 600 }), image: mediaRef().optional() })).min(1).max(12).refine(uniqueBy("id"), "Duplicate certificate id"),
  issuerLabel: localized(), numberLabel: localized(), validLabel: localized(), scopeLabel: localized(),
});

export const trust = defineSectionType({
  type: "trust", schemaVersion: 1, schema: trustSchema,
  defaults: trustSchema.parse(trustFixture),
  meta: {"label": {"vi": "Chứng chỉ & giấy phép", "en": "Certificates & licences"}, "icon": "trust", "entitlement": "trust"},
});
