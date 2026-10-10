"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import { formatMoneyShort, formatNumber, type Segment } from "@solar/core";
import { MediaImage, PriceTag } from "@solar/ui";
import { SegmentIcon } from "../shared/SegmentIcon";
import { useSegment, useOpenCalculator } from "../state/SiteState";

export type PackageTabView = { segment: Segment; label: string; short: string; pitch: string; cover: { src?: string; alt: string } };
export type PackageView = {
  id: string; segment: Segment; name: string; topic: string; kwp: number; price?: number; salePrice?: number;
  suitableFor: string; highlights: string[]; popular: boolean; monthlySaving?: number;
};

/** Tab phân khúc + thẻ gói t15. Mở sẵn theo `?phan-khuc=` nếu có; "Nhận tư vấn" điền sẵn dự toán. */
export default function PackagesIsland({ head, tabs, items, defaultSegment, maxPerSegment, text }: {
  /** Tiêu đề render server, đặt cạnh nhóm tab. */
  head: ReactNode;
  tabs: PackageTabView[];
  items: PackageView[];
  defaultSegment: Segment;
  maxPerSegment: number;
  text: { cta: string; saving: string; popular: string; month: string; group: string };
}) {
  const { segment, setSegment } = useSegment();
  const openCalculator = useOpenCalculator();
  const current = segment && tabs.some((tab) => tab.segment === segment) ? segment : defaultSegment;

  const tab = tabs.find((t) => t.segment === current) ?? tabs[0];
  const list = items.filter((item) => item.segment === tab.segment).slice(0, maxPerSegment);

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        {head}
        {tabs.length > 1 && (
        <div data-reveal="up" role="group" aria-label={text.group}
          className="t15-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:max-w-[46%] lg:justify-end">
          {tabs.map((t) => (
            <button key={t.segment} type="button" aria-pressed={tab.segment === t.segment} onClick={() => setSegment(t.segment, "packages")} className="t15-chip shrink-0">
              <SegmentIcon segment={t.segment} className="h-4 w-4" />{t.short}
            </button>
          ))}
        </div>
        )}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[.8fr_2.2fr]">
        <div data-reveal="left" className="relative hidden min-h-[440px] overflow-hidden rounded-media border-4 border-bg-elevated shadow-package lg:block">
          {tab.cover.src
            ? <Image key={tab.cover.src} src={tab.cover.src} alt={tab.cover.alt} fill className="object-cover" sizes="25vw" />
            : <MediaImage alt={tab.cover.alt} sizes="25vw" />}
          <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-scrim/10 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-on-media/25 bg-on-media/15 p-5 text-on-media backdrop-blur-xl">
            <div className="flex items-center gap-2 text-lg font-black"><SegmentIcon segment={tab.segment} className="h-5 w-5" />{tab.label}</div>
            <p className="mt-2 text-sm leading-6 text-on-media/90">{tab.pitch}</p>
          </div>
        </div>

        <div data-reveal-stagger="up" data-reveal-step="0.1" className="grid gap-4 sm:grid-cols-2" aria-live="polite">
          {list.map((pkg) => (
            <article key={pkg.id} className={`t15-card t15-card-hover relative flex flex-col overflow-hidden p-6 ${pkg.popular ? "!border-primary/50 ring-4 ring-primary/10" : ""}`}>
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1.5 ${pkg.popular ? "bg-accent" : "bg-primary/20"}`} />
              {pkg.popular && <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-2xs font-black text-on-accent">{text.popular}</span>}
              <h3 className="text-sm font-bold text-fg-muted">{pkg.name}</h3>
              <div className="mt-1 text-3xl font-black tracking-tight text-fg">{formatNumber(pkg.kwp, 1)}<span className="ml-1 text-base text-fg-subtle">kWp</span></div>
              {pkg.monthlySaving !== undefined && (
                <div className="mt-4 rounded-2xl bg-bg-tint p-3">
                  <div className="text-2xs font-bold uppercase tracking-[.14em] text-fg-muted">{text.saving}</div>
                  <div className="text-xl font-black text-primary">~{formatMoneyShort(pkg.monthlySaving)}<span className="text-sm font-bold text-fg-muted">/{text.month}</span></div>
                </div>
              )}
              <ul className="mt-4 grid gap-2 text-sm text-fg-muted">
                <li className="font-semibold text-fg">{pkg.suitableFor}</li>
                {pkg.highlights.map((h) => <li key={h} className="flex gap-2"><CheckIcon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />{h}</li>)}
              </ul>
              <div className="mt-auto pt-5">
                <PriceTag price={pkg.price} salePrice={pkg.salePrice} short className="text-2xl" />
                <button type="button" onClick={() => openCalculator({ segment: pkg.segment, topic: pkg.topic })} className="t15-button t15-button-primary mt-4 w-full">
                  {text.cta} <ArrowRightIcon aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
