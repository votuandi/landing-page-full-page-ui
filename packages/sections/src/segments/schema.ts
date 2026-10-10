import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";
import { segmentEnum, uniqueBy } from "../shared/schema";
import { segmentsFixture } from "./fixtures";

export const segmentsSchema = z.object({
  eyebrow: localized({ max: 80 }),
  title: localized({ max: 160 }),
  description: localized({ multiline: true, max: 400 }),
  /** Section đích khi bấm một phân khúc (mặc định video công trình). */
  targetAnchor: z.string().regex(/^[a-z0-9-]+$/).default("video-cong-trinh"),
  savingLabel: localized({ max: 40 }),
  items: z.array(z.object({
    segment: segmentEnum(),
    label: localized({ max: 60 }),
    pitch: localized({ max: 160 }),
    image: mediaRef(),
    /** Mức giảm hóa đơn tham khảo, vd. "50–90%". */
    saving: z.string().max(20),
  })).min(1).max(4).refine(uniqueBy("segment"), { message: "Phân khúc bị trùng" }),
});

export const segments = defineSectionType({
  type: "segments",
  schemaVersion: 1,
  schema: segmentsSchema,
  defaults: segmentsSchema.parse(segmentsFixture),
  meta: { label: { vi: "Lưới phân khúc", en: "Segments" }, icon: "squares", maxPerPage: 1 },
});
