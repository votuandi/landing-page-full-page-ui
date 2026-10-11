"use client";
import { useEffect, useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MediaImage, useCountUp, useInViewOnce } from "@solar/ui";
import { ArrowRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { SEGMENT_ORDER, formatMoneyShort, type Segment } from "@solar/core";
import type { ProjectItem } from "../collections/schemas";
import type { Locale } from "../site";
import { CalculatorLink } from "../render/CalculatorLink";
import { storyQuoteLink } from "../shared/storyQuote";
import type { StoryView } from "../shared/storyView";
import { useSegment } from "../state/SiteState";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
type ProjectView = Omit<ProjectItem, "image" | "industry" | "description"> & {
  imageSrc?: string; imageAlt: string; industry?: string; description?: string;
};

function Metric({ value, label, unit, locale, decimals = 0 }: { value: number; label: string; unit: string; locale: Locale; decimals?: number }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.25);
  const [animate, setAnimate] = useState(false);
  useLayoutEffect(() => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAnimate(true); }, []);
  const counted = useCountUp(value, { start: animate && seen });
  const formatted = new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN", { maximumFractionDigits: decimals }).format(animate ? counted : value);
  return <div ref={ref} className="t15-glass-dark flex flex-col-reverse rounded-card p-4">
    <dt className="mt-1 text-xs font-semibold text-fg-muted">{label} · {unit}</dt>
    <dd className="text-2xl font-black tabular-nums text-accent-ink sm:text-3xl">{formatted}</dd>
  </div>;
}

export default function FeaturedProjects({ items, labels, showFilter, allLabel, savingLabel, ctaLabel, locale, sectionId }: {
  items: ProjectView[]; labels: Record<Segment, string>; showFilter: boolean; allLabel: string; savingLabel: string; ctaLabel: string; locale: Locale; sectionId: string;
}) {
  const { segment, setSegment } = useSegment();
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState<StoryView | null>(null);
  const list = items.filter((item) => !showFilter || !segment || item.segment === segment);
  const first = list[0]?.id;
  const selected = list.find((item) => item.id === active)?.id ?? first;
  // All panels are available without JavaScript; hydration selects the first tab.
  useEffect(() => { if (first) setActive(first); }, [first]);
  const tr = (vi: string, en: string) => locale === "en" ? en : vi;

  return <>
    {showFilter && <div role="group" aria-label={tr("Lọc công trình theo phân khúc", "Filter projects by segment")} className="mt-5 flex flex-wrap gap-2">
      <button type="button" aria-pressed={!segment} onClick={() => setSegment(null)} className="t15-chip">{allLabel}</button>
      {SEGMENT_ORDER.map((s) => <button key={s} type="button" aria-pressed={segment === s} onClick={() => setSegment(s)} className="t15-chip">{labels[s]}</button>)}
    </div>}
    {list.length > 0 ? <>
      <div role="tablist" aria-label={tr("Chọn khách hàng", "Choose a client")} className="t15-no-scrollbar -mx-4 mt-8 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {list.map((item, i) => <button key={item.id} type="button" role="tab" id={`${sectionId}-tab-${item.id}`} aria-controls={`${sectionId}-panel-${item.id}`}
          aria-selected={selected === item.id} tabIndex={selected === item.id ? 0 : -1} onClick={() => setActive(item.id)}
          onKeyDown={(event) => {
            if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + list.length) % list.length;
            setActive(list[next].id);
            document.getElementById(`${sectionId}-tab-${list[next].id}`)?.focus();
          }}
          className={`flex min-h-16 shrink-0 items-center gap-3 rounded-card border px-4 py-2.5 text-left transition ${selected === item.id ? "border-accent bg-accent/15" : "border-line/15 bg-glass hover:bg-glass-tint/10"}`}>
          <span aria-hidden className={`grid h-11 w-11 place-items-center rounded-card text-sm font-black ${selected === item.id ? "bg-accent text-on-accent" : "bg-glass-strong text-fg"}`}>{item.logoText ?? item.title.slice(0, 2)}</span>
          <span><span className="block max-w-[180px] truncate text-sm font-black">{item.title}</span><span className="block text-xs text-fg-muted">{item.industry ?? labels[item.segment]}</span></span>
        </button>)}
      </div>
      {list.map((item) => {
        const link = storyQuoteLink(item, locale, ctaLabel);
        const hiddenPanel = active !== null && selected !== item.id;
        const annual = item.savingPerYear;
        const moneyScale = annual !== undefined && annual >= 1e9 ? 1e9 : 1e6;
        const moneyUnit = moneyScale === 1e9 ? tr("tỷ VNĐ/năm", "bn VND/yr") : tr("triệu VNĐ/năm", "M VND/yr");
        const media = <>
          <MediaImage src={item.imageSrc} alt={item.imageAlt} sizes="(max-width:1024px) 100vw, 55vw" className="transition duration-motion-slow motion-safe:group-hover:scale-[1.04]" />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-scrim/80 to-transparent" />
          <span className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-pill bg-scrim/60 px-3 py-1.5 text-xs font-bold text-on-media backdrop-blur"><MapPinIcon aria-hidden className="h-4 w-4" />{item.location}</span>
        </>;
        const mediaClass = "group relative min-h-[280px] overflow-hidden rounded-media border border-glass-border sm:min-h-[400px]";
        return <div key={item.id} role="tabpanel" id={`${sectionId}-panel-${item.id}`} aria-labelledby={`${sectionId}-tab-${item.id}`} tabIndex={0}
          hidden={hiddenPanel} className={`mt-6 gap-6 lg:grid-cols-[1.1fr_1fr] ${hiddenPanel ? "hidden" : "grid"}`}>
          {item.video ? <button type="button" aria-label={`${tr("Xem video dự án", "Watch project video")}: ${item.title}`} className={mediaClass}
            onClick={() => setPlaying({ id: item.id, title: item.title, segment: item.segment, location: item.location, kwp: item.kwp, poster: item.imageSrc, source: item.video!, kindLabel: labels[item.segment] })}>
            {media}<span className="absolute left-1/2 top-1/2 grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-accent text-on-accent shadow-2xl transition motion-safe:group-hover:scale-110"><PlayIcon aria-hidden className="ml-1 h-8 w-8" /></span>
          </button> : <div className={mediaClass}>{media}</div>}
          <div className="flex flex-col">
            <div className="text-xs font-black uppercase tracking-[.16em] text-accent-ink">{item.industry ?? labels[item.segment]}</div>
            <h3 className="mt-2 text-3xl font-black tracking-[-.03em]">{item.href ? <a href={item.href}>{item.title}</a> : item.title}</h3>
            {item.description && <p className="mt-4 leading-7 text-fg-muted">{item.description}</p>}
            <dl aria-live="polite" className="mt-6 grid grid-cols-2 gap-3">
              <Metric value={item.kwp} label={tr("Công suất", "Capacity")} unit="kWp" locale={locale} decimals={2} />
              {item.kwhPerYear !== undefined && <Metric value={item.kwhPerYear} label={tr("Sản lượng", "Output")} unit={tr("kWh/năm", "kWh/yr")} locale={locale} />}
              {annual !== undefined ? <Metric value={annual / moneyScale} label={tr("Tiết kiệm", "Savings")} unit={moneyUnit} locale={locale} decimals={moneyScale === 1e9 ? 2 : 0} />
                : item.savingPerMonth !== undefined && <div className="t15-glass-dark rounded-card p-4"><dt className="text-xs text-fg-muted">{savingLabel}</dt><dd className="text-2xl font-black text-accent-ink">{formatMoneyShort(item.savingPerMonth)}</dd></div>}
              {item.co2PerYear !== undefined && <Metric value={item.co2PerYear} label={tr("Giảm CO₂", "CO₂ avoided")} unit={tr("tấn/năm", "t/yr")} locale={locale} decimals={2} />}
            </dl>
            <CalculatorLink href={link.href} prefill={link.calculator!} className="t15-button t15-button-primary mt-6 self-start">{ctaLabel}<ArrowRightIcon aria-hidden className="h-4 w-4" /></CalculatorLink>
          </div>
        </div>;
      })}
    </> : <p role="status" className="py-8 text-center text-fg-muted">{tr("Chưa có công trình cho phân khúc này.", "No projects for this segment yet.")}</p>}
    {playing && <StoryPlayer stories={[playing]} startIndex={0} locale={locale} ctaLabel={ctaLabel} onClose={() => setPlaying(null)} />}
  </>;
}
