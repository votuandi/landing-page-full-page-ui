import type {
  Assumptions,
  Package,
  Province,
  SystemType,
} from "../content/solar/types";
const positive = (value: number) => {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError("Giá trị phải là số hữu hạn lớn hơn 0");
  return value;
};
export function estimate(pkg: Package, province: Province, a: Assumptions) {
  positive(pkg.kwp);
  positive(pkg.price);
  positive(province.pvout);
  positive(a.pr);
  positive(a.electricityPrice);
  const ratio = a.selfUse[pkg.type];
  if (ratio < 0 || ratio > 1 || !Number.isFinite(ratio))
    throw new RangeError("Tỷ lệ tự dùng phải từ 0 đến 1");
  const dailyKwh = pkg.kwp * province.pvout * a.pr;
  const monthlySaving = dailyKwh * 30 * a.electricityPrice * ratio;
  const annualSaving = monthlySaving * 12;
  const paybackYears = annualSaving > 0 ? pkg.price / annualSaving : null;
  return {
    dailyKwh,
    monthlyKwh: dailyKwh * 30,
    annualKwh: dailyKwh * 30 * 12,
    monthlySaving,
    annualSaving,
    paybackYears,
    cumulative: Array.from({ length: a.years + 1 }, (_, year) => ({
      year,
      savings: annualSaving * year,
      net: annualSaving * year - pkg.price,
    })),
    monthly: a.monthlyFactors.map((factor, index) => ({
      month: index + 1,
      kwh: dailyKwh * 30 * factor,
    })),
  };
}
export function suggestKwp(
  value: number,
  unit: "money" | "kwh",
  type: SystemType,
  province: Province,
  a: Assumptions,
) {
  positive(value);
  positive(a.electricityPrice);
  positive(a.selfUse[type]);
  positive(province.pvout);
  positive(a.pr);
  const kwh = unit === "money" ? value / a.electricityPrice : value;
  return kwh / (30 * province.pvout * a.pr * a.selfUse[type]);
}
export function packagesForBill(
  packages: readonly Package[],
  value: number,
  unit: "money" | "kwh",
  a: Assumptions,
) {
  positive(value);
  const bill = unit === "money" ? value : value * a.electricityPrice;
  return packages.filter(
    (p) => bill >= p.minBill && (p.maxBill === null || bill < p.maxBill),
  );
}
export function installment(
  price: number,
  months: number,
  monthlySaving: number,
  interestPerMonth = 0,
) {
  positive(price);
  positive(months);
  if (
    !Number.isInteger(months) ||
    !Number.isFinite(interestPerMonth) ||
    interestPerMonth < 0
  )
    throw new RangeError("Kỳ hạn/lãi suất không hợp lệ");
  const payment = price / months + price * interestPerMonth;
  return { payment, monthlySaving, extra: payment - monthlySaving };
}
export const money = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
export const number = (n: number, digits = 1) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(n);
