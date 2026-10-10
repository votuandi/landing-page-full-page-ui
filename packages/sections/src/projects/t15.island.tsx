"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MediaImage } from "@solar/ui";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { SEGMENT_ORDER, segmentFromParam, formatMoneyShort, formatNumber, type Segment } from "@solar/core";
import type { ProjectItem } from "../collections/schemas";
import type { Locale } from "../site";
import { CalculatorLink } from "../render/CalculatorLink";
import { storyQuoteLink } from "../shared/storyQuote";
import type { StoryView } from "../shared/storyView";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
type ProjectView = Omit<ProjectItem, "image"> & { imageSrc?: string; imageAlt: string };
export default function Projects({ items, labels, showFilter, savingLabel, allLabel, ctaLabel, locale }: {
  items: ProjectView[]; labels: Record<Segment, string>; showFilter: boolean; savingLabel: string; allLabel: string; ctaLabel: string; locale: Locale;
}) {
  const [segment, setSegment] = useState<Segment | null>(null);
  const [playing, setPlaying] = useState<{ stories: StoryView[]; index: number } | null>(null);
  useEffect(() => { setSegment(segmentFromParam(new URLSearchParams(window.location.search).get("phan-khuc"))); }, []);
  const list = items.filter((item) => !segment || item.segment === segment);
  const stories: StoryView[] = list.flatMap((item) => item.video ? [{ id: item.id, title: item.title, location: item.location, kwp: item.kwp, segment: item.segment, poster: item.imageSrc, source: item.video, kindLabel: labels[item.segment] }] : []);
  return <>
    {showFilter && <div className="t15-no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:justify-end" role="group" aria-label={locale === "en" ? "Filter projects by segment" : "Lọc công trình theo phân khúc"}>
      <button type="button" aria-pressed={!segment} onClick={() => setSegment(null)} className="t15-chip shrink-0">{allLabel}</button>
      {SEGMENT_ORDER.map((s) => <button key={s} type="button" aria-pressed={segment === s} onClick={() => setSegment(s)} className="t15-chip shrink-0">{labels[s]}</button>)}
    </div>}
    <div data-reveal-stagger="up" data-reveal-step="0.08" className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {!list.length && <p role="status" className="col-span-full py-8 text-center text-fg-muted">{locale === "en" ? "No projects for this segment yet." : "Chưa có công trình cho phân khúc này."}</p>}
      {list.map((item) => { const link = storyQuoteLink(item, locale, ctaLabel); return <article key={item.id} className="t15-card t15-card-hover group relative flex flex-col overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden bg-bg-tint"><MediaImage src={item.imageSrc} alt={item.imageAlt} sizes="(max-width:1024px) 50vw, 300px" className="transition duration-motion-slow motion-safe:group-hover:scale-[1.05]" /><span className="absolute left-2 top-2 rounded-full bg-bg-elevated/95 px-2.5 py-1 text-2xs font-black text-primary shadow sm:left-3 sm:top-3 sm:text-xs">{formatNumber(item.kwp)} kWp</span>
          {item.video && <button type="button" onClick={() => setPlaying({ stories, index: stories.findIndex((s) => s.id === item.id) })} aria-label={`${locale === "en" ? "Watch project video" : "Xem video công trình"}: ${item.title}`} className="absolute bottom-2 right-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-accent text-on-accent shadow-xl ring-4 ring-on-media/40 transition motion-safe:hover:scale-110 sm:bottom-3 sm:right-3 sm:h-12 sm:w-12"><PlayIcon aria-hidden className="ml-0.5 h-5 w-5" /></button>}
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-5"><div className="text-xs font-bold uppercase tracking-[.14em] text-secondary">{labels[item.segment]}</div><h3 className="mt-1.5 text-sm font-black leading-snug text-fg sm:text-lg">{item.href ? <a href={item.href}>{item.title}</a> : item.title}</h3><div className="mt-1 flex items-center gap-1 text-xs text-fg-muted sm:text-sm"><MapPinIcon aria-hidden className="h-4 w-4 shrink-0" />{item.location}</div>
          {item.savingPerMonth !== undefined && <div className="mt-auto pt-4"><div className="text-2xs font-bold uppercase tracking-[.12em] text-fg-subtle">{savingLabel}</div><div className="text-base font-black text-primary sm:text-lg">~{formatMoneyShort(item.savingPerMonth)}</div></div>}
          <CalculatorLink href={link.href} prefill={link.calculator!} className="t15-button t15-button-secondary relative mt-4 w-full justify-center px-3 text-center text-xs leading-snug text-balance">{ctaLabel}</CalculatorLink>
        </div>
      </article>; })}
    </div>
    {playing && <StoryPlayer stories={playing.stories} startIndex={playing.index} locale={locale} ctaLabel={ctaLabel} onClose={() => setPlaying(null)} />}
  </>;
}
