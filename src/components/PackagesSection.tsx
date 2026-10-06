"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRightIcon, CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { SEGMENTS, type Segment } from "@/config/solar";
import { PACKAGE_REFERENCE_PROVINCE, packagesFor } from "@/data/packages";
import { estimateSavingForKwp, formatMoneyShort, formatNumber } from "@/lib/solarCalculator";
import { resolvePrice } from "@/lib/price";
import { PACKAGES_ID, onOpenPackages, openCalculator } from "@/lib/calculatorBus";
import { delay } from "@/utils/reveal";
import SegmentTabs from "@/components/SegmentTabs";

const COVERS: Record<Segment, { src: string; alt: string; pitch: string }> = {
  household: { src: "/images/illustrations/home-solar-tall.webp", alt: "Minh họa nhà ở có pin mặt trời và pin lưu trữ", pitch: "Cắt phần điện bậc 5–6 đắt nhất, có điện buổi tối với pin lưu trữ." },
  shop: { src: "/images/illustrations/shop-solar-tall.webp", alt: "Minh họa cửa hàng có tấm pin mặt trời trên mái", pitch: "Giờ mở cửa trùng giờ nắng — điều hòa, tủ mát chạy bằng nắng thay giá điện kinh doanh." },
  factory: { src: "/images/illustrations/factory-solar-tall.webp", alt: "Minh họa nhà máy với hệ thống điện mặt trời áp mái", pitch: "Dây chuyền, quạt hút, tải lạnh chạy ban ngày — mái xưởng thành nhà máy điện riêng." },
};

const savingLabel = (value: number) => `~${formatMoneyShort(value)}`;

export default function PackagesSection() {
  const [segment, setSegment] = useState<Segment>("household");
  useEffect(() => onOpenPackages(setSegment), []);
  const list = packagesFor(segment);
  const cover = COVERS[segment];

  return (
    <section id={PACKAGES_ID} className="t5-section relative overflow-hidden bg-bg-elevated" aria-labelledby="goi-title">
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-primary)/.16),transparent_65%)]" />
      <div className="t5-container relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal="down" className="max-w-3xl">
            <span className="t5-eyebrow"><SparklesIcon className="h-4 w-4" />Gói giải pháp</span>
            <h2 id="goi-title" className="t5-heading">Chọn gói theo công trình, biết ngay tiền điện giảm bao nhiêu.</h2>
          </div>
          <div data-reveal="up" style={delay(0.1)}><SegmentTabs value={segment} onChange={setSegment} idPrefix="goi" label="Phân khúc gói giải pháp" /></div>
        </div>

        <div id="goi-panel" role="tabpanel" aria-labelledby={`goi-tab-${segment}`} className="mt-10 grid gap-5 lg:grid-cols-[.8fr_2.2fr]">
          <div data-reveal="left" className="relative hidden min-h-[420px] overflow-hidden rounded-[32px] border-[5px] border-glass-tint/15 shadow-[0_30px_60px_-35px_rgb(var(--c-shadow)/.55)] lg:block">
            <Image key={cover.src} src={cover.src} alt={cover.alt} fill className="object-cover" sizes="25vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/15 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-on-media/20 bg-on-media/10 p-5 text-on-media backdrop-blur-xl">
              <div className="text-lg font-black">{SEGMENTS[segment].label}</div>
              <p className="mt-2 text-sm leading-6 text-on-media/85">{cover.pitch}</p>
            </div>
          </div>

          <div data-reveal-stagger="up" data-reveal-step="0.1" className="grid gap-4 sm:grid-cols-2">
            {list.map((pkg) => {
              const { current, original } = resolvePrice(pkg.price, pkg.salePrice);
              const saving = estimateSavingForKwp(pkg.segment, pkg.kwp, PACKAGE_REFERENCE_PROVINCE);
              return (
                <article key={pkg.id} className={`t8-card relative flex flex-col p-6 transition hover:-translate-y-1.5 ${pkg.popular ? "border-primary/60" : ""}`}>
                  {pkg.popular && <span className="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-[11px] font-black text-on-primary">Phổ biến</span>}
                  <div className="text-sm font-bold text-fg-muted">{pkg.name}</div>
                  <div className="mt-1 text-3xl font-black tracking-tight text-fg">{formatNumber(pkg.kwp)}<span className="ml-1 text-base text-fg-subtle">kWp</span></div>
                  <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/10 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-[.14em] text-fg-muted">Giảm tiền điện</div>
                    <div className="text-xl font-black text-accent">{savingLabel(saving)}<span className="text-sm font-bold text-fg-muted">/tháng</span></div>
                  </div>
                  <ul className="mt-4 grid gap-2 text-sm text-fg-muted">
                    <li className="font-semibold text-fg">{pkg.suitableFor}</li>
                    {pkg.highlights.map((h) => <li key={h} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />{h}</li>)}
                  </ul>
                  <div className="mt-auto pt-5">
                    {current ? (
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-2xl font-black text-fg">{formatMoneyShort(current)}</span>
                        {original && <s className="text-sm text-fg-subtle">{formatMoneyShort(original)}</s>}
                      </div>
                    ) : <div className="text-2xl font-black text-primary">0 đồng đầu tư</div>}
                    <button type="button" onClick={() => openCalculator(pkg.segment)} className="t5-button t5-button-primary mt-4 w-full">
                      Dự toán cho công trình của tôi <ArrowRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <p className="mt-5 text-xs text-fg-subtle">* Tiền tiết kiệm ước tính tại {PACKAGE_REFERENCE_PROVINCE}, giá đã gồm thiết bị và thi công trọn gói; báo giá chính thức sau khảo sát.</p>
      </div>
    </section>
  );
}
