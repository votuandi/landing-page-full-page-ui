import { z } from "zod";
import { defineSectionType } from "../define";
import { localized, mediaRef } from "../fields";
import { segmentEnum, uniqueBy } from "../shared/schema";
import { packagesFixture } from "./fixtures";

const vnd = () => z.number().int().positive().max(1e12);

export const packagesSchema = z.object({
  eyebrow: localized({ max: 60 }),
  title: localized({ max: 160 }),
  /** Tab phân khúc theo thứ tự; `defaultSegment` mở sẵn (khi URL không có `?phan-khuc=`). */
  segments: z.array(z.object({
    segment: segmentEnum(),
    label: localized({ max: 60 }),
    short: localized({ max: 24 }),
    pitch: localized({ max: 200 }),
    cover: mediaRef(),
  })).min(1).max(4).refine(uniqueBy("segment"), { message: "Phân khúc bị trùng" }),
  defaultSegment: segmentEnum(),
  items: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    segment: segmentEnum(),
    name: localized({ max: 60 }),
    kwp: z.number().positive().max(100_000),
    /** Giá trọn gói VNĐ; trống → "Liên hệ". `salePrice` chỉ hiện khi nhỏ hơn `price`. */
    price: vnd().optional(),
    salePrice: vnd().optional(),
    suitableFor: localized({ max: 80 }),
    highlights: z.array(localized({ max: 60 })).max(5),
    popular: z.boolean().default(false),
    /** Tiền điện giảm ước tính VNĐ/tháng; trống → ẩn khối tiết kiệm. */
    monthlySaving: vnd().optional(),
  })).max(32).refine(uniqueBy("id"), { message: "id gói bị trùng" }),
  /** Số gói tối đa mỗi phân khúc (phần dư bị bỏ qua). */
  maxPerSegment: z.number().int().min(1).max(8).default(4),
  ctaLabel: localized({ max: 40 }),
  savingLabel: localized({ max: 40 }),
  popularLabel: localized({ max: 20 }),
  footnote: localized({ multiline: true, max: 300 }),
}).refine((data) => data.segments.some((s) => s.segment === data.defaultSegment),
  { message: "defaultSegment phải là một tab", path: ["defaultSegment"] });

export const packages = defineSectionType({
  type: "packages",
  schemaVersion: 1,
  schema: packagesSchema,
  defaults: packagesSchema.parse(packagesFixture),
  meta: { label: { vi: "Gói giải pháp", en: "Packages" }, icon: "package", entitlement: "packages", maxPerPage: 1 },
});
