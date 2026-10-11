"use client";
import { useState } from "react";
import { BoltIcon, ArrowDownIcon } from "@heroicons/react/24/outline";
import { CALCULATOR_ID, estimatePackage, formatNumber, formatVnd, packagesForBill } from "@solar/core";
import type { PackageSimulation } from "../shared/packageSimulation";
import type { Locale } from "../site";
import { useOpenCalculator } from "../state/SiteState";

export default function BillHero({ simulation, locale, sectionId, ctaLabel }: { simulation: PackageSimulation; locale: Locale; sectionId: string; ctaLabel: string }) {
  const [bill, setBill] = useState(String(simulation.defaultBill));
  const open = useOpenCalculator();
  const en = locale === "en";
  const amount = Number(bill), valid = Number.isFinite(amount) && amount > 0;
  const pkg = valid ? packagesForBill(simulation.packages, amount, "money", simulation.assumptions)[0] : undefined;
  const province = simulation.provinces.find((p) => p.id === simulation.defaultProvince)!;
  const result = pkg ? estimatePackage(pkg, province, simulation.assumptions) : null;
  return <form action={`#${CALCULATOR_ID}`} method="get" onSubmit={(event) => {
    if (!valid) return;
    event.preventDefault();
    open({ bill: amount, source: "hero-bill" });
  }} className="rounded-card border border-line bg-bg-elevated p-6 shadow-lg sm:p-8">
    <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-primary"><span className="flex items-center gap-2"><BoltIcon aria-hidden className="h-5 w-5" />{en ? "Start with your bill" : "Bắt đầu từ hóa đơn"}</span><span className="rounded-pill bg-bg-tint px-2 py-1">{en ? "Simulation" : "Mô phỏng"}</span></div>
    <h2 className="mt-6 font-display text-2xl font-semibold">{en ? "How much is your electricity bill?" : "Hóa đơn điện của bạn bao nhiêu?"}</h2>
    <label htmlFor={`${sectionId}-bill`} className="mt-5 block text-sm font-semibold">{en ? "Monthly electricity bill (VND)" : "Tiền điện / tháng (đồng)"}</label>
    <input id={`${sectionId}-bill`} name="hoa-don" type="number" min="1" step="any" required inputMode="decimal" value={bill} onChange={(e) => setBill(e.target.value)} aria-describedby={`${sectionId}-estimate`} className="mt-2 min-h-12 w-full rounded-input border border-line bg-bg px-4 text-xl text-fg focus-visible:outline-primary" />
    <input type="hidden" name="nguon" value="hero-bill" />
    <div id={`${sectionId}-estimate`} aria-live="polite" className="my-5 rounded-card bg-bg-tint p-5">
      {result && pkg ? <><p className="text-sm text-fg-muted">{en ? "Reference system" : "Phương án tham khảo"}</p><strong className="mt-1 block text-3xl font-semibold text-primary">{formatNumber(pkg.kwp, 1)} kWp</strong><p className="mt-2 text-sm">{en ? "Estimated savings" : "Tiết kiệm mô phỏng"} {formatVnd(result.monthlySaving)} / {en ? "month" : "tháng"}</p></> : <p role="status">{en ? "Enter a positive bill to see suggested packages." : "Nhập số tiền lớn hơn 0 để xem gói gợi ý."}</p>}
    </div>
    <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-button bg-accent px-4 py-3 font-semibold text-on-accent">{ctaLabel}<ArrowDownIcon aria-hidden className="h-4 w-4" /></button>
    <p className="mt-4 text-xs leading-6 text-fg-muted">[DỮ LIỆU MẪU] {en ? "Default location" : "Mặc định"}: {province.name[locale] ?? province.name.vi}. {en ? "Change location and units in the full calculator." : "Bạn có thể đổi tỉnh và đơn vị ở bộ tính đầy đủ."}</p>
  </form>;
}
