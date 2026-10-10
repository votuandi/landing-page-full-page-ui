import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, link } from "../fields";

import { socialFixture } from "./fixtures";

const https = () => z.url().refine((value) => new URL(value).protocol === "https:", "HTTPS required");
export const socialSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized().optional(),
  channels: z.array(z.object({ kind: z.enum(["facebook", "youtube", "tiktok", "zalo", "instagram"]), label: localized(), handle: localized().optional(),
    url: z.union([https(), link().refine((value) => value.kind === "zalo", "Only Zalo links allowed")]), followers: z.string().max(60).optional() })).min(1).max(8),
});

export const social = defineSectionType({
  type: "social", schemaVersion: 1, schema: socialSchema,
  defaults: socialSchema.parse(socialFixture),
  meta: {"label":{"vi":"Mạng xã hội"},"icon":"social","entitlement":"social"},
});
