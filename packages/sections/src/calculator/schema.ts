import { z } from "zod";
import { PROVINCES, type Region } from "@solar/core";
import { defineSectionType } from "../define";
import { localized } from "../fields";
import { SEGMENTS, segmentEnum, uniqueBy } from "../shared/schema";
import { calculatorFixture } from "./fixtures";

const REGIONS = ["bac-bo", "bac-trung-bo", "nam-trung-bo", "tay-nguyen", "nam-bo"] as const satisfies readonly Region[];
const vnd = () => z.number().positive().max(1e12);
const perSegment = <T extends z.ZodType>(value: T) => z.record(z.enum(SEGMENTS), value);

/** Giá điện đ/kWh chưa VAT: bậc thang (bậc cuối `upTo: null`) hoặc giá bình quân + giá phần điện mặt trời thay thế. */
const tariff = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("tiered"),
    tiers: z.array(z.object({ upTo: z.number().positive().nullable(), price: vnd() })).min(1).max(10)
      .refine((tiers) => tiers.every((tier, i) => (i === tiers.length - 1) === (tier.upTo === null)
        && (i === 0 || tier.upTo === null || tier.upTo > (tiers[i - 1].upTo ?? Infinity))),
      { message: "Bậc tăng dần, chỉ bậc cuối không giới hạn" }),
  }),
  z.object({ kind: z.literal("flat"), averageRate: vnd(), solarOffsetRate: vnd() }),
]);

export const CALCULATOR_STEPS = ["segment", "bill", "roof", "province", "ratio"] as const;

export const calculatorSchema = z.object({
  eyebrow: localized({ max: 60 }),
  title: z.object({ lead: localized({ max: 100 }), highlight: localized({ max: 40 }) }),
  description: localized({ multiline: true, max: 300 }),
  /** Phân khúc được chọn trong dự toán; phần tử đầu là mặc định. */
  segments: z.array(z.object({ segment: segmentEnum(), label: localized({ max: 60 }), short: localized({ max: 24 }) }))
    .min(1).max(4).refine(uniqueBy("segment"), { message: "Phân khúc bị trùng" }),
  tariffs: perSegment(tariff),
  vatRate: z.number().min(0).max(0.3),
  /** Đơn giá trọn gói đ/kWp. */
  pricePerKwp: perSegment(vnd()),
  /** Giờ nắng đỉnh trung bình theo vùng. */
  peakSunHours: z.record(z.enum(REGIONS), z.number().positive().max(12)),
  /** Tỷ lệ % điện dùng ban ngày gợi ý theo phân khúc. */
  segmentRatios: perSegment(z.number().int().min(0).max(100)),
  system: z.object({
    performanceRatio: z.number().gt(0).max(1),
    m2PerKwp: z.number().positive().max(50),
    panelWatt: z.number().positive().max(2000),
    kwpStep: z.number().positive().max(10),
    minKwp: z.number().positive().max(100),
    minRoofArea: z.number().positive().max(1000),
  }),
  inputs: perSegment(z.object({
    bill: z.object({ min: vnd(), max: vnd(), step: vnd(), default: vnd() })
      .refine((b) => b.min <= b.default && b.default <= b.max, { message: "Mặc định nằm trong min..max" }),
    roof: z.object({ default: z.number().positive(), max: z.number().positive() }),
  })),
  defaultProvince: z.string().refine((name) => PROVINCES.some((p) => p.name === name), { message: "Tỉnh/thành không có trong danh sách" }),
  /** Bước hiển thị: các ô nhập và thứ tự của chúng; ô bị bỏ dùng giá trị mặc định. */
  steps: z.array(z.enum(CALCULATOR_STEPS)).min(1)
    .refine((steps) => new Set(steps).size === steps.length, { message: "Bước bị trùng" })
    .default([...CALCULATOR_STEPS]),
  tips: z.array(localized({ max: 60 })).max(3),
  resultTitle: localized({ max: 60 }),
  disclaimer: localized({ multiline: true, max: 300 }),
  formTitle: localized({ max: 80 }),
  formDescription: localized({ max: 200 }),
  ctaLabel: localized({ max: 60 }),
  successText: localized({ max: 300 }),
  privacyNote: localized({ max: 300 }),
  leadSource: z.string().regex(/^[\w-]{1,60}$/).default("calculator"),
});

export const calculator = defineSectionType({
  type: "calculator",
  schemaVersion: 1,
  schema: calculatorSchema,
  defaults: calculatorSchema.parse(calculatorFixture),
  meta: { label: { vi: "Dự toán chi phí", en: "Cost estimator" }, icon: "calculator", entitlement: "calculator", maxPerPage: 1 },
});
