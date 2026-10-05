import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/site";
import { PRODUCTS } from "@/data/solar";

export function formatMoney(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2).replace(".", ",")} tỷ`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)} triệu`;
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + " đ";
}

export function makeMetadata(title: string, description: string, path = "/", image = "/images/solar-installation-hero.jpg"): Metadata {
  const url = new URL(path, SITE_CONFIG.url).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_CONFIG.brand.name, locale: "vi_VN", type: "website", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function productBrands() {
  return Array.from(new Set(PRODUCTS.map((item) => item.brand))).sort();
}

export function calculateSolar(input: {
  customerType: "household" | "business" | "manufacturing";
  monthlyBill: number;
  region: "north" | "central" | "south";
  daytimeUse: number;
}) {
  const c = SITE_CONFIG.calculator;
  const rate = c.electricityRates[input.customerType];
  const costPerKwp = c.systemCostPerKwp[input.customerType];
  const sun = c.sunHours[input.region];
  const monthlyKwh = input.monthlyBill / rate;
  const selfUse = Math.min(0.98, Math.max(0.35, input.daytimeUse / 100));
  const targetMonthlyGeneration = monthlyKwh * selfUse;
  const kwp = Math.max(3, targetMonthlyGeneration / (sun * 30 * 0.82));
  const investment = kwp * costPerKwp;
  const monthlySaving = targetMonthlyGeneration * rate;
  const paybackYears = investment / (monthlySaving * 12);
  const cumulative: number[] = [];
  let total = -investment;
  for (let year = 1; year <= c.years; year += 1) {
    const degradation = Math.pow(1 - c.degradationPerYear, year - 1);
    const tariff = Math.pow(1 + c.annualElectricityInflation, year - 1);
    total += monthlySaving * 12 * degradation * tariff;
    cumulative.push(total);
  }
  return { kwp, investment, monthlySaving, paybackYears, cumulative, selfUse };
}