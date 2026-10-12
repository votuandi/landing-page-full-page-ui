import { z } from "zod";
import { defineSectionType } from "../define";
import { migrateSegmentsV1 } from "./migrations";
import { link, localized, mediaRef } from "../fields";
import { segmentEnum, uniqueBy } from "../shared/schema";
import { segmentsFixture } from "./fixtures";

export const segmentsSchema = z.object({
  solarProfile: z.array(z.number().min(0).max(100)).length(24).optional(),
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
    comparison: z.object({
      title: localized({ max: 160 }).optional(),
      consumption: z.array(z.number().min(0).max(100)).length(24),
      advantages: z.object({ "hoa-luoi": localized({ max: 600 }), hybrid: localized({ max: 600 }) }),
      limitations: z.object({ "hoa-luoi": localized({ max: 600 }), hybrid: localized({ max: 600 }) }),
      recommendation: localized({ max: 600 }),
    }).optional(),
    /** Khối lợi ích toàn màn hình (t10): đoạn mở, nhãn trên ảnh, ô lợi ích, CTA và link chi tiết. */
    intro: localized({ multiline: true, max: 400 }).optional(),
    tag: localized({ max: 80 }).optional(),
    benefits: z.array(z.object({ value: localized({ max: 30 }), title: localized({ max: 80 }), text: localized({ multiline: true, max: 300 }) })).max(6).optional(),
    ctaLabel: localized({ max: 80 }).optional(),
    detailLink: link().optional(),
  })).min(1).max(4).refine(uniqueBy("segment"), { message: "Phân khúc bị trùng" }),
});

export const segments = defineSectionType({
  migrations: { 1: migrateSegmentsV1 },
  type: "segments",
  schemaVersion: 2,
  schema: segmentsSchema,
  defaults: segmentsSchema.parse(segmentsFixture),
  meta: { label: { vi: "Lưới phân khúc", en: "Segments" }, icon: "squares", maxPerPage: 1 },
});
