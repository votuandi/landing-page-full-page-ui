"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { CALCULATOR_ID, SEGMENT_ORDER, prefillToSearch, formatMoneyShort, formatNumber, type Segment } from "@solar/core";
import { MediaImage } from "@solar/ui";
import type { ProjectItem } from "../collections/schemas";
import type { Locale } from "../site";
import { CalculatorLink } from "../render/CalculatorLink";
import type { StoryView } from "../shared/storyView";
import { useSegment } from "../state/SiteState";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
type ProjectView = Omit<ProjectItem, "image"> & { imageSrc?: string; imageAlt: string };

/** ProjectsGallery: edge-to-edge three-column grid; shared segment state and no-JS CTA. */
export default function Projects({ titleId, eyebrow, title, items, labels, showFilter, savingLabel, allLabel, ctaLabel, locale }: {
  titleId: string; eyebrow: string; title: string; items: ProjectView[]; labels: Record<Segment, string>;
  showFilter: boolean; savingLabel: string; allLabel: string; ctaLabel: string; locale: Locale;
}) {
  const { segment, setSegment } = useSegment();
  const [playing, setPlaying] = useState<{ stories: StoryView[]; index: number } | null>(null);
  const list = items.filter((item) => !segment || item.segment === segment);
  const stories: StoryView[] = list.flatMap((item) => item.video ? [{ id: item.id, title: item.title, location: item.location, kwp: item.kwp, segment: item.segment, poster: item.imageSrc, source: item.video, kindLabel: labels[item.segment] }] : []);
  const prefill = segment ? { segment } : {};
  return <>
    <div className="t15-container py-14 md:py-16">
      <div data-reveal="down" className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><span className="t15-eyebrow">{eyebrow}</span><h2 id={titleId} className="mt-4 max-w-3xl text-4xl font-black tracking-[-.045em] sm:text-5xl">{title}</h2></div>
        {showFilter && <div role="group" aria-label={locale === "en" ? "Filter projects by segment" : "Lọc công trình theo phân khúc"} className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!segment} onClick={() => setSegment(null)} className="t15-chip">{allLabel}</button>
          {SEGMENT_ORDER.filter((s) => items.some((item) => item.segment === s)).map((s) => <button key={s} type="button" aria-pressed={segment === s} onClick={() => setSegment(s)} className="t15-chip">{labels[s]}</button>)}
        </div>}
      </div>
    </div>
    <div data-reveal-stagger="up" data-reveal-step="0.1" className="grid gap-px bg-line/12 sm:grid-cols-2 lg:grid-cols-3">
      {!list.length && <p role="status" className="col-span-full bg-bg-tint py-8 text-center text-fg-muted">{locale === "en" ? "No projects for this segment yet." : "Chưa có công trình cho phân khúc này."}</p>}
      {list.map((item) => <article key={item.id} className="group relative flex flex-col bg-bg-tint">
        <div className="relative aspect-[4/3] overflow-hidden">
          <MediaImage src={item.imageSrc} alt={item.imageAlt} sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 34vw" className="transition duration-motion-slow motion-safe:group-hover:scale-[1.05]" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-scrim/70 to-transparent" />
          <span className="absolute left-5 top-5 rounded-pill border border-on-media/20 bg-scrim/60 px-3 py-1.5 text-xs font-black text-on-media backdrop-blur-xl">{formatNumber(item.kwp)} kWp</span>
          <span className="absolute bottom-4 left-5 flex items-center gap-1 text-xs font-black uppercase tracking-widest text-on-media/90"><MapPinIcon aria-hidden className="h-4 w-4" />{labels[item.segment]} • {item.location}</span>
          {item.video && <button type="button" onClick={() => setPlaying({ stories, index: stories.findIndex((s) => s.id === item.id) })} aria-label={`${locale === "en" ? "Watch project video" : "Xem video công trình"}: ${item.title}`} className="absolute bottom-4 right-5 z-10 grid h-11 w-11 place-items-center rounded-pill bg-accent text-on-accent"><PlayIcon aria-hidden className="h-5 w-5" /></button>}
        </div>
        <div className="flex flex-1 items-center justify-between gap-4 p-6 transition group-hover:bg-glass-tint/6 sm:px-8">
          <div><h3 className="text-xl font-black">{item.href ? <a href={item.href} className="after:absolute after:inset-0">{item.title}</a> : item.title}</h3>
            {item.savingPerMonth !== undefined && <div className="mt-1 text-sm text-fg-muted">{savingLabel} <strong className="text-accent-ink">~{formatMoneyShort(item.savingPerMonth)}{locale === "en" ? "/month" : "/tháng"}</strong></div>}
          </div>
          {item.href && <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-pill bg-glass-strong text-fg transition motion-safe:group-hover:translate-x-1 group-hover:bg-accent group-hover:text-on-accent">→</span>}
        </div>
      </article>)}
    </div>
    <div className="t15-container pt-8 text-center"><CalculatorLink href={`/?${prefillToSearch(prefill)}#${CALCULATOR_ID}`} prefill={prefill} className="t15-button t15-button-accent">{ctaLabel}</CalculatorLink></div>
    {playing && <StoryPlayer stories={playing.stories} startIndex={playing.index} locale={locale} ctaLabel={ctaLabel} onClose={() => setPlaying(null)} />}
  </>;
}
