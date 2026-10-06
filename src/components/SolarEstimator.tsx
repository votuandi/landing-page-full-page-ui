"use client";

import { useEffect, useMemo, useState } from "react";
import { CalculatorIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { SEGMENTS, SEGMENT_ORDER, type Segment } from "@/config/segments";
import { BILL_INPUT, DEFAULT_PROVINCE, PROVINCES, REGION_LABELS, ROOF_INPUT, SYSTEM, type Region } from "@/config/solar";
import { calculateSolar, defaultDaytimeRatio } from "@/lib/solarCalculator";
import { formatMoneyShort, formatNumber, parseNumber } from "@/lib/format";
import { SECTION_IDS, useSegment } from "@/lib/segment";
import { STORAGE_KEYS, writeJson } from "@/lib/storage";
import { useCountUp } from "@/lib/useCountUp";
import { delay } from "@/utils/reveal";
import type { LeadSource } from "@/lib/leads/types";
import LeadForm from "@/components/LeadForm";
import SegmentIcon from "@/components/SegmentIcon";

const REGIONS = Object.keys(REGION_LABELS) as Region[];
const TARIFF_NAME: Record<Segment, string> = { household: "sinh hoạt bậc thang", shop: "kinh doanh", factory: "sản xuất", farm: "sản xuất" };

function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  return <>{format(useCountUp(value, { duration: 700 }))}</>;
}

/**
 * Dự toán chi phí (3.6): mọi ô nhập hiện cùng lúc, kết quả sơ bộ cập nhật ngay.
 * Logic ở hàm thuần lib/solarCalculator.ts (có unit test); số liệu ở config/solar.ts.
 */
export default function SolarEstimator() {
  const shared = useSegment();
  const [segment, setSegmentLocal] = useState<Segment>("household");
  const [bill, setBill] = useState(BILL_INPUT.household.default);
  const [roofText, setRoofText] = useState(String(ROOF_INPUT.household.default));
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [ratio, setRatio] = useState(defaultDaytimeRatio("household"));
  const [touched, setTouched] = useState(false);
  const [leadSource, setLeadSource] = useState<LeadSource>("calculator");

  const applySegment = (next: Segment) => {
    setSegmentLocal(next);
    setBill(BILL_INPUT[next].default);
    setRoofText(String(ROOF_INPUT[next].default));
    setRatio(defaultDaytimeRatio(next));
  };

  // Điền sẵn phân khúc khi được chọn ở lưới phân khúc / gói giải pháp / nút trong video
  useEffect(() => {
    if (!shared.segment) return;
    setLeadSource(shared.source === "story-cta" ? "story-cta" : "calculator");
    if (shared.segment !== segment) applySegment(shared.segment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shared.version]);

  const chooseSegment = (next: Segment) => {
    setLeadSource("calculator");
    setTouched(true);
    applySegment(next);
    shared.setSegment(next);
  };

  const roof = parseNumber(roofText);
  const roofValid = roof >= SYSTEM.minRoofArea;
  const range = BILL_INPUT[segment];
  const result = useMemo(
    () => calculateSolar({ segment, monthlyBill: bill, roofArea: Math.max(roof, SYSTEM.minRoofArea), province, daytimeRatio: ratio }),
    [segment, bill, roof, province, ratio],
  );

  const estimate = useMemo(() => ({
    "Đối tượng": SEGMENTS[segment].label,
    "Hóa đơn/tháng (đ)": formatNumber(bill),
    "Diện tích mái (m²)": Math.max(roof, SYSTEM.minRoofArea),
    "Tỉnh/thành": province,
    "Tỷ lệ ban ngày (%)": ratio,
    "kWh/tháng": Math.round(result.monthlyKwh),
    "Công suất đề xuất (kWp)": result.kwp,
    "Số tấm pin": result.panels,
    "Chi phí ước tính (đ)": formatNumber(result.cost),
    "Tiết kiệm/tháng (đ)": formatNumber(result.monthlySavings),
    "Hoàn vốn (năm)": Number.isFinite(result.paybackYears) ? Number(result.paybackYears.toFixed(1)) : "—",
    "Giới hạn bởi mái": result.limitedByRoof,
  }), [segment, bill, roof, province, ratio, result]);

  // Lưu kết quả gần nhất (sau khi khách đã tự nhập) để giỏ báo giá có thể đính kèm
  useEffect(() => {
    if (!touched || !roofValid) return;
    const t = setTimeout(() => writeJson(STORAGE_KEYS.lastEstimate, { savedAt: Date.now(), segment: SEGMENTS[segment].label, estimate }), 400);
    return () => clearTimeout(t);
  }, [touched, roofValid, segment, estimate]);

  const edit = <T,>(setter: (v: T) => void) => (v: T) => { setTouched(true); setter(v); };

  return (
    <section id={SECTION_IDS.calculator} className="t5-section relative overflow-hidden bg-gradient-to-b from-bg-tint to-bg" aria-labelledby="du-toan-title">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-sun)/.2),transparent_65%)]" />
      <div className="t5-container relative">
        <div data-reveal="down" className="max-w-3xl">
          <span className="t5-eyebrow"><CalculatorIcon className="h-4 w-4" />Dự toán miễn phí</span>
          <h2 id="du-toan-title" className="t5-heading">Dự toán chi phí lắp đặt trong 30 giây.</h2>
          <p className="t5-subheading">Nhập tiền điện và diện tích mái để biết công suất phù hợp, số tấm pin, tiền tiết kiệm mỗi tháng và thời gian hoàn vốn.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          {/* ===== Đầu vào ===== */}
          <div data-reveal="left" style={delay(0.1)} className="t8-card grid content-start gap-6 p-5 sm:p-8">
            <fieldset>
              <legend className="t5-label">Bạn lắp cho</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SEGMENT_ORDER.map((s) => {
                  const active = s === segment;
                  return (
                    <label key={s} className={`flex min-h-[84px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-center text-sm font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${active ? "border-primary bg-primary/10 text-fg" : "border-line/15 bg-bg-elevated text-fg-muted hover:border-primary/40"}`}>
                      <input type="radio" name="segment" value={s} checked={active} onChange={() => chooseSegment(s)} className="sr-only" />
                      <SegmentIcon segment={s} className={`h-6 w-6 ${active ? "text-primary" : ""}`} />
                      {SEGMENTS[s].short}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className="t5-label" htmlFor="bill-input">Tiền điện trung bình mỗi tháng</label>
              <div className="relative">
                <input id="bill-input" inputMode="numeric" className="t5-input pr-10 text-xl font-black sm:text-xl" value={formatNumber(bill)}
                  onChange={(e) => edit(setBill)(Math.min(range.max * 5, parseNumber(e.target.value)))} aria-describedby="bill-hint" />
                <span className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 font-bold text-fg-muted">đ</span>
              </div>
              <input type="range" aria-label="Kéo để chọn tiền điện mỗi tháng" min={range.min} max={range.max} step={range.step} value={Math.min(range.max, Math.max(range.min, bill))}
                onChange={(e) => edit(setBill)(Number(e.target.value))} className="mt-3 h-8 w-full accent-primary" />
              <p id="bill-hint" className="text-xs text-fg-muted">≈ <strong className="text-fg">{formatNumber(result.monthlyKwh)} kWh</strong>/tháng theo giá điện {TARIFF_NAME[segment]}.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="t5-label" htmlFor="roof-input">Diện tích mái (m²)</label>
                <input id="roof-input" inputMode="numeric" className="t5-input text-xl font-black sm:text-xl" value={roofText}
                  aria-invalid={!roofValid} aria-describedby="roof-hint"
                  onChange={(e) => edit(setRoofText)(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
                <p id="roof-hint" className={`mt-2 text-xs ${roofValid ? "text-fg-muted" : "font-bold text-danger"}`}>
                  {roofValid ? `Lắp tối đa ~${formatNumber(result.kwpRoofMax, 1)} kWp (${String(SYSTEM.m2PerKwp).replace(".", ",")} m²/kWp).` : `Tối thiểu ${SYSTEM.minRoofArea} m².`}
                </p>
              </div>
              <div>
                <label className="t5-label" htmlFor="province-select">Tỉnh/thành</label>
                <select id="province-select" value={province} onChange={(e) => edit(setProvince)(e.target.value)} className="t5-input min-h-[52px]" aria-describedby="province-hint">
                  {REGIONS.map((r) => (
                    <optgroup key={r} label={REGION_LABELS[r]}>
                      {PROVINCES.filter((p) => p.region === r).map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                <p id="province-hint" className="mt-2 text-xs text-fg-muted">{REGION_LABELS[result.region]}: ~{String(result.peakSunHours).replace(".", ",")} giờ nắng/ngày.</p>
              </div>
            </div>

            <div>
              <label className="t5-label" htmlFor="ratio-range">Điện dùng vào ban ngày: <strong className="text-lg text-primary">{ratio}%</strong></label>
              <input id="ratio-range" type="range" min={10} max={100} step={5} value={ratio} onChange={(e) => edit(setRatio)(Number(e.target.value))} className="mt-2 h-8 w-full accent-primary" />
              <div className="flex justify-between text-xs font-bold text-fg-subtle"><span>Chủ yếu buổi tối</span><span>Cả ngày</span></div>
              {ratio !== defaultDaytimeRatio(segment) && <button type="button" className="mt-2 min-h-11 text-xs font-bold text-primary underline" onClick={() => setRatio(defaultDaytimeRatio(segment))}>Dùng mức gợi ý cho {SEGMENTS[segment].label.toLowerCase()}: {defaultDaytimeRatio(segment)}%</button>}
            </div>
          </div>

          {/* ===== Kết quả + form báo giá chi tiết ===== */}
          <div data-reveal="right" style={delay(0.2)} className="t13-invert relative overflow-hidden rounded-[32px] bg-gradient-to-br from-bg-deep via-bg-deep to-primary-deep p-5 shadow-[0_40px_80px_-40px_rgb(var(--c-shadow)/.7)] sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(var(--c-sun)/.3),transparent_65%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-black">Kết quả sơ bộ</h3><span className="rounded-full bg-glass px-3 py-1 text-xs font-bold text-fg-muted">{SEGMENTS[segment].short} • {province}</span></div>
              <div aria-live="polite" className="mt-5 grid grid-cols-2 gap-3">
                {([
                  ["Công suất", <><CountUp value={result.kwp} format={(v) => formatNumber(v, 1)} /> <span className="text-base">kWp</span></>],
                  ["Số tấm pin", <><CountUp value={result.panels} format={(v) => formatNumber(v)} /> <span className="text-base">tấm</span></>],
                  ["Tiết kiệm", <>~<CountUp value={result.monthlySavings} format={formatMoneyShort} /><span className="text-base">/tháng</span></>],
                  ["Hoàn vốn", Number.isFinite(result.paybackYears) ? <>~<CountUp value={result.paybackYears} format={(v) => formatNumber(v, 1)} /> <span className="text-base">năm</span></> : "—"],
                ] as const).map(([label, value]) => (
                  <div key={label} className="t8-glass-dark rounded-2xl p-4 sm:p-5">
                    <div className="text-[11px] font-bold uppercase tracking-[.14em] text-fg-muted">{label}</div>
                    <div className="mt-2 text-2xl font-black tabular-nums text-highlight sm:text-3xl">{value}</div>
                  </div>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-fg-muted">Chi phí ước tính</dt><dd className="text-right font-black">{formatMoneyShort(result.cost)}</dd>
                <dt className="text-fg-muted">Sản lượng/tháng</dt><dd className="text-right font-black">{formatNumber(result.monthlyProduction)} kWh</dd>
              </dl>
              {result.limitedByRoof && (
                <p className="mt-4 flex gap-2 rounded-2xl border border-highlight/40 bg-highlight/10 p-3 text-sm"><ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-highlight" />Mái chỉ đủ cho {formatNumber(result.kwpRoofMax, 1)} kWp (nhu cầu ~{formatNumber(result.kwpNeeded, 1)} kWp). Có thể tận dụng thêm mái phụ, nhà xe.</p>
              )}
              <p className="mt-4 text-xs text-fg-muted"><strong className="text-fg">Kết quả ước tính</strong> theo biểu giá và giờ nắng trung bình — chi phí thực tế xác định sau khảo sát.</p>

              <div className="mt-6 border-t border-line/15 pt-6">
                <h3 className="text-lg font-black">Nhận báo giá chi tiết</h3>
                <p className="mb-4 mt-1 text-sm text-fg-muted">Gửi kèm toàn bộ thông số trên — kỹ sư gọi lại tư vấn miễn phí.</p>
                <LeadForm source={leadSource} getExtra={() => ({ segment: SEGMENTS[segment].label, estimate })} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
