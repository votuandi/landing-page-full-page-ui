import { z } from "zod";
import { defineSectionType } from "../define";
import { migrateSocialV1 } from "./migrations";
import { localized, link } from "../fields";

import { socialFixture } from "./fixtures";

// z.url kiểm protocol mà không ném lỗi với chuỗi đang nhập dở.
const https = () => z.url({ protocol: /^https$/, error: "Chỉ nhận đường dẫn HTTPS" });
export const socialSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized().optional(),
  totalFollowers: z.number().int().nonnegative().optional(), totalFollowersLabel: localized({ max: 200 }).optional(),
  channels: z.array(z.object({ kind: z.enum(["facebook", "youtube", "tiktok", "zalo", "instagram"]), label: localized(), handle: localized().optional(),
    url: z.union([https(), link().refine((value) => value.kind === "zalo", "Chỉ nhận liên kết Zalo")]), followers: z.string().max(60).optional() })).min(1).max(8),
});

export const social = defineSectionType({
  migrations: { 1: migrateSocialV1 },
  type: "social", schemaVersion: 2, schema: socialSchema,
  defaults: socialSchema.parse(socialFixture),
  meta: {"label":{"vi":"Mạng xã hội"},"icon":"social","entitlement":"social"},
});
