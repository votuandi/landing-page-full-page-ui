"use client";

import { useCountUp, delay } from "@solar/ui";

import { useEffect, useMemo, useRef, useState } from "react";
import { BanknotesIcon, CalculatorIcon, ClipboardDocumentCheckIcon, ExclamationTriangleIcon, MapPinIcon, TagIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SEGMENTS, defaultDaytimeRatio } from "@/config/segments";
import { SEGMENT_ORDER, type Segment, type Region, calculateSolar, formatMoneyShort, formatNumber, parseNumber, CALCULATOR_ID, onOpenCalculator, prefillFromUrl, type CalculatorPrefill } from "@solar/core";
import { CALCULATOR_PARAMS, BILL_INPUT, DEFAULT_PROVINCE, PROVINCES, REGION_LABELS, ROOF_INPUT, SYSTEM } from "@/config/solar";
import { useSegment } from "@/lib/segment";
import { STORAGE_KEYS, writeJson } from "@/lib/storage";

import { useLang } from "@/i18n/LangProvider";

import LeadForm from "@/components/LeadForm";
import SegmentIcon from "@/components/SegmentIcon";

const REGIONS = Object.keys(REGION_LABELS) as Region[];
const TIPS = [
  [MapPinIcon, "Khảo sát tận nơi miễn phí", "Free on-site survey"],
  [ClipboardDocumentCheckIcon, "Báo giá chi tiết trong 24 giờ", "Detailed quote in 24h"],
  [BanknotesIcon, "Trả góp 0% / lắp 0 đồng (ESCO)", "0% instalments / ESCO"],
] as const;
const TARIFF_NAME: Record<Segment, string> = { household: "sinh hoạt bậc thang", shop: "kinh doanh", factory: "sản xuất", farm: "sản xuất" };

function CountUp({ value, format }: { value: number; format: (v: number) => string }) {
  return <>{format(useCountUp(value, { duration: 700 }))}</>;
}

/**
 * Dự toán chi phí: mọi ô nhập hiện cùng lúc, kết quả sơ bộ cập nhật ngay; form "Nhận báo giá chi tiết" gửi kèm toàn bộ thông số.
 * Điền sẵn từ: lưới phân khúc / gói (state chung), mega menu "Bảng giá lắp đặt", video, dự án (calculatorBus), URL ?phan-khuc=&hoa-don=&nhu-cau=.
 * Logic ở hàm thuần @solar/core (có unit test); số liệu ở config/solar.ts.
 */
export default function SolarEstimator() {
  const { tr } = useLang();
  const shared = useSegment();
  const [segment, setSegmentLocal] = useState<Segment>("household");
  const [bill, setBill] = useState(BILL_INPUT.household.default);
  const [roofText, setRoofText] = useState(String(ROOF_INPUT.household.default));
  const [province, setProvince] = useState(DEFAULT_PROVINCE);
  const [ratio, setRatio] = useState(defaultDaytimeRatio("household"));
  const [topic, setTopic] = useState("");
  const [touched, setTouched] = useState(false);
  const [leadSource, setLeadSource] = useState("calculator");
  const segmentRef = useRef(segment);
  segmentRef.current = segment;

  const applySegment = (next: Segment) => {
    setSegmentLocal(next);
    setBill(BILL_INPUT[next].default);
    setRoofText(String(ROOF_INPUT[next].default));
    setRatio(defaultDaytimeRatio(next));
  };

  // Điền sẵn từ mega menu bảng giá / gói / video / dự án (sự kiện) hoặc từ URL khi đến từ trang khác
  useEffect(() => {
    const apply = ({ segment: s, bill: b, topic: t, source }: CalculatorPrefill) => {
      if (!s && !b && !t && !source) return;
      if (s) { applySegment(s); shared.setSegment(s); }
      if (b) setBill(b);
      setTopic(t || "");
      setLeadSource(source === "story-cta" ? "story-cta" : "calculator");
      setTouched(true);
    };
    apply(prefillFromUrl());
    return onOpenCalculator(apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng bộ khi phân khúc được chọn ở lưới phân khúc / gói giải pháp / bộ lọc video
  useEffect(() => {
    if (shared.segment && shared.segment !== segmentRef.current) applySegment(shared.segment);
  }, [shared.version, shared.segment]);

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
    () => calculateSolar({ segment, monthlyBill: bill, roofArea: Math.max(roof, SYSTEM.minRoofArea), province, daytimeRatio: ratio }, CALCULATOR_PARAMS),
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
    "Sản lượng/tháng (kWh)": Math.round(result.monthlyProduction),
    "Tiết kiệm/tháng (đ)": formatNumber(result.monthlySavings),
    "Hoàn vốn (năm)": Number.isFinite(result.paybackYears) ? Number(result.paybackYears.toFixed(1)) : "—",
    "Giới hạn bởi mái": result.limitedByRoof,
    ...(topic ? { "Nhu cầu": topic } : {}),
  }), [segment, bill, roof, province, ratio, result, topic]);

  // Lưu kết quả gần nhất (sau khi khách đã tự nhập) để giỏ báo giá có thể đính kèm
  useEffect(() => {
    if (!touched || !roofValid) return;
    const t = setTimeout(() => writeJson(STORAGE_KEYS.lastEstimate, { savedAt: Date.now(), segment: SEGMENTS[segment].label, estimate }), 400);
    return () => clearTimeout(t);
  }, [touched, roofValid, segment, estimate]);

  const edit = <T,>(setter: (v: T) => void) => (v: T) => { setTouched(true); setter(v); };

  return (
    <section id={CALCULATOR_ID} className="t15-section relative overflow-hidden bg-gradient-to-b from-bg-sun/70 to-bg" aria-labelledby="du-toan-title">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-glow-accent-22" />
      <div className="t15-container relative">
        <div data-reveal="down" className="max-w-3xl">
          <span className="t15-eyebrow"><CalculatorIcon className="h-4 w-4" />{tr("Dự toán miễn phí", "Free estimate")}</span>
          <h2 id="du-toan-title" className="t15-heading">{tr("Dự toán chi phí lắp đặt trong", "Estimate your installation in")} <span className="t15-gradient-text">{tr("30 giây", "30 seconds")}</span>.</h2>
          <p className="t15-subheading">{tr("Nhập tiền điện và diện tích mái để biết công suất phù hợp, số tấm pin, tiền tiết kiệm mỗi tháng và thời gian hoàn vốn.", "Enter your bill and roof area to see system size, panel count, monthly savings and payback.")}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          {/* ===== Đầu vào ===== */}
          <div data-reveal="left" style={delay(0.1)} className="t15-card flex flex-col gap-6 p-5 sm:p-8">
            <fieldset>
              <legend className="t15-label">{tr("Bạn lắp cho", "Installing for")}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SEGMENT_ORDER.map((s) => {
                  const active = s === segment;
                  return (
                    <label key={s} className={`flex min-h-[88px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center text-sm font-bold transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-secondary ${active ? "border-primary bg-primary/[.08] text-fg" : "border-line/10 bg-bg text-fg-muted hover:border-primary/40"}`}>
                      <input type="radio" name="segment" value={s} checked={active} onChange={() => chooseSegment(s)} className="sr-only" />
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-primary text-on-primary" : "bg-bg-elevated text-primary"}`}><SegmentIcon segment={s} className="h-5 w-5" /></span>
                      {tr(SEGMENTS[s].short, SEGMENTS[s].en.short)}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className="t15-label" htmlFor="bill-input">{tr("Tiền điện trung bình mỗi tháng", "Average monthly electricity bill")}</label>
              <div className="relative">
                <input id="bill-input" inputMode="numeric" className="t15-input pr-10 text-xl font-black sm:text-xl" value={formatNumber(bill)}
                  onChange={(e) => edit(setBill)(Math.min(range.max * 5, parseNumber(e.target.value)))} aria-describedby="bill-hint" />
                <span className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 font-bold text-fg-muted">đ</span>
              </div>
              <input type="range" aria-label={tr("Kéo để chọn tiền điện mỗi tháng", "Drag to set monthly bill")} min={range.min} max={range.max} step={range.step} value={Math.min(range.max, Math.max(range.min, bill))}
                onChange={(e) => edit(setBill)(Number(e.target.value))} className="mt-3 h-8 w-full accent-primary" />
              <p id="bill-hint" className="text-xs text-fg-muted">≈ <strong className="text-fg">{formatNumber(result.monthlyKwh)} kWh</strong>/tháng theo giá điện {TARIFF_NAME[segment]}.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="t15-label" htmlFor="roof-input">{tr("Diện tích mái (m²)", "Roof area (m²)")}</label>
                <input id="roof-input" inputMode="numeric" className="t15-input text-xl font-black sm:text-xl" value={roofText}
                  aria-invalid={!roofValid} aria-describedby="roof-hint"
                  onChange={(e) => edit(setRoofText)(e.target.value.replace(/[^\d]/g, "").slice(0, 6))} />
                <p id="roof-hint" className={`mt-2 text-xs ${roofValid ? "text-fg-muted" : "font-bold text-danger"}`}>
                  {roofValid ? `Lắp tối đa khoảng ${formatNumber(result.kwpRoofMax, 1)} kWp (${String(SYSTEM.m2PerKwp).replace(".", ",")} m²/kWp).` : `Tối thiểu ${SYSTEM.minRoofArea} m².`}
                </p>
              </div>
              <div>
                <label className="t15-label" htmlFor="province-select">{tr("Tỉnh/thành", "Province")}</label>
                <select id="province-select" value={province} onChange={(e) => edit(setProvince)(e.target.value)} className="t15-input min-h-[52px]" aria-describedby="province-hint">
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
              <label className="t15-label" htmlFor="ratio-range">{tr("Điện dùng vào ban ngày", "Daytime usage")}: <strong className="text-lg text-primary">{ratio}%</strong></label>
              <input id="ratio-range" type="range" min={10} max={100} step={5} value={ratio} onChange={(e) => edit(setRatio)(Number(e.target.value))} className="mt-2 h-8 w-full accent-primary" />
              <div className="flex justify-between text-xs font-bold text-fg-subtle"><span>{tr("Chủ yếu buổi tối", "Mostly evening")}</span><span>{tr("Cả ngày", "All day")}</span></div>
              {ratio !== defaultDaytimeRatio(segment) && <button type="button" className="mt-2 min-h-11 text-xs font-bold text-primary underline" onClick={() => setRatio(defaultDaytimeRatio(segment))}>Dùng mức gợi ý cho {SEGMENTS[segment].label.toLowerCase()}: {defaultDaytimeRatio(segment)}%</button>}
            </div>

            <ul className="mt-auto grid gap-2 rounded-3xl bg-bg-tint p-4 text-sm font-semibold text-fg sm:grid-cols-3 sm:p-5">
              {TIPS.map(([Icon, vi, en]) => (
                <li key={vi} className="flex items-center gap-2.5 sm:flex-col sm:items-start"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg-elevated text-primary shadow-sm"><Icon className="h-5 w-5" /></span>{tr(vi, en)}</li>
              ))}
            </ul>
          </div>

          {/* ===== Kết quả + form báo giá chi tiết ===== */}
          <div data-reveal="right" style={delay(0.2)} className="t15-invert t15-card relative scroll-mt-24 overflow-hidden !border-primary/20 bg-bg-tint p-5 sm:p-8">
            <div aria-hidden className="t15-energy-line absolute inset-x-0 top-0 h-1.5" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-black">{tr("Kết quả sơ bộ", "Preliminary result")}</h3><span className="rounded-full bg-glass px-3 py-1 text-xs font-bold text-fg-muted">{tr(SEGMENTS[segment].short, SEGMENTS[segment].en.short)} • {province}</span></div>
              {topic && (
                <p className="mt-3 flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-bold text-fg">
                  <TagIcon className="h-4 w-4 shrink-0 text-accent-ink" /><span className="flex-1">{tr("Đang hỏi giá", "Asking about")}: {topic}</span>
                  <button type="button" onClick={() => setTopic("")} aria-label={tr("Bỏ nhu cầu đã chọn", "Clear selected need")} className="grid h-8 w-8 place-items-center rounded-full hover:bg-glass-tint/10"><XMarkIcon className="h-4 w-4" /></button>
                </p>
              )}
              <div aria-live="polite" className="mt-5 grid grid-cols-2 gap-3">
                {([
                  [tr("Công suất", "System size"), <><CountUp value={result.kwp} format={(v) => formatNumber(v, 1)} /> <span className="text-base">kWp</span></>],
                  [tr("Số tấm pin", "Panels"), <><CountUp value={result.panels} format={(v) => formatNumber(v)} /> <span className="text-base">{tr("tấm", "pcs")}</span></>],
                  [tr("Tiết kiệm", "Savings"), <>~<CountUp value={result.monthlySavings} format={formatMoneyShort} /><span className="text-base">/{tr("tháng", "mo")}</span></>],
                  [tr("Hoàn vốn", "Payback"), Number.isFinite(result.paybackYears) ? <>~<CountUp value={result.paybackYears} format={(v) => formatNumber(v, 1)} /> <span className="text-base">{tr("năm", "yrs")}</span></> : "—"],
                ] as const).map(([label, value]) => (
                  <div key={label} className="t15-glass-dark rounded-2xl p-4 sm:p-5">
                    <div className="text-2xs font-bold uppercase tracking-[.14em] text-fg-muted">{label}</div>
                    <div className="mt-2 text-xl font-black leading-tight tabular-nums text-accent-ink sm:text-2xl xl:text-display-xs">{value}</div>
                  </div>
                ))}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-fg-muted">{tr("Chi phí ước tính", "Estimated cost")}</dt><dd className="text-right font-black">{formatMoneyShort(result.cost)}</dd>
                <dt className="text-fg-muted">{tr("Sản lượng/tháng", "Output / month")}</dt><dd className="text-right font-black">{formatNumber(result.monthlyProduction)} kWh</dd>
              </dl>
              {result.limitedByRoof && (
                <p className="mt-4 flex gap-2 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-sm"><ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-accent-ink" />Mái chỉ đủ cho {formatNumber(result.kwpRoofMax, 1)} kWp (nhu cầu ~{formatNumber(result.kwpNeeded, 1)} kWp). Có thể tận dụng thêm mái phụ, nhà xe.</p>
              )}
              <p className="mt-4 text-xs text-fg-muted"><strong className="text-fg">{tr("Kết quả ước tính", "Estimate only")}</strong> {tr("theo biểu giá và giờ nắng trung bình — chi phí thực tế xác định sau khảo sát.", "based on average tariffs and sun hours — final cost after site survey.")}</p>

              <div className="mt-6 border-t border-line/15 pt-6">
                <h3 className="text-lg font-black">{tr("Nhận báo giá chi tiết", "Get a detailed quote")}</h3>
                <p className="mb-4 mt-1 text-sm text-fg-muted">{tr("Gửi kèm toàn bộ thông số trên — kỹ sư gọi lại tư vấn miễn phí.", "All figures above are attached — an engineer will call you back for free.")}</p>
                <LeadForm source={leadSource} getExtra={() => ({ segment: SEGMENTS[segment].label, estimate })} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
