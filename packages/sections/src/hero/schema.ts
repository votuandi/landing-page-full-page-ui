import { z } from "zod";
import { defineSectionType } from "../define";
import { link, localized, mediaRef } from "../fields";
import { segmentEnum, uniqueBy } from "../shared/schema";
import { heroFixture } from "./fixtures";
import { packageSimulationSchema } from "../shared/packageSimulation";
import { energyMonitoringSchema } from "../energy-monitoring/schema";

const card = z.object({ label: localized({ max: 60 }), value: z.string().max(20), unit: localized({ max: 20 }).optional() });

export const heroSchema = z.object({
  packageSimulation: packageSimulationSchema.optional(),
  badge: localized({ max: 120 }),
  title: z.object({
    lead: localized({ max: 60 }),
    highlight: localized({ max: 60 }),
    sub: localized({ max: 60 }),
    subHighlight: localized({ max: 60 }),
  }),
  description: localized({ multiline: true, max: 400 }),
  primaryCta: link(),
  secondaryCta: link().optional(),
  rating: z.object({
    score: z.number().min(0).max(5),
    count: z.number().int().min(0),
    url: z.url({ protocol: /^https?$/ }),
    label: localized({ max: 40 }),
  }).optional(),
  stats: z.array(z.object({
    value: z.number().min(0),
    decimals: z.number().int().min(0).max(2).default(0),
    suffix: z.string().max(4).optional(),
    unit: localized({ max: 12 }),
    label: localized({ max: 40 }),
  })).max(3),
  image: mediaRef(),
  /** Chip thiết bị nổi cạnh ảnh; vị trí theo thứ tự, chip thứ 4 ẩn trên mobile. */
  chips: z.array(z.object({
    label: localized({ max: 40 }),
    icon: z.enum(["sun", "cpu", "battery", "light"]),
    tone: z.enum(["accent", "secondary", "primary", "leaf"]),
  })).max(4),
  outputCard: card.extend({ liveLabel: z.string().max(12) }).optional(),
  savingCard: card.optional(),
  co2Card: card.optional(),
  /** Danh sách gạch đầu dòng dưới mô tả (t10). */
  highlights: z.array(localized({ max: 120 })).max(5).optional(),
  /** Chú thích điều kiện/số liệu minh họa dưới CTA (t10). */
  note: localized({ multiline: true, max: 300 }).optional(),
  /** Nút chọn phân khúc; chọn → đổi tiêu đề/mô tả/ảnh và đồng bộ `useSegment()` (t10). */
  segmentViews: z.object({
    label: localized({ max: 60 }),
    items: z.array(z.object({
      segment: segmentEnum(),
      label: localized({ max: 40 }),
      title: localized({ max: 160 }),
      description: localized({ multiline: true, max: 400 }),
      highlights: z.array(localized({ max: 120 })).max(5),
      image: mediaRef(),
      ctaLabel: localized({ max: 80 }).optional(),
    })).min(2).max(4).refine(uniqueBy("segment"), { message: "Phân khúc bị trùng" }),
  }).optional(),
  /** Biểu đồ dữ liệu tùy chọn cho hero kỹ thuật; dùng cùng chuỗi 24 điểm của giám sát. */
  chart: energyMonitoringSchema.shape.chart.extend({ unit: localized({ max: 60 }) }).optional(),
  /** Banner nhiều ảnh; vắng mặt giữ nguyên hero một ảnh của schema v1. */
  slides: z.array(z.object({
    badge: localized({ max: 120 }).optional(), title: localized({ max: 200 }),
    description: localized({ multiline: true, max: 400 }), image: mediaRef(), cta: link().optional(),
  })).min(1).max(8).optional(),
});

export const hero = defineSectionType({
  type: "hero",
  schemaVersion: 2,
  schema: heroSchema,
  defaults: heroSchema.parse(heroFixture),
  meta: { label: { vi: "Banner chính", en: "Hero" }, icon: "image", maxPerPage: 1 },
});
