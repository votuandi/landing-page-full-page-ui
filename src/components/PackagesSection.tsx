"use client";

import Image from "next/image";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { SEGMENTS, SEGMENT_ORDER, type Segment } from "@/config/segments";
import { PACKAGE_REFERENCE_PROVINCE, packagesFor } from "@/data/packages";
import { estimateSavingForKwp } from "@/lib/solarCalculator";
import { formatMoneyShort, formatNumber } from "@/lib/format";
import { PACKAGES_ID, openCalculator } from "@/lib/calculatorBus";
import { useSegment } from "@/lib/segment";
import { useLang } from "@/i18n/LangProvider";
import PriceTag from "@/components/PriceTag";
import SegmentIcon from "@/components/SegmentIcon";

const COVERS: Record<Segment, { src: string; pitch: [string, string] }> = {
  household: { src: "/images/illustrations/home-solar-tall.webp", pitch: ["Cắt phần điện bậc 5–6 đắt nhất, có điện buổi tối với pin lưu trữ.", "Cut the priciest tariff tiers; keep the lights on at night with storage."] },
  shop: { src: "/images/illustrations/shop-solar-tall.webp", pitch: ["Giờ mở cửa trùng giờ nắng — điều hòa, tủ mát chạy bằng nắng.", "Opening hours match sun hours — AC and fridges run on sunshine."] },
  factory: { src: "/images/illustrations/factory-solar-tall.webp", pitch: ["Dây chuyền, quạt hút, tải lạnh chạy ban ngày — mái xưởng thành nhà máy điện riêng.", "Daytime lines and cooling loads — your roof becomes a power plant."] },
  farm: { src: "/images/illustrations/farm-hybrid-solar.webp", pitch: ["Quạt hút, bơm, làm mát chạy suốt ngày; pin lưu trữ giữ tải khi cúp điện.", "Fans, pumps and cooling all day; storage keeps them running in outages."] },
};

/** Gói giải pháp theo phân khúc đang chọn (state chung, mặc định Hộ gia đình). "Nhận tư vấn" điền sẵn phân khúc vào dự toán. */
export default function PackagesSection() {
  const { tr } = useLang();
  const { segment, setSegment } = useSegment();
  const current = segment ?? "household";
  const list = packagesFor(current);
  const cover = COVERS[current];

  return (
    <section id={PACKAGES_ID} className="t15-section relative overflow-hidden bg-bg" aria-labelledby="goi-title">
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-leaf)/.16),transparent_65%)]" />
      <div className="t15-container relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal="down" className="max-w-3xl">
            <span className="t15-eyebrow"><SparklesIcon className="h-4 w-4" />{tr("Gói giải pháp", "Solution packages")}</span>
            <h2 id="goi-title" className="t15-heading">{tr("Chọn gói theo công trình, biết ngay tiền điện giảm bao nhiêu.", "Pick a package and see your monthly savings instantly.")}</h2>
          </div>
          <div data-reveal="up" className="lg:max-w-[46%] t15-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:justify-end" role="group" aria-label={tr("Phân khúc gói giải pháp", "Package segment")}>
            {SEGMENT_ORDER.map((s) => (
              <button key={s} type="button" aria-pressed={current === s} onClick={() => setSegment(s)} className="t15-chip shrink-0"><SegmentIcon segment={s} className="h-4 w-4" />{tr(SEGMENTS[s].short, SEGMENTS[s].en.short)}</button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[.8fr_2.2fr]">
          <div data-reveal="left" className="relative hidden min-h-[440px] overflow-hidden rounded-[32px] border-4 border-bg-elevated shadow-[0_30px_60px_-35px_rgb(var(--c-shadow)/.5)] lg:block">
            <Image key={cover.src} src={cover.src} alt="" fill className="object-cover" sizes="25vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-scrim/10 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-on-media/25 bg-on-media/15 p-5 text-on-media backdrop-blur-xl">
              <div className="flex items-center gap-2 text-lg font-black"><SegmentIcon segment={current} className="h-5 w-5" />{tr(SEGMENTS[current].label, SEGMENTS[current].en.label)}</div>
              <p className="mt-2 text-sm leading-6 text-on-media/90">{tr(cover.pitch[0], cover.pitch[1])}</p>
            </div>
          </div>

          <div data-reveal-stagger="up" data-reveal-step="0.1" className="grid gap-4 sm:grid-cols-2" aria-live="polite">
            {list.map((pkg) => {
              const saving = estimateSavingForKwp(pkg.segment, pkg.kwp, PACKAGE_REFERENCE_PROVINCE);
              return (
                <article key={pkg.id} className={`t15-card t15-card-hover relative flex flex-col overflow-hidden p-6 ${pkg.popular ? "!border-primary/50 ring-4 ring-primary/10" : ""}`}>
                  <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${pkg.popular ? "bg-accent" : "bg-primary/20"}`} />
                  {pkg.popular && <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-[11px] font-black text-on-accent">{tr("Chọn nhiều", "Popular")}</span>}
                  <h3 className="text-sm font-bold text-fg-muted">{pkg.name}</h3>
                  <div className="mt-1 text-3xl font-black tracking-tight text-fg">{formatNumber(pkg.kwp, 1)}<span className="ml-1 text-base text-fg-subtle">kWp</span></div>
                  <div className="mt-4 rounded-2xl bg-bg-tint p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[.14em] text-fg-muted">{tr("Giảm tiền điện", "Bill savings")}</div>
                    <div className="text-xl font-black text-primary">~{formatMoneyShort(saving)}<span className="text-sm font-bold text-fg-muted">/{tr("tháng", "month")}</span></div>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-fg-muted">
                    <li className="font-semibold text-fg">{pkg.suitableFor}</li>
                    {pkg.highlights.map((h) => <li key={h} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />{h}</li>)}
                  </ul>
                  <div className="mt-auto pt-5">
                    <PriceTag price={pkg.price} salePrice={pkg.salePrice} short className="text-2xl" />
                    <button type="button" onClick={() => openCalculator({ segment: pkg.segment, topic: `${pkg.name} (${formatNumber(pkg.kwp, 1)} kWp)` })} className="t15-button t15-button-primary mt-4 w-full">
                      {tr("Nhận tư vấn gói này", "Get advice on this package")} <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <p className="mt-5 text-xs text-fg-subtle">{tr(`* Tiết kiệm ước tính tại ${PACKAGE_REFERENCE_PROVINCE}, giá trọn gói gồm thiết bị và thi công; báo giá chính thức sau khảo sát.`, `* Savings estimated for ${PACKAGE_REFERENCE_PROVINCE}; turnkey prices include equipment and installation. Final quote after survey.`)}</p>
      </div>
    </section>
  );
}
