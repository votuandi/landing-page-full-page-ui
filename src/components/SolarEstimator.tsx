"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, BuildingOffice2Icon, BuildingStorefrontIcon, CalculatorIcon, ExclamationTriangleIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import { BILL_INPUT, DEFAULT_PROVINCE, PROVINCES, REGION_LABELS, ROOF_INPUT, SEGMENTS, SEGMENT_ORDER, SYSTEM, type Segment } from "@/config/solar";
import { calculateSolar, defaultDaytimeRatio, formatMoneyShort, formatNumber, parseNumber } from "@/lib/solarCalculator";
import { CALCULATOR_ID, onOpenCalculator } from "@/lib/calculatorBus";
import { useCountUp } from "@/lib/useCountUp";
import { delay } from "@/utils/reveal";
import LeadForm from "@/components/LeadForm";

const SEGMENT_ICONS = { household: HomeModernIcon, shop: BuildingStorefrontIcon, factory: BuildingOffice2Icon } as const;
const STEPS = ["Đối tượng", "Hóa đơn điện", "Diện tích mái", "Tỉnh/thành", "Dùng ban ngày"] as const;
const REGIONS = Object.keys(REGION_LABELS) as (keyof typeof REGION_LABELS)[];

function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  const v = useCountUp(value, { duration: 900 });
  return <>{format(v)}</>;
}

export default function SolarEstimator() {
  const [step, setStep] = useState(0);
  const [segment, setSegment] = useState<Segment>("household");
  const [bill, setBill] = useState(BILL_INPUT.household.default);
  const [roof, setRoof] = useState(ROOF_INPUT.household.default);
  const [roofText, setRoofText] = useState(String(ROOF_INPUT.household.default));
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [ratio, setRatio] = useState(defaultDaytimeRatio("household"));
  const resultRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  const chooseSegment = (next: Segment) => {
    setSegment(next);
    setBill(BILL_INPUT[next].default);
    setRoof(ROOF_INPUT[next].default);
    setRoofText(String(ROOF_INPUT[next].default));
    setRatio(defaultDaytimeRatio(next));
  };

  // Điền sẵn phân khúc khi bấm CTA ở gói giải pháp / video / ?phan-khuc=
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("phan-khuc") as Segment | null;
    if (fromUrl && fromUrl in SEGMENTS) { chooseSegment(fromUrl); setStep(1); }
    return onOpenCalculator((s) => { if (s) { chooseSegment(s); setStep(1); } });
  }, []);

  const roofValid = roof >= SYSTEM.minRoofArea;
  const result = useMemo(
    () => calculateSolar({ segment, monthlyBill: bill, roofArea: Math.max(roof, SYSTEM.minRoofArea), province, daytimeRatio: ratio }),
    [segment, bill, roof, province, ratio],
  );

  const range = BILL_INPUT[segment];
  const goTo = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => stepHeadingRef.current?.focus({ preventScroll: true }));
  };
  const showResult = () => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const estimate = {
    "Đối tượng": SEGMENTS[segment].label,
    "Hóa đơn/tháng (đ)": formatNumber(bill),
    "Diện tích mái (m²)": roof,
    "Tỉnh/thành": province,
    "Tỷ lệ ban ngày (%)": ratio,
    "kWh/tháng": Math.round(result.monthlyKwh),
    "Công suất đề xuất (kWp)": result.kwp,
    "Số tấm pin": result.panels,
    "Chi phí ước tính (đ)": formatNumber(result.cost),
    "Sản lượng/tháng (kWh)": Math.round(result.monthlyProduction),
    "Tiết kiệm/tháng (đ)": formatNumber(result.monthlySavings),
    "Hoàn vốn (năm)": Number(result.paybackYears.toFixed(1)),
    "Giới hạn bởi mái": result.limitedByRoof,
  };

  return (
    <section id={CALCULATOR_ID} className="t5-section relative overflow-hidden bg-gradient-to-b from-bg-tint to-bg" aria-labelledby="du-toan-title">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.18),transparent_65%)]" />
      <div className="t5-container relative">
        <div data-reveal="down" className="max-w-3xl">
          <span className="t5-eyebrow"><CalculatorIcon className="h-4 w-4" />Dự toán miễn phí</span>
          <h2 id="du-toan-title" className="t5-heading">Dự toán chi phí lắp đặt trong 30 giây.</h2>
          <p className="t5-subheading">Trả lời 5 câu hỏi để biết công suất phù hợp, số tấm pin, tiền tiết kiệm mỗi tháng và thời gian hoàn vốn.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-8">
          {/* ===== Các bước nhập ===== */}
          <div data-reveal="left" style={delay(0.1)} className="t8-card flex flex-col p-5 sm:p-8">
            <ol className="grid grid-cols-5 gap-1.5" aria-label="Tiến trình">
              {STEPS.map((label, i) => (
                <li key={label}>
                  <button type="button" onClick={() => goTo(i)} aria-current={i === step ? "step" : undefined} aria-label={`Bước ${i + 1}: ${label}`} className="group block w-full py-2">
                    <span className={`block h-1.5 rounded-full transition ${i <= step ? "bg-primary" : "bg-line/15"}`} />
                    <span className={`mt-2 hidden text-[11px] font-bold sm:block ${i === step ? "text-fg" : "text-fg-subtle"}`}>{label}</span>
                  </button>
                </li>
              ))}
            </ol>

            <div className="mt-5 flex-1">
              <div className="text-xs font-black uppercase tracking-[.16em] text-accent-soft">Bước {step + 1}/5</div>
              <h3 ref={stepHeadingRef} tabIndex={-1} className="mt-1 text-2xl font-black text-fg outline-none">
                {["Bạn lắp cho công trình nào?", "Hóa đơn điện trung bình mỗi tháng?", "Diện tích mái có thể lắp pin?", "Công trình ở tỉnh/thành nào?", "Bao nhiêu % điện dùng vào ban ngày?"][step]}
              </h3>

              {step === 0 && (
                <div role="radiogroup" aria-label="Đối tượng" className="mt-5 grid gap-3">
                  {SEGMENT_ORDER.map((s) => {
                    const Icon = SEGMENT_ICONS[s];
                    const active = s === segment;
                    return (
                      <button key={s} type="button" role="radio" aria-checked={active} onClick={() => { chooseSegment(s); goTo(1); }}
                        className={`flex min-h-16 items-center gap-4 rounded-2xl border p-4 text-left transition ${active ? "border-primary bg-primary/15" : "border-line/15 bg-glass hover:bg-glass-tint/10"}`}>
                        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${active ? "bg-primary text-on-primary" : "bg-glass-strong text-fg"}`}><Icon className="h-6 w-6" /></span>
                        <span><span className="block font-black text-fg">{SEGMENTS[s].label}</span><span className="text-sm text-fg-muted">Mặc định {SEGMENTS[s].defaultDaytimeRatio}% điện dùng ban ngày</span></span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 1 && (
                <div className="mt-5">
                  <label className="t5-label" htmlFor="bill-input">Tiền điện/tháng (VNĐ)</label>
                  <div className="relative">
                    <input id="bill-input" inputMode="numeric" className="t5-input pr-12 text-2xl font-black sm:text-2xl" value={formatNumber(bill)}
                      onChange={(e) => setBill(Math.min(range.max * 5, parseNumber(e.target.value)))} />
                    <span className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 font-bold text-fg-muted">đ</span>
                  </div>
                  <input type="range" aria-label="Kéo để chọn tiền điện" min={range.min} max={range.max} step={range.step} value={Math.min(range.max, Math.max(range.min, bill))}
                    onChange={(e) => setBill(Number(e.target.value))} className="mt-5 h-8 w-full accent-accent" />
                  <div className="flex justify-between text-xs font-bold text-fg-subtle"><span>{formatMoneyShort(range.min)}</span><span>{formatMoneyShort(range.max)}</span></div>
                  <p className="mt-4 text-sm text-fg-muted">≈ <strong className="text-fg">{formatNumber(result.monthlyKwh)} kWh</strong>/tháng theo biểu giá {segment === "household" ? "sinh hoạt bậc thang" : segment === "shop" ? "kinh doanh" : "sản xuất"}.</p>
                </div>
              )}

              {step === 2 && (
                <div className="mt-5">
                  <label className="t5-label" htmlFor="roof-input">Diện tích mái khả dụng (m²)</label>
                  <input id="roof-input" inputMode="numeric" className="t5-input text-2xl font-black sm:text-2xl" value={roofText}
                    aria-invalid={!roofValid} aria-describedby="roof-hint"
                    onChange={(e) => { const n = parseNumber(e.target.value); setRoofText(e.target.value.replace(/[^\d]/g, "")); setRoof(n); }} />
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[30, 60, 120, 500, 1000, 3000, 10000].filter((v) => v <= ROOF_INPUT[segment].max).slice(0, 4).map((v) => (
                      <button key={v} type="button" onClick={() => { setRoof(v); setRoofText(String(v)); }} className={`min-h-11 rounded-xl border text-sm font-bold ${roof === v ? "border-primary bg-primary/15 text-fg" : "border-line/15 text-fg-muted"}`}>{formatNumber(v)}</button>
                    ))}
                  </div>
                  <p id="roof-hint" className={`mt-4 text-sm ${roofValid ? "text-fg-muted" : "font-bold text-danger"}`}>
                    {roofValid ? `Lắp tối đa khoảng ${result.kwpRoofMax} kWp (${SYSTEM.m2PerKwp} m² mỗi kWp).` : `Diện tích tối thiểu ${SYSTEM.minRoofArea} m².`}
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="mt-5">
                  <label className="t5-label" htmlFor="province-select">Tỉnh/thành</label>
                  <select id="province-select" value={province} onChange={(e) => setProvince(e.target.value)} className="t5-input min-h-12">
                    {REGIONS.map((r) => (
                      <optgroup key={r} label={REGION_LABELS[r]}>
                        {PROVINCES.filter((p) => p.region === r).map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-4 text-sm text-fg-muted">Vùng {REGION_LABELS[result.region]}: khoảng <strong className="text-fg">{result.peakSunHours.toString().replace(".", ",")} giờ nắng đỉnh</strong>/ngày.</p>
                </div>
              )}

              {step === 4 && (
                <div className="mt-5">
                  <label className="t5-label" htmlFor="ratio-range">Tỷ lệ dùng điện ban ngày: <strong className="text-2xl text-accent">{ratio}%</strong></label>
                  <input id="ratio-range" type="range" min={10} max={100} step={5} value={ratio} onChange={(e) => setRatio(Number(e.target.value))} className="mt-4 h-8 w-full accent-accent" />
                  <div className="flex justify-between text-xs font-bold text-fg-subtle"><span>Chủ yếu buổi tối</span><span>Cả ngày</span></div>
                  <p className="mt-4 text-sm text-fg-muted">Gợi ý cho {SEGMENTS[segment].label.toLowerCase()}: {defaultDaytimeRatio(segment)}%. <button type="button" className="font-bold text-primary underline" onClick={() => setRatio(defaultDaytimeRatio(segment))}>Dùng giá trị gợi ý</button></p>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              {step > 0 && <button type="button" onClick={() => goTo(step - 1)} className="t5-button t5-button-secondary min-h-12" aria-label="Bước trước"><ArrowLeftIcon className="h-5 w-5" /></button>}
              {step < 4
                ? <button type="button" disabled={step === 2 && !roofValid} onClick={() => goTo(step + 1)} className="t5-button t5-button-primary min-h-12 flex-1 text-base disabled:opacity-50">Tiếp tục <ArrowRightIcon className="h-5 w-5" /></button>
                : <button type="button" onClick={showResult} className="t5-button t5-button-primary min-h-12 flex-1 text-base lg:hidden">Xem kết quả <ArrowRightIcon className="h-5 w-5" /></button>}
            </div>
          </div>

          {/* ===== Kết quả ===== */}
          <div ref={resultRef} data-reveal="right" style={delay(0.2)} className="t12-invert relative scroll-mt-24 overflow-hidden rounded-[32px] bg-gradient-to-br from-bg-deep via-bg-tint to-primary-deep p-5 text-fg shadow-[0_40px_80px_-40px_rgb(var(--c-shadow)/.7)] sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.35),transparent_65%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-black">Kết quả sơ bộ</h3><span className="rounded-full bg-glass-strong px-3 py-1 text-xs font-bold text-fg-muted">{SEGMENTS[segment].short} • {province}</span></div>
              <div aria-live="polite" className="mt-5 grid grid-cols-2 gap-3">
                {[
                  ["Công suất đề xuất", <><CountUp value={result.kwp} format={(v) => v.toFixed(1).replace(".", ",")} /> <span className="text-base">kWp</span></>],
                  ["Số tấm pin", <><CountUp value={result.panels} format={(v) => formatNumber(v)} /> <span className="text-base">tấm</span></>],
                  ["Tiết kiệm ~", <><CountUp value={result.monthlySavings} format={formatMoneyShort} /><span className="text-base">/tháng</span></>],
                  ["Hoàn vốn ~", <><CountUp value={Number.isFinite(result.paybackYears) ? result.paybackYears : 0} format={(v) => v.toFixed(1).replace(".", ",")} /> <span className="text-base">năm</span></>],
                ].map(([label, value]) => (
                  <div key={label as string} className="t8-glass-dark rounded-2xl p-4 sm:p-5">
                    <div className="text-[11px] font-bold uppercase tracking-[.14em] text-fg-muted">{label}</div>
                    <div className="mt-2 text-2xl font-black tabular-nums text-accent sm:text-3xl">{value}</div>
                  </div>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-fg-muted">Chi phí ước tính</dt><dd className="text-right font-black">{formatMoneyShort(result.cost)}</dd>
                <dt className="text-fg-muted">Sản lượng/tháng</dt><dd className="text-right font-black">{formatNumber(result.monthlyProduction)} kWh</dd>
              </dl>
              {result.limitedByRoof && (
                <p className="mt-4 flex gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-sm text-fg"><ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-accent" />Mái chỉ đủ cho {result.kwpRoofMax} kWp (nhu cầu ~{result.kwpNeeded.toFixed(1).replace(".", ",")} kWp). Có thể tận dụng thêm mái phụ, nhà xe.</p>
              )}
              <p className="mt-4 text-xs text-fg-muted">* Kết quả ước tính, chi phí thực tế sau khảo sát.</p>

              <div className="mt-6 border-t border-line/15 pt-6">
                <h3 className="text-lg font-black">Nhận báo giá chi tiết</h3>
                <p className="mb-4 mt-1 text-sm text-fg-muted">Gửi kèm toàn bộ thông số trên — kỹ sư gọi lại tư vấn miễn phí.</p>
                <LeadForm source="calculator" extra={{ segment: SEGMENTS[segment].label, estimate }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
