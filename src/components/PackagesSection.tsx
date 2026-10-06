"use client";

import { ArrowRightIcon, CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { SEGMENTS, SEGMENT_ORDER } from "@/config/segments";
import { PACKAGE_REFERENCE_PROVINCE, packagesFor } from "@/data/packages";
import { estimateSavingForKwp } from "@/lib/solarCalculator";
import { formatMoneyShort, formatNumber } from "@/lib/format";
import { SECTION_IDS, useSegment } from "@/lib/segment";
import PriceTag from "@/components/PriceTag";
import SegmentIcon from "@/components/SegmentIcon";

/** Gói giải pháp theo phân khúc đang chọn (mặc định Hộ gia đình). "Nhận tư vấn" điền sẵn phân khúc vào calculator. */
export default function PackagesSection() {
  const { segment, setSegment, focusSegment } = useSegment();
  const current = segment ?? "household";
  const list = packagesFor(current);

  return (
    <section id={SECTION_IDS.packages} className="t5-section relative overflow-hidden bg-bg-elevated" aria-labelledby="goi-title">
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-sun)/.18),transparent_65%)]" />
      <div className="t5-container relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal="down" className="max-w-3xl">
            <span className="t5-eyebrow"><SparklesIcon className="h-4 w-4" />Gói giải pháp</span>
            <h2 id="goi-title" className="t5-heading">Chọn gói theo công trình, biết ngay tiền điện giảm bao nhiêu.</h2>
          </div>
          <div className="t13-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Phân khúc gói giải pháp">
            {SEGMENT_ORDER.map((s) => (
              <button key={s} type="button" aria-pressed={current === s} onClick={() => setSegment(s)} className="t13-chip shrink-0"><SegmentIcon segment={s} className="h-4 w-4" />{SEGMENTS[s].short}</button>
            ))}
          </div>
        </div>

        <div data-reveal-stagger="up" data-reveal-step="0.1" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
          {list.map((pkg) => {
            const saving = estimateSavingForKwp(pkg.segment, pkg.kwp, PACKAGE_REFERENCE_PROVINCE);
            return (
              <article key={pkg.id} className={`t8-card relative flex flex-col p-6 transition hover:-translate-y-1.5 ${pkg.popular ? "!border-primary/50 ring-1 ring-primary/30" : ""}`}>
                {pkg.popular && <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[11px] font-black text-on-primary">Chọn nhiều</span>}
                <h3 className="text-sm font-bold text-fg-muted">{pkg.name}</h3>
                <div className="mt-1 text-3xl font-black tracking-tight text-fg">{formatNumber(pkg.kwp, 1)}<span className="ml-1 text-base text-fg-subtle">kWp</span></div>
                <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/10 p-3">
                  <div className="text-[11px] font-bold uppercase tracking-[.14em] text-fg-muted">Giảm tiền điện</div>
                  <div className="text-xl font-black text-accent">~{formatMoneyShort(saving)}<span className="text-sm font-bold text-fg-muted">/tháng</span></div>
                </div>
                <ul className="mt-4 grid gap-2 text-sm text-fg-muted">
                  <li className="font-semibold text-fg">{pkg.suitableFor}</li>
                  {pkg.highlights.map((h) => <li key={h} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />{h}</li>)}
                </ul>
                <div className="mt-auto pt-5">
                  <PriceTag price={pkg.price} salePrice={pkg.salePrice} short className="text-2xl" />
                  <button type="button" onClick={() => focusSegment(pkg.segment, SECTION_IDS.calculator)} className="t5-button t5-button-accent mt-4 w-full">
                    Nhận tư vấn <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-5 text-xs text-fg-subtle">* Tiết kiệm ước tính tại {PACKAGE_REFERENCE_PROVINCE}, giá trọn gói gồm thiết bị và thi công; báo giá chính thức sau khảo sát.</p>
      </div>
    </section>
  );
}
