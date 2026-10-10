import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";

import { pressFixture } from "./fixtures";

const https = () => z.url().refine((value) => new URL(value).protocol === "https:", "HTTPS required");
export const pressSchema = z.object({
  eyebrow: localized({ max: 100 }), title: localized({ max: 200 }),
  outlets: z.array(z.object({ id: z.string().min(1).max(100), name: localized(), short: z.string().min(1).max(4), logo: mediaRef().optional() })).min(1).max(12),
  articles: z.array(z.object({ outletId: z.string().min(1).max(100), date: z.iso.date(), title: localized(), excerpt: localized(), url: https().optional() })).min(1).max(12),
}).refine(({ outlets, articles }) => articles.every((a) => outlets.some((o) => o.id === a.outletId)), { message: "Unknown outlet", path: ["articles"] });

export const press = defineSectionType({
  type: "press", schemaVersion: 1, schema: pressSchema,
  defaults: pressSchema.parse(pressFixture),
  meta: {"label":{"vi":"Báo chí & truyền hình"},"icon":"press","entitlement":"press"},
});
