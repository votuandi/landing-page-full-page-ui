import { z } from "zod";
import { defineSectionType } from "../define";
import { migrateTrustV1 } from "./migrations";
import { localized, mediaRef } from "../fields";
import { uniqueBy } from "../shared/schema";
import { trustFixture } from "./fixtures";

export const trustSchema = z.object({
  legalItems: z.array(z.object({ id: z.string().min(1), question: localized(), answer: localized({ max: 1500 }), source: z.url({ protocol: /^https?$/ }), verified: z.boolean().default(false) })).max(20).refine(uniqueBy("id"), "Duplicate legal id").optional(),
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  description: localized({ multiline: true, max: 600 }).optional(),
  items: z.array(z.object({ id: z.string().min(1), title: localized(), subtitle: localized(), issuer: localized(), number: localized(), validUntil: localized(), scope: localized({ multiline: true, max: 600 }), image: mediaRef().optional(), logo: mediaRef().optional(), lookupUrl: z.url({ protocol: /^https?$/ }).optional() })).min(1).max(12).refine(uniqueBy("id"), "Duplicate certificate id"),
  issuerLabel: localized(), numberLabel: localized(), validLabel: localized(), scopeLabel: localized(),
  /** v2: true → thẻ hiện số hiệu/hiệu lực/phạm vi; false → thẻ chỉ tên + đơn vị cấp, chi tiết trong lightbox. */
  cardDetails: z.boolean().default(true),
});

export const trust = defineSectionType({
  migrations: { 1: migrateTrustV1 },
  type: "trust", schemaVersion: 2, schema: trustSchema,
  defaults: trustSchema.parse(trustFixture),
  meta: {"label": {"vi": "Chứng chỉ & giấy phép", "en": "Certificates & licences"}, "icon": "trust", "entitlement": "trust"},
});
