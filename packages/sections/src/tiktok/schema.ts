import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";
import { storySource } from "../collections/schemas";
import { segmentEnum } from "../shared/schema";
import { tiktokFixture } from "./fixtures";

const https = () => z.url().refine((value) => new URL(value).protocol === "https:", "HTTPS required");
export const tiktokSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }), description: localized().optional(),
  profile: z.object({ handle: localized(), url: https() }).optional(),
  videos: z.array(z.object({ id: z.string().min(1).max(100), creator: localized(), title: localized(), segment: segmentEnum().optional(), poster: mediaRef(), source: storySource })).min(1).max(12),
});

export const tiktok = defineSectionType({
  type: "tiktok", schemaVersion: 1, schema: tiktokSchema,
  defaults: tiktokSchema.parse(tiktokFixture),
  meta: {"label":{"vi":"TikTok"},"icon":"tiktok","entitlement":"tiktok"},
});
