"use client";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { estimatePackage, formatNumber, formatVnd, installment, onOpenCalculator, packagesForBill, prefillFromUrl, suggestKwp } from "@solar/core";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import type { PackageSimulation } from "../shared/packageSimulation";
import type { Locale } from "../site";
import type { calculatorSchema } from "./schema";
import { YieldChart } from "./YieldChart";

const inputClass = "mt-2 min-h-12 w-full rounded-input border border-line bg-bg px-4 py-3 text-fg focus-visible:outline-primary";
const cardClass = "rounded-card border border-line bg-bg-elevated p-6 shadow-sm";

export default function PackageCalculator({ simulation, locale, sectionId, data }: { simulation: PackageSimulation; locale: Locale; sectionId: string; data: z.output<typeof calculatorSchema> }) {
  const en = locale === "en", a = simulation.assumptions;
  const t = (v: { vi: string; en?: string }) => pickLocale(v, locale);
  const id = (name: string) => `${sectionId}-${name}`;
  const [bill, setBill] = useState(String(simulation.defaultBill));
  const [unit, setUnit] = useState<"money" | "kwh">("money");
  const [provinceId, setProvince] = useState(simulation.defaultProvince);
  const [selectedId, setSelected] = useState("");
  const [months, setMonths] = useState(a.installment.defaultMonths);
  const [copyState, setCopyState] = useState("");
  useEffect(() => {
    const apply = (prefill: { bill?: number }) => {
      if (prefill.bill !== undefined && Number.isFinite(prefill.bill) && prefill.bill > 0) {
        setBill(String(prefill.bill)); setUnit("money"); setCopyState("");
      }
    };
    apply(prefillFromUrl());
    return onOpenCalculator(apply);
  }, []);
  const amount = Number(bill), valid = Number.isFinite(amount) && amount > 0;
  const province = simulation.provinces.find((p) => p.id === provinceId)!;
  const packages = valid ? packagesForBill(simulation.packages, amount, "money", a) : [];
  const selected = packages.find((p) => p.id === selectedId) ?? packages[0];
  const result = selected ? estimatePackage(selected, province, a) : null;
  const loan = selected && result ? installment(selected.price, months, result.monthlySaving, a.installment.interestPerMonth) : null;
  const summary = selected && result ? `[DỮ LIỆU MẪU]\n${t(selected.name)}\n${t(province.name)}\n${formatVnd(amount)} / ${en ? "month" : "tháng"}\n${formatNumber(selected.kwp, 1)} kWp + ${formatNumber(selected.storageKwh, 1)} kWh\n${formatVnd(selected.price)}\n${formatNumber(result.dailyKwh, 1)} kWh / ${en ? "day" : "ngày"}\n${formatVnd(result.monthlySaving)} / ${en ? "month" : "tháng"}\n${en ? "Payback" : "Hoàn vốn"}: ${result.paybackYears === null ? "—" : formatNumber(result.paybackYears, 1)} ${en ? "years" : "năm"}` : "";
  const edit = (value: string) => { setBill(value); setCopyState(""); };
  async function copySummary() {
    try { await navigator.clipboard.writeText(summary); setCopyState(en ? "Summary copied." : "Đã sao chép thông tin gói."); }
    catch { setCopyState(en ? "Select and copy the summary below." : "Chưa sao chép được. Bạn có thể chọn và sao chép nội dung bên dưới."); }
  }
  const metrics = (rows: [string, string][]) => <dl className="mt-5 divide-y divide-line text-sm">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3"><dt className="text-fg-muted">{label}</dt><dd className="text-right font-semibold">{value}</dd></div>)}</dl>;
  return <div className="mt-9">
    <div data-reveal="up" className={`${cardClass} grid gap-5 sm:grid-cols-2 lg:grid-cols-4`}>
      <label htmlFor={id("range")} className="text-sm font-semibold">{en ? "Quick bill range" : "Chọn nhanh dải hóa đơn"}<select id={id("range")} value="" className={inputClass} onChange={(e) => { if (e.target.value) { edit(e.target.value); setUnit("money"); } }}><option value="">{en ? "Choose a range" : "Chọn một dải tiền điện"}</option>{simulation.packages.filter((p, i, all) => all.findIndex((x) => x.minBill === p.minBill && x.maxBill === p.maxBill) === i).map((p) => <option key={p.id} value={Math.max(1, p.minBill)}>{formatVnd(p.minBill)} – {p.maxBill === null ? "+" : formatVnd(p.maxBill)}</option>)}</select></label>
      <label htmlFor={id("unit")} className="text-sm font-semibold">{en ? "Input unit" : "Đơn vị nhập"}<select id={id("unit")} value={unit} className={inputClass} onChange={(e) => { setUnit(e.target.value as "money" | "kwh"); setCopyState(""); }}><option value="money">{en ? "Monthly bill (VND)" : "Tiền điện (đồng/tháng)"}</option><option value="kwh">kWh / {en ? "month" : "tháng"}</option></select></label>
      <label htmlFor={id("bill")} className="text-sm font-semibold">{unit === "money" ? (en ? "Monthly electricity bill" : "Nhập tiền điện / tháng") : (en ? "Monthly consumption (kWh)" : "Nhập điện tiêu thụ / tháng")}
        <input id={id("bill")} type="number" min="1" step="any" inputMode="decimal" className={inputClass} value={bill === "" ? "" : unit === "money" ? bill : Number(bill) / a.electricityPrice} onChange={(e) => edit(e.target.value === "" ? "" : String(Number(e.target.value) * (unit === "kwh" ? a.electricityPrice : 1)))} />
      </label>
      <label htmlFor={id("province")} className="text-sm font-semibold">{en ? "Installation province" : "Tỉnh / thành phố lắp đặt"}<select id={id("province")} className={inputClass} value={provinceId} onChange={(e) => { setProvince(e.target.value); setCopyState(""); }}>{simulation.provinces.map((p) => <option key={p.id} value={p.id}>{t(p.name)}</option>)}</select></label>
    </div>
    <div aria-live="polite" className="my-5 border-l-4 border-primary py-3 pl-5">
      {valid ? <p>{t(province.name)} · {en ? "Suggested size" : "Quy mô gợi ý"}: <strong>{formatNumber(suggestKwp(amount, "money", "hoa-luoi", province, a), 1)} kWp {en ? "grid-tied" : "hòa lưới"}</strong> / <strong>{formatNumber(suggestKwp(amount, "money", "hybrid", province, a), 1)} kWp hybrid</strong></p> : <p role="status">{en ? "Enter a positive bill or consumption." : "Nhập số tiền hoặc điện tiêu thụ lớn hơn 0 để xem gói gợi ý."}</p>}
    </div>
    <p className="mb-5 text-xs leading-6 text-fg-muted">[DỮ LIỆU MẪU] {en ? "Packages are filtered by sample bill ranges. Savings assume self-use and are not capped by your bill or actual load. A survey is required." : "Gói được lọc theo dải hóa đơn mẫu, không tự động thiết kế hệ thống. Tiết kiệm theo giả định tự dùng, chưa giới hạn theo hóa đơn hay phụ tải thực tế. Cần khảo sát."}</p>
    <div className="grid gap-6 lg:grid-cols-2">
      {packages.map((pkg) => { const r = estimatePackage(pkg, province, a); return <article data-reveal="up" key={pkg.id} data-package={pkg.id} className={`${cardClass} ${selected?.id === pkg.id ? "ring-2 ring-primary" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-pill bg-bg-tint px-3 py-1 text-xs text-primary">{pkg.type === "hybrid" ? (en ? "With storage" : "Có lưu trữ") : (en ? "Daytime self-use" : "Tự dùng ban ngày")}</span><button type="button" aria-pressed={selected?.id === pkg.id} onClick={() => { setSelected(pkg.id); setCopyState(""); }} className="min-h-11 rounded-button border border-line px-3 text-sm font-semibold text-primary">{selected?.id === pkg.id ? (en ? "Selected" : "Đang chọn") : (en ? "Select package" : "Chọn gói")}</button></div>
        <h3 className="mt-4 font-display text-xl font-semibold">{t(pkg.name)}</h3><p className="mt-4 text-3xl font-semibold text-primary">{formatNumber(pkg.kwp, 1)} <span className="text-base">kWp{pkg.storageKwh > 0 && ` + ${formatNumber(pkg.storageKwh, 1)} kWh`}</span></p><p className="mt-2 text-xl font-semibold">{formatVnd(pkg.price)} <span className="text-xs font-normal text-fg-muted">{en ? "Sample price" : "Giá mẫu"}</span></p>
        {metrics([[en ? "Daily output" : "Sản lượng / ngày", `${formatNumber(r.dailyKwh, 1)} kWh`], [en ? "Monthly savings" : "Tiết kiệm / tháng", formatVnd(r.monthlySaving)], [en ? "Simple payback" : "Hoàn vốn đơn giản", r.paybackYears === null ? "—" : `${formatNumber(r.paybackYears, 1)} ${en ? "years" : "năm"}`]])}
        <details className="mt-4 border-t border-line pt-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">{en ? "Equipment and package charts" : "Thiết bị và biểu đồ riêng của gói"}</summary><ul className="list-disc space-y-1 pl-5 text-sm">{pkg.equipment.map((item, i) => <li key={i}>{t(item)}</li>)}</ul><p className="mt-3 text-sm">{pkg.phases} {en ? "phase" : "pha"} · {formatNumber(pkg.roofM2)} m²</p><p className="mt-2 text-xs text-fg-muted">{t(pkg.warranty)}</p><YieldChart result={r} name={t(pkg.name)} locale={locale} /></details>
      </article>; })}
      {valid && !packages.length && <p role="status" className="col-span-full py-6">{en ? "No package in this bill range." : "Chưa có gói trong dải hóa đơn này."}</p>}
    </div>
    {selected && result && loan && <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className={cardClass}><p className="text-xs uppercase tracking-widest text-primary">{en ? "Cash flow" : "Cân đối dòng tiền"}</p><h3 className="mt-3 font-display text-xl font-semibold">{en ? "How much extra does the installment need?" : "Trả góp cần bù thêm bao nhiêu mỗi tháng?"}</h3><label htmlFor={id("months")} className="mt-5 block text-sm">{en ? "Term" : "Kỳ hạn"}: <strong>{months} {en ? "months" : "tháng"}</strong></label><input id={id("months")} type="range" min={a.installment.minMonths} max={a.installment.maxMonths} step="1" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="mt-2 h-11 w-full accent-primary" />
        {metrics([[en ? "Monthly payment" : "Tiền góp / tháng", formatVnd(loan.payment)], [en ? "Monthly savings" : "Tiết kiệm / tháng", formatVnd(loan.monthlySaving)], [loan.extra >= 0 ? (en ? "Extra required" : "Thực bù thêm") : (en ? "Remaining savings" : "Tiết kiệm còn lại"), formatVnd(Math.abs(loan.extra))]])}<p className="mt-4 text-xs leading-6 text-fg-muted">[DỮ LIỆU MẪU] {formatNumber(a.installment.interestPerMonth * 100, 1)}%/{en ? "month. Flat interest on initial price, no fees/down payment. Not a credit offer." : "tháng. Lãi đều trên giá gói ban đầu, chưa gồm phí/trả trước. Không phải đề nghị tín dụng."}</p>
      </div>
      <div className={cardClass}><p className="text-xs uppercase tracking-widest text-primary">{en ? "Local solar yield" : "Tra sản lượng địa phương"}</p><h3 className="mt-3 font-display text-xl font-semibold">{t(province.name)}</h3>{metrics([["PVout", `${formatNumber(province.pvout, 1)} kWh/kWp/${en ? "day" : "ngày"}`], [en ? "After PR, per kWp" : "Sau PR, mỗi 1 kWp", `${formatNumber(estimatePackage({ ...selected, kwp: 1 }, province, a).dailyKwh, 1)} kWh`], [en ? "Selected package" : "Gói đang chọn", `${formatNumber(result.dailyKwh, 1)} kWh/${en ? "day" : "ngày"}`]])}<p className="mt-4 text-xs text-fg-muted">[DỮ LIỆU MẪU] {en ? "Unverified assumptions, not roof measurements." : "Số mẫu chưa xác minh, không phải số đo tại mái."} <a href={province.source} target="_blank" rel="noopener noreferrer" className="text-primary underline">Global Solar Atlas</a></p>
        <details className="mt-4"><summary className="min-h-11 cursor-pointer text-sm">{en ? "All provinces" : "Bảng đầy đủ tỉnh / thành phố"}</summary><table className="w-full text-left text-sm"><caption className="sr-only">PVout · [DỮ LIỆU MẪU]</caption><thead><tr><th scope="col">{en ? "Province" : "Tỉnh / thành phố"}</th><th scope="col">kWh/kWp/{en ? "day" : "ngày"}</th></tr></thead><tbody>{simulation.provinces.map((p) => <tr key={p.id}><th scope="row">{t(p.name)}</th><td>{formatNumber(p.pvout, 1)}</td></tr>)}</tbody></table></details>
      </div>
      <div className="rounded-card bg-primary p-6 text-on-primary lg:col-span-2"><h3 className="font-display text-xl font-semibold">{t(data.formTitle)}</h3><p className="mt-2">{t(data.formDescription)}</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={copySummary} className="min-h-11 rounded-button border border-on-primary/40 px-4 py-3 font-semibold">{en ? "Copy package summary" : "Sao chép thông tin gói"}</button>{data.quoteCta ? <SectionLink link={data.quoteCta} locale={locale} className="inline-flex min-h-11 items-center rounded-button bg-accent px-4 py-3 font-semibold text-on-accent">{t(data.quoteCta.label)}</SectionLink> : <a href="#lien-he" className="inline-flex min-h-11 items-center rounded-button bg-accent px-4 py-3 font-semibold text-on-accent">{t(data.ctaLabel)}</a>}</div><p role="status" className="mt-3 text-sm">{copyState}</p><details className="mt-4"><summary className="min-h-11 cursor-pointer">{en ? "View copyable summary" : "Xem thông tin có thể sao chép"}</summary><textarea readOnly rows={10} value={summary} aria-label={en ? "Selected package summary" : "Thông tin gói đã chọn"} className={inputClass} /></details></div>
    </div>}
    <details className="mt-6 border-y border-line py-4"><summary className="min-h-11 cursor-pointer font-semibold">{en ? "Formula and assumptions" : "Công thức và giả định đang dùng"}</summary><p className="text-sm leading-7">{en ? "Daily yield = kWp × PVout × PR. Monthly saving = daily yield × 30 × electricity price × self-use ratio. Payback = package price / annual saving. Net cash flow = annual saving × years − package price." : "Sản lượng/ngày = kWp × PVout × PR. Tiết kiệm/tháng = sản lượng/ngày × 30 × giá điện × tỷ lệ tự dùng. Hoàn vốn = giá gói ÷ tiết kiệm/năm. Ròng tích lũy = tiết kiệm/năm × số năm − giá gói."}</p><p className="mt-3 text-sm">PR: {formatNumber(a.pr, 2)} · {formatVnd(a.electricityPrice)}/kWh · {en ? "Self-use" : "Tự dùng"}: {formatNumber(a.selfUse["hoa-luoi"] * 100)}% / {formatNumber(a.selfUse.hybrid * 100)}%</p><p className="mt-3 text-xs text-fg-muted">{t(a.source)} {t(data.disclaimer)}</p></details>
  </div>;
}
