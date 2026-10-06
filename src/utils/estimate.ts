import {
  CALCULATOR,
  COPY,
  SEGMENTS,
  type Segment,
  type Region,
} from "@/content/site";
export type EstimateInput = {
  segment: Segment;
  region: Region;
  mode: "bill" | "roof";
  value: number;
};
export function estimateSolar(input: EstimateInput) {
  const c = CALCULATOR;
  if (
    !Object.prototype.hasOwnProperty.call(c.segments, input.segment) ||
    !Object.prototype.hasOwnProperty.call(c.regions, input.region) ||
    !Object.prototype.hasOwnProperty.call(c.limits, input.mode)
  )
    return null;
  const s = c.segments[input.segment],
    r = c.regions[input.region],
    limit = c.limits[input.mode];
  if (
    !s ||
    !r ||
    !limit ||
    !Number.isFinite(input.value) ||
    input.value < limit.min ||
    input.value > limit.max
  )
    return null;
  const monthlyYield = r.sunHours * c.daysPerMonth * c.performanceRatio;
  const rawKwp =
    input.mode === "bill"
      ? (input.value * s.targetSaving) /
        (s.electricityRate * monthlyYield * s.selfUse)
      : input.value / c.roofM2PerKwp;
  const kwp = Math.min(c.maxKwp, Math.max(c.minKwp, rawKwp));
  const monthlyProduction = kwp * monthlyYield;
  const usedKwh =
    input.mode === "bill"
      ? Math.min(monthlyProduction * s.selfUse, input.value / s.electricityRate)
      : monthlyProduction * s.selfUse;
  const monthlySaving = usedKwh * s.electricityRate;
  const annualSaving = monthlySaving * c.monthsPerYear;
  const investment = kwp * s.costPerKwp;
  const maintenance = investment * c.annualMaintenanceRate;
  const netAnnualSaving = annualSaving - maintenance;
  return {
    kwp,
    monthlySaving,
    annualSaving,
    investment,
    maintenance,
    paybackYears: netAnnualSaving > 0 ? investment / netAnnualSaving : null,
    co2Kg: usedKwh * c.monthsPerYear * c.co2KgPerKwh,
    roofArea: kwp * c.roofM2PerKwp,
  };
}
export const numberVi = (n: number, d = 0) =>
  n.toLocaleString("vi-VN", { maximumFractionDigits: d });
export const moneyVi = (n: number) => `${numberVi(n)} ₫`;
export function estimateMessage(input: EstimateInput) {
  const e = estimateSolar(input);
  if (!e) return "";
  const t = COPY.calculator;
  return `${t.requestPrefix} — ${SEGMENTS[input.segment].fullLabel}\n${t.region}: ${CALCULATOR.regions[input.region].label}\n${input.mode === "bill" ? t.bill : t.roof}: ${numberVi(input.value)}\n${t.kwp}: ${numberVi(e.kwp, 2)} kWp\n${t.monthly}: ${moneyVi(e.monthlySaving)}\n${t.annual}: ${moneyVi(e.annualSaving)}\n${t.payback}: ${e.paybackYears ? numberVi(e.paybackYears, 1) + " " + COPY.years : t.noPayback}\n${t.co2}: ${numberVi(e.co2Kg)} ${t.kg}\n${COPY.reference}.`;
}
