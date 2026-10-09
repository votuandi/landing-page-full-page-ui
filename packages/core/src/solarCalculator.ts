import type { Segment } from "./segment";

export type CalculatorInput = {
  segment: Segment;
  /** Hóa đơn điện trung bình/tháng, VNĐ (đã gồm VAT). */
  monthlyBill: number;
  /** Diện tích mái khả dụng, m². */
  roofArea: number;
  province: string;
  /** Tỷ lệ dùng điện ban ngày, % (0–100). */
  daytimeRatio: number;
};

export type CalculatorResult = {
  monthlyKwh: number;
  daytimeKwh: number;
  region: Region;
  peakSunHours: number;
  kwpNeeded: number;
  kwpRoofMax: number;
  kwp: number;
  limitedByRoof: boolean;
  panels: number;
  cost: number;
  monthlyProduction: number;
  monthlySavings: number;
  paybackYears: number;
};

export type Region = "bac-bo" | "bac-trung-bo" | "nam-trung-bo" | "tay-nguyen" | "nam-bo";

/** Bậc thang: `upTo` = kWh cộng dồn tối đa của bậc (null = không giới hạn), `price` = đ/kWh chưa VAT. */
export type Tier = { upTo: number | null; price: number };

export type Tariff =
  | { kind: "tiered"; tiers: Tier[] }
  /** averageRate: giá bình quân để quy đổi hóa đơn → kWh; solarOffsetRate: giá của kWh mà điện mặt trời thay thế (giờ ban ngày). */
  | { kind: "flat"; averageRate: number; solarOffsetRate: number };

export type CalculatorParams = {
  tariffs: Record<Segment, Tariff>;
  vatRate: number;
  pricePerKwp: Record<Segment, number>;
  peakSunHours: Record<Region, number>;
  provinces: readonly { name: string; region: Region }[];
  system: { performanceRatio: number; m2PerKwp: number; panelWatt: number; kwpStep: number; minKwp: number };
};

const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const floorTo = (value: number, step: number) => Math.floor(value / step + 1e-9) * step;

/** Tiền điện (chưa VAT) cho một lượng kWh theo biểu giá. */
export function billFromKwh(kwh: number, tariff: Tariff): number {
  if (kwh <= 0) return 0;
  if (tariff.kind === "flat") return kwh * tariff.averageRate;
  let remaining = kwh;
  let previous = 0;
  let total = 0;
  for (const tier of tariff.tiers) {
    const size = tier.upTo === null ? Infinity : tier.upTo - previous;
    const used = Math.min(remaining, size);
    total += used * tier.price;
    remaining -= used;
    if (remaining <= 0) break;
    previous = tier.upTo ?? previous;
  }
  return total;
}

/** Quy ngược tiền điện (chưa VAT) → kWh, tính ngược qua từng bậc thang. */
export function kwhFromBill(bill: number, tariff: Tariff): number {
  if (bill <= 0) return 0;
  if (tariff.kind === "flat") return bill / tariff.averageRate;
  let remaining = bill;
  let previous = 0;
  let kwh = 0;
  for (const tier of tariff.tiers) {
    const size = tier.upTo === null ? Infinity : tier.upTo - previous;
    const tierCost = size * tier.price;
    if (remaining <= tierCost) return kwh + remaining / tier.price;
    kwh += size;
    remaining -= tierCost;
    previous = tier.upTo ?? previous;
  }
  return kwh;
}

export function regionOf(province: string, provinces: CalculatorParams["provinces"]): Region {
  const found = provinces.find((p) => p.name === province);
  if (!found) throw new Error(`Không có tỉnh/thành "${province}" trong config`);
  return found.region;
}

export function calculateSolar(input: CalculatorInput, params: CalculatorParams): CalculatorResult {
  const tariff = params.tariffs[input.segment];
  const vat = params.vatRate;
  const pr = params.system.performanceRatio;
  const m2PerKwp = params.system.m2PerKwp;
  const panelWatt = params.system.panelWatt;
  const pricePerKwp = params.pricePerKwp[input.segment];

  const region = regionOf(input.province, params.provinces);
  const peakSunHours = params.peakSunHours[region];
  const ratio = Math.min(100, Math.max(0, input.daytimeRatio)) / 100;
  const roofArea = Math.max(0, input.roofArea);

  // 1. Hóa đơn → kWh/tháng (bỏ VAT rồi tính ngược biểu giá)
  const monthlyKwh = kwhFromBill(Math.max(0, input.monthlyBill) / (1 + vat), tariff);
  // 2. kWh dùng ban ngày
  const daytimeKwh = monthlyKwh * ratio;
  // 3. kWp cần để bù phần ban ngày
  const kwpNeeded = daytimeKwh / (30 * peakSunHours * pr);
  // 4. kWp tối đa theo mái (làm tròn xuống — không vượt diện tích), lấy giá trị nhỏ hơn
  const kwpRoofMax = floorTo(roofArea / m2PerKwp, params.system.kwpStep);
  const kwpWanted = Math.max(params.system.minKwp, roundTo(kwpNeeded, params.system.kwpStep));
  const kwp = Math.min(kwpWanted, kwpRoofMax);
  const limitedByRoof = kwpRoofMax < kwpWanted;
  // 5. Số tấm pin
  const panels = kwp > 0 ? Math.ceil((kwp * 1000) / panelWatt - 1e-9) : 0;
  // 6. Chi phí
  const cost = kwp * pricePerKwp;
  // 7. Sản lượng, tiết kiệm (chỉ tính phần điện mặt trời thay thế được điện dùng ban ngày), hoàn vốn
  const monthlyProduction = kwp * peakSunHours * 30 * pr;
  const selfUsedKwh = Math.min(monthlyProduction, daytimeKwh);
  const savingsBeforeVat = tariff.kind === "tiered"
    ? billFromKwh(monthlyKwh, tariff) - billFromKwh(monthlyKwh - selfUsedKwh, tariff)
    : selfUsedKwh * tariff.solarOffsetRate;
  const monthlySavings = savingsBeforeVat * (1 + vat);
  const paybackYears = monthlySavings > 0 ? cost / (monthlySavings * 12) : Infinity;

  return {
    monthlyKwh, daytimeKwh, region, peakSunHours, kwpNeeded, kwpRoofMax, kwp, limitedByRoof,
    panels, cost, monthlyProduction, monthlySavings, paybackYears,
  };
}

/**
 * Tiết kiệm ước tính/tháng của một hệ có sẵn công suất (dùng cho thẻ gói giải pháp).
 * Giả định toàn bộ sản lượng được dùng trực tiếp; hộ gia đình tính theo giá bậc cao nhất bị cắt giảm.
 */
export function estimateSavingForKwp(segment: Segment, kwp: number, province: string, params: CalculatorParams) {
  const tariff = params.tariffs[segment];
  const vat = params.vatRate;
  const pr = params.system.performanceRatio;
  const production = kwp * params.peakSunHours[regionOf(province, params.provinces)] * 30 * pr;
  const rate = tariff.kind === "flat" ? tariff.solarOffsetRate : tariff.tiers[tariff.tiers.length - 1].price;
  return production * rate * (1 + vat);
}
