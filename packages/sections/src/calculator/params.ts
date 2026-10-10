import { PROVINCES, type CalculatorParams } from "@solar/core";
import type { z } from "zod";
import type { calculatorSchema } from "./schema";

/** Dữ liệu section → tham số của `calculateSolar`. Không import zod lúc chạy để island dùng được. */
export function toCalculatorParams(data: z.output<typeof calculatorSchema>): CalculatorParams {
  const { performanceRatio, m2PerKwp, panelWatt, kwpStep, minKwp } = data.system;
  return {
    tariffs: data.tariffs,
    vatRate: data.vatRate,
    pricePerKwp: data.pricePerKwp,
    peakSunHours: data.peakSunHours,
    provinces: PROVINCES,
    system: { performanceRatio, m2PerKwp, panelWatt, kwpStep, minKwp },
  };
}
