"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { z } from "zod";
import {
  BanknotesIcon, ClipboardDocumentCheckIcon, ExclamationTriangleIcon, MapPinIcon, TagIcon, XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  PROVINCES, REGION_LABELS, REGION_ORDER, calculateSolar, formatMoneyShort, formatNumber, onOpenCalculator, parseNumber,
  prefillFromUrl, type CalculatorPrefill, type Segment,
} from "@solar/core";
import { delay, useCountUp } from "@solar/ui";
import { pickLocale } from "../fields/pickLocale";
import { LeadForm } from "../shared/LeadForm";
import { SegmentIcon } from "../shared/SegmentIcon";
import type { Locale } from "../site";
import { toCalculatorParams } from "./params";
import type { calculatorSchema } from "./schema";

type Data = z.output<typeof calculatorSchema>;

const TIP_ICONS = [MapPinIcon, ClipboardDocumentCheckIcon, BanknotesIcon];
// Chuỗi giao diện (không phải nội dung tenant).
const UI = {
  vi: {
    for: "Bạn lắp cho", bill: "Tiền điện trung bình mỗi tháng", billDrag: "Kéo để chọn tiền điện mỗi tháng",
    perMonth: "/tháng", roof: "Diện tích mái (m²)", roofMax: (kwp: string, m2: string) => `Lắp tối đa khoảng ${kwp} kWp (${m2} m²/kWp).`,
    roofMin: (m2: number) => `Tối thiểu ${m2} m².`, province: "Tỉnh/thành", sun: "giờ nắng/ngày", ratio: "Điện dùng vào ban ngày",
    evening: "Chủ yếu buổi tối", allDay: "Cả ngày", suggest: (label: string, value: number) => `Dùng mức gợi ý cho ${label.toLowerCase()}: ${value}%`,
    asking: "Đang hỏi giá", clearTopic: "Bỏ nhu cầu đã chọn", size: "Công suất", panels: "Số tấm pin", pcs: "tấm",
    savings: "Tiết kiệm", month: "tháng", payback: "Hoàn vốn", years: "năm", cost: "Chi phí ước tính", output: "Sản lượng/tháng",
    roofLimited: (max: string, need: string) => `Mái chỉ đủ cho ${max} kWp (nhu cầu ~${need} kWp). Có thể tận dụng thêm mái phụ, nhà xe.`,
  },
  en: {
    for: "Installing for", bill: "Average monthly electricity bill", billDrag: "Drag to set monthly bill",
    perMonth: "/month", roof: "Roof area (m²)", roofMax: (kwp: string, m2: string) => `Fits up to about ${kwp} kWp (${m2} m²/kWp).`,
    roofMin: (m2: number) => `Minimum ${m2} m².`, province: "Province", sun: "sun hours/day", ratio: "Daytime usage",
    evening: "Mostly evening", allDay: "All day", suggest: (label: string, value: number) => `Use the suggested level for ${label.toLowerCase()}: ${value}%`,
    asking: "Asking about", clearTopic: "Clear selected need", size: "System size", panels: "Panels", pcs: "pcs",
    savings: "Savings", month: "mo", payback: "Payback", years: "yrs", cost: "Estimated cost", output: "Output / month",
    roofLimited: (max: string, need: string) => `Roof fits only ${max} kWp (need ~${need} kWp). Consider extra roofs or carports.`,
  },
} as const;

function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  return <>{format(useCountUp(value, { duration: 700 }))}</>;
}

/**
 * Dự toán t15: ô nhập theo `steps`, kết quả cập nhật ngay, form báo giá gửi kèm thông số.
 * Mọi hệ số đến từ dữ liệu section; điền sẵn từ URL (?phan-khuc=&hoa-don=&nhu-cau=) và calculatorBus.
 */
export default function CalculatorIsland({ data, locale, sectionId }: { data: Data; locale: Locale; sectionId: string }) {
  const ui = UI[locale];
  const t = (value: { vi: string; en?: string }) => pickLocale(value, locale);
  const params = useMemo(() => toCalculatorParams(data), [data]);
  const allowed = useMemo(() => new Set<Segment>(data.segments.map((s) => s.segment)), [data.segments]);
  const first = data.segments[0].segment;
  const id = (name: string) => `${sectionId}-${name}`;

  const [segment, setSegment] = useState<Segment>(first);
  const [bill, setBill] = useState(data.inputs[first].bill.default);
  const [roofText, setRoofText] = useState(String(data.inputs[first].roof.default));
  const [province, setProvince] = useState(data.defaultProvince);
  const [ratio, setRatio] = useState(data.segmentRatios[first]);
  const [topic, setTopic] = useState("");
  const [touched, setTouched] = useState(false);
  const [leadSource, setLeadSource] = useState(data.leadSource);
  const applyRef = useRef<(prefill: CalculatorPrefill) => void>(() => {});

  const applySegment = (next: Segment) => {
    setSegment(next);
    setBill(data.inputs[next].bill.default);
    setRoofText(String(data.inputs[next].roof.default));
    setRatio(data.segmentRatios[next]);
  };

  const apply = ({ segment: s, bill: b, topic: t, source }: CalculatorPrefill) => {
    if (!s && !b && !t && !source) return;
    if (s && allowed.has(s)) applySegment(s);
    if (b) setBill(b);
    setTopic(t || "");
    setLeadSource(source === "story-cta" ? "story-cta" : data.leadSource);
    setTouched(true);
  };
  useEffect(() => { applyRef.current = apply; });

  useEffect(() => {
    applyRef.current(prefillFromUrl());
    return onOpenCalculator((prefill) => applyRef.current(prefill));
  }, []);

  const { minRoofArea, m2PerKwp } = data.system;
  const roof = parseNumber(roofText);
  const roofValid = roof >= minRoofArea;
  const range = data.inputs[segment].bill;
  const result = useMemo(
    () => calculateSolar({ segment, monthlyBill: bill, roofArea: Math.max(roof, minRoofArea), province, daytimeRatio: ratio }, params),
    [segment, bill, roof, province, ratio, params, minRoofArea],
  );
  const current = data.segments.find((s) => s.segment === segment) ?? data.segments[0];

  const estimate = useMemo(() => ({
    "Đối tượng": current.label.vi,
    "Hóa đơn/tháng (đ)": formatNumber(bill),
    "Diện tích mái (m²)": Math.max(roof, minRoofArea),
    "Tỉnh/thành": province,
    "Tỷ lệ ban ngày (%)": ratio,
    "kWh/tháng": Math.round(result.monthlyKwh),
    "Công suất đề xuất (kWp)": result.kwp,
    "Số tấm pin": result.panels,
    "Chi phí ước tính (đ)": formatNumber(result.cost),
    "Sản lượng/tháng (kWh)": Math.round(result.monthlyProduction),
    "Tiết kiệm/tháng (đ)": formatNumber(result.monthlySavings),
    "Hoàn vốn (năm)": Number.isFinite(result.paybackYears) ? Number(result.paybackYears.toFixed(1)) : "—",
    "Giới hạn bởi mái": result.limitedByRoof,
    ...(topic ? { "Nhu cầu": topic } : {}),
  }), [current, bill, roof, minRoofArea, province, ratio, result, topic]);

  // Lưu kết quả gần nhất (sau khi khách tự nhập) để giỏ báo giá đính kèm; storage bị chặn thì bỏ qua.
  useEffect(() => {
    if (!touched || !roofValid) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem("t15-last-estimate", JSON.stringify({ savedAt: Date.now(), segment: current.label.vi, estimate }));
      } catch { /* storage bị chặn */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [touched, roofValid, current, estimate]);

  const edit = <T,>(setter: (v: T) => void) => (v: T) => { setTouched(true); setter(v); };
  const chooseSegment = (next: Segment) => { setLeadSource(data.leadSource); setTouched(true); applySegment(next); };

  const steps = {
    segment: (
      <fieldset>
        <legend className="t15-label">{ui.for}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.segments.map((s) => {
            const active = s.segment === segment;
            return (
              <label key={s.segment} className={`flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center text-sm font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-secondary ${active ? "border-primary bg-primary/[.08] text-fg" : "border-line/10 bg-bg text-fg-muted hover:border-primary/40"}`}>
                <input type="radio" name={id("segment")} value={s.segment} checked={active} onChange={() => chooseSegment(s.segment)} className="sr-only" />
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-primary text-on-primary" : "bg-bg-elevated text-primary"}`}><SegmentIcon segment={s.segment} className="h-5 w-5" /></span>
                {t(s.short)}
              </label>
            );
          })}
        </div>
      </fieldset>
    ),
    bill: (
      <div>
        <label className="t15-label" htmlFor={id("bill")}>{ui.bill}</label>
        <div className="relative">
          <input id={id("bill")} inputMode="numeric" className="t15-input pr-10 text-xl font-black sm:text-xl" value={formatNumber(bill)}
            onChange={(e) => edit(setBill)(Math.min(range.max * 5, parseNumber(e.target.value)))} aria-describedby={id("bill-hint")} />
          <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 font-bold text-fg-muted">đ</span>
        </div>
        <input type="range" aria-label={ui.billDrag} min={range.min} max={range.max} step={range.step} value={Math.min(range.max, Math.max(range.min, bill))}
          onChange={(e) => edit(setBill)(Number(e.target.value))} className="mt-3 h-8 w-full accent-primary" />
        <p id={id("bill-hint")} className="text-xs text-fg-muted">≈ <strong className="text-fg">{formatNumber(result.monthlyKwh)} kWh</strong>{ui.perMonth}</p>
      </div>
    ),
    roof: (
      <div>
        <label className="t15-label" htmlFor={id("roof")}>{ui.roof}</label>
        <input id={id("roof")} inputMode="numeric" className="t15-input text-xl font-black sm:text-xl" value={roofText}
          aria-invalid={!roofValid} aria-describedby={id("roof-hint")}
          onChange={(e) => edit(setRoofText)(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
        <p id={id("roof-hint")} className={`mt-2 text-xs ${roofValid ? "text-fg-muted" : "font-bold text-danger"}`}>
          {roofValid ? ui.roofMax(formatNumber(result.kwpRoofMax, 1), String(m2PerKwp).replace(".", ",")) : ui.roofMin(minRoofArea)}
        </p>
      </div>
    ),
    province: (
      <div>
        <label className="t15-label" htmlFor={id("province")}>{ui.province}</label>
        <select id={id("province")} value={province} onChange={(e) => edit(setProvince)(e.target.value)} className="t15-input min-h-[52px]" aria-describedby={id("province-hint")}>
          {REGION_ORDER.map((r) => (
            <optgroup key={r} label={REGION_LABELS[r]}>
              {PROVINCES.filter((p) => p.region === r).map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </optgroup>
          ))}
        </select>
        <p id={id("province-hint")} className="mt-2 text-xs text-fg-muted">{REGION_LABELS[result.region]}: ~{String(result.peakSunHours).replace(".", ",")} {ui.sun}.</p>
      </div>
    ),
    ratio: (
      <div>
        <label className="t15-label" htmlFor={id("ratio")}>{ui.ratio}: <strong className="text-lg text-primary">{ratio}%</strong></label>
        <input id={id("ratio")} type="range" min={10} max={100} step={5} value={ratio} onChange={(e) => edit(setRatio)(Number(e.target.value))} className="mt-2 h-8 w-full accent-primary" />
        <div className="flex justify-between text-xs font-bold text-fg-subtle"><span>{ui.evening}</span><span>{ui.allDay}</span></div>
        {ratio !== data.segmentRatios[segment] && (
          <button type="button" className="mt-2 min-h-11 text-xs font-bold text-primary underline" onClick={() => setRatio(data.segmentRatios[segment])}>
            {ui.suggest(t(current.label), data.segmentRatios[segment])}
          </button>
        )}
      </div>
    ),
  };

  const stats = [
    [ui.size, <><CountUp value={result.kwp} format={(v) => formatNumber(v, 1)} /> <span className="text-base">kWp</span></>],
    [ui.panels, <><CountUp value={result.panels} format={(v) => formatNumber(v)} /> <span className="text-base">{ui.pcs}</span></>],
    [ui.savings, <>~<CountUp value={result.monthlySavings} format={formatMoneyShort} /><span className="text-base">/{ui.month}</span></>],
    [ui.payback, Number.isFinite(result.paybackYears) ? <>~<CountUp value={result.paybackYears} format={(v) => formatNumber(v, 1)} /> <span className="text-base">{ui.years}</span></> : "—"],
  ] as const;

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
      <div data-reveal="left" style={delay(0.1)} className="t15-card flex flex-col gap-6 p-5 sm:p-8">
        {/* Ô mái + tỉnh nửa cột (đứng cạnh nhau khi liền kề như t15), các ô khác cả hàng. */}
        <div className="grid gap-6 sm:grid-cols-2">
          {data.steps.map((step) => (
            <div key={step} className={step === "roof" || step === "province" ? "" : "sm:col-span-2"}>{steps[step]}</div>
          ))}
        </div>
        {data.tips.length > 0 && (
          <ul className="mt-auto grid gap-2 rounded-3xl bg-bg-tint p-4 text-sm font-semibold text-fg sm:grid-cols-3 sm:p-5">
            {data.tips.map((tip, i) => {
              const Icon = TIP_ICONS[i % TIP_ICONS.length];
              return <li key={i} className="flex items-center gap-2.5 sm:flex-col sm:items-start"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg-elevated text-primary shadow-sm"><Icon aria-hidden className="h-5 w-5" /></span>{t(tip)}</li>;
            })}
          </ul>
        )}
      </div>

      <div data-reveal="right" style={delay(0.2)} className="t15-invert t15-card relative scroll-mt-24 overflow-hidden !border-primary/20 bg-bg-tint p-5 sm:p-8">
        <div aria-hidden className="t15-energy-line absolute inset-x-0 top-0 h-1.5" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-black">{t(data.resultTitle)}</h3>
            <span className="rounded-full bg-glass px-3 py-1 text-xs font-bold text-fg-muted">{t(current.short)} • {province}</span>
          </div>
          {topic && (
            <p className="mt-3 flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-bold text-fg">
              <TagIcon aria-hidden className="h-4 w-4 shrink-0 text-accent-ink" /><span className="flex-1">{ui.asking}: {topic}</span>
              <button type="button" onClick={() => setTopic("")} aria-label={ui.clearTopic} className="grid h-8 w-8 place-items-center rounded-full hover:bg-glass-tint/10"><XMarkIcon aria-hidden className="h-4 w-4" /></button>
            </p>
          )}
          <div aria-live="polite" className="mt-5 grid grid-cols-2 gap-3" data-calculator-result>
            {stats.map(([label, value]) => (
              <div key={label} className="t15-glass-dark rounded-2xl p-4 sm:p-5">
                <div className="text-2xs font-bold uppercase tracking-[.14em] text-fg-muted">{label}</div>
                <div className="mt-2 text-xl font-black leading-tight tabular-nums text-accent-ink sm:text-2xl xl:text-display-xs">{value}</div>
              </div>
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-fg-muted">{ui.cost}</dt><dd className="text-right font-black" data-calculator-cost>{formatMoneyShort(result.cost)}</dd>
            <dt className="text-fg-muted">{ui.output}</dt><dd className="text-right font-black">{formatNumber(result.monthlyProduction)} kWh</dd>
          </dl>
          {result.limitedByRoof && (
            <p className="mt-4 flex gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-sm"><ExclamationTriangleIcon aria-hidden className="h-5 w-5 shrink-0 text-accent-ink" />{ui.roofLimited(formatNumber(result.kwpRoofMax, 1), formatNumber(result.kwpNeeded, 1))}</p>
          )}
          <p className="mt-4 text-xs text-fg-muted">{t(data.disclaimer)}</p>

          <div className="mt-6 border-t border-line/15 pt-6">
            <h3 className="text-lg font-black">{t(data.formTitle)}</h3>
            <p className="mb-4 mt-1 text-sm text-fg-muted">{t(data.formDescription)}</p>
            <LeadForm locale={locale} source={leadSource} fields={{ zalo: true, address: true, message: false }}
              text={{ submit: t(data.ctaLabel), success: t(data.successText), privacy: t(data.privacyNote) }}
              getExtra={() => ({ segment: current.label.vi, estimate })} />
          </div>
        </div>
      </div>
    </div>
  );
}
