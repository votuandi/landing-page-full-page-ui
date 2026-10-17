import { z } from "zod";
import { localized } from "../fields";
import { uniqueBy } from "./schema";

const positive = () => z.number().positive().max(1e12);
export const packageSimulationSchema = z.object({
  defaultBill: positive(), defaultProvince: z.string().min(1),
  packages: z.array(z.object({
    id: z.string().min(1), name: localized(), type: z.enum(["hoa-luoi", "hybrid"]),
    minBill: z.number().nonnegative(), maxBill: positive().nullable(), kwp: positive(), price: positive(),
    storageKwh: z.number().nonnegative(), phases: z.number().int().min(1).max(3), roofM2: positive(),
    equipment: z.array(localized()).max(20), warranty: localized({ max: 600 }),
  }).refine((p) => p.maxBill === null || p.maxBill > p.minBill, "Hóa đơn tối đa phải lớn hơn tối thiểu"))
    .min(1).max(100).refine(uniqueBy("id"), "Mã gói bị trùng"),
  provinces: z.array(z.object({ id: z.string().min(1), name: localized(), pvout: z.number().positive().max(12), source: z.url({ protocol: /^https?$/ }) }))
    .min(1).max(100).refine(uniqueBy("id"), "Mã tỉnh/thành bị trùng"),
  assumptions: z.object({
    electricityPrice: positive(), pr: z.number().gt(0).max(1),
    selfUse: z.object({ "hoa-luoi": z.number().gt(0).max(1), hybrid: z.number().gt(0).max(1) }),
    years: z.number().int().min(1).max(100), monthlyFactors: z.array(z.number().nonnegative().max(3)).length(12),
    installment: z.object({ minMonths: z.number().int().positive(), maxMonths: z.number().int().positive().max(600), defaultMonths: z.number().int().positive(), interestPerMonth: z.number().min(0).max(1) })
      .refine((v) => v.minMonths <= v.defaultMonths && v.defaultMonths <= v.maxMonths, "Số tháng mặc định phải nằm trong khoảng tối thiểu–tối đa"),
    source: localized({ max: 600 }),
  }),
}).refine((v) => v.provinces.some((p) => p.id === v.defaultProvince), "Tỉnh/thành mặc định chưa có trong danh sách");
export type PackageSimulation = z.output<typeof packageSimulationSchema>;
