/** Fixed-package simulation: PVout and self-use assumptions, separate from the tariff/roof estimator. */
export type SystemType = "hoa-luoi" | "hybrid";
export type PackageAssumptions = {
  electricityPrice: number; pr: number; selfUse: Record<SystemType, number>;
  years: number; monthlyFactors: readonly number[];
};
export type SolarPackage = { type: SystemType; kwp: number; price: number };
export type BillRange = { minBill: number; maxBill: number | null };
const positive = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError("Giá trị phải là số hữu hạn lớn hơn 0");
  return value;
};
const nonnegative = (value: number) => {
  if (!Number.isFinite(value) || value < 0) throw new RangeError("Giá trị phải là số hữu hạn không âm");
  return value;
};
function selfUse(type: SystemType, a: PackageAssumptions) {
  const ratio = nonnegative(a.selfUse[type]);
  if (ratio > 1) throw new RangeError("Tỷ lệ tự dùng phải từ 0 đến 1");
  return ratio;
}

export function estimatePackage(pkg: SolarPackage, province: { pvout: number }, a: PackageAssumptions) {
  const dailyKwh = positive(pkg.kwp) * positive(province.pvout) * positive(a.pr);
  positive(pkg.price);
  if (a.pr > 1 || !Number.isInteger(a.years) || a.years < 1 || a.years > 100 || a.monthlyFactors.length !== 12) {
    throw new RangeError("PR/kỳ mô phỏng không hợp lệ");
  }
  a.monthlyFactors.forEach(nonnegative);
  const monthlySaving = dailyKwh * 30 * positive(a.electricityPrice) * selfUse(pkg.type, a);
  const annualSaving = monthlySaving * 12;
  return {
    dailyKwh, monthlyKwh: dailyKwh * 30, annualKwh: dailyKwh * 360,
    monthlySaving, annualSaving, paybackYears: annualSaving > 0 ? pkg.price / annualSaving : null,
    cumulative: Array.from({ length: a.years + 1 }, (_, year) => ({ year, savings: annualSaving * year, net: annualSaving * year - pkg.price })),
    monthly: a.monthlyFactors.map((factor, index) => ({ month: index + 1, kwh: dailyKwh * 30 * factor })),
  };
}

export function suggestKwp(value: number, unit: "money" | "kwh", type: SystemType, province: { pvout: number }, a: PackageAssumptions) {
  positive(value);
  const rate = positive(a.electricityPrice);
  if (a.pr > 1) throw new RangeError("PR không hợp lệ");
  return (unit === "money" ? value / rate : value) / (30 * positive(province.pvout) * positive(a.pr) * positive(selfUse(type, a)));
}

export function packagesForBill<T extends BillRange>(packages: readonly T[], value: number, unit: "money" | "kwh", a: Pick<PackageAssumptions, "electricityPrice">): T[] {
  positive(value);
  const bill = unit === "money" ? value : value * positive(a.electricityPrice);
  return packages.filter((pkg) => bill >= pkg.minBill && (pkg.maxBill === null || bill < pkg.maxBill));
}

/** Equal principal plus flat monthly interest on the initial price, matching template-11. */
export function installment(price: number, months: number, monthlySaving: number, interestPerMonth = 0) {
  positive(price);
  positive(months);
  if (!Number.isInteger(months)) throw new RangeError("Kỳ hạn phải là số tháng nguyên");
  nonnegative(interestPerMonth);
  nonnegative(monthlySaving);
  const payment = price / months + price * interestPerMonth;
  return { payment, monthlySaving, extra: payment - monthlySaving };
}

export function summarizePackageEstimates(rows: readonly { kwp: number; annualKwh: number; annualSaving: number }[], carbonKgPerKwh: number) {
  nonnegative(carbonKgPerKwh);
  return rows.reduce((total, row) => ({
    kwp: total.kwp + row.kwp,
    mwh: total.mwh + row.annualKwh / 1000,
    saving: total.saving + row.annualSaving,
    co2: total.co2 + row.annualKwh * carbonKgPerKwh / 1000,
  }), { kwp: 0, mwh: 0, saving: 0, co2: 0 });
}
