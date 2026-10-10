"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MediaImage, CarouselNav, useSnapCarousel } from "@solar/ui";
import { PlayIcon } from "@heroicons/react/24/solid";
import { SEGMENT_ORDER, segmentFromParam, type Segment } from "@solar/core";
import type { Locale } from "../site";
import type { StoryView } from "../shared/storyView";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
const CARD_W = "w-[calc((100%-0.75rem*0.8)/1.8)] sm:w-[calc((100%-1rem*2.5)/3.5)] lg:w-[calc((100%-1rem*4.5)/5.5)]";
export default function Shorts({ items, labels, locale, ctaLabel }: { items: StoryView[]; labels: Record<Segment, string>; locale: Locale; ctaLabel: string }) {
  const [segment, setSegment] = useState<Segment | null>(null);
  const [playing, setPlaying] = useState<{ stories: StoryView[]; index: number } | null>(null);
  const { ref, prev, next, atStart, atEnd } = useSnapCarousel();
  const tr = (vi: string, en: string) => locale === "en" ? en : vi;
  useEffect(() => { setSegment(segmentFromParam(new URLSearchParams(window.location.search).get("phan-khuc"))); }, []);
  const list = items.filter((item) => !segment || item.segment === segment);
  const select = (s: Segment | null) => { setSegment(s); ref.current?.scrollTo({ left: 0 }); };
  return <>
    <div className="t15-no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label={tr("Lọc video theo phân khúc", "Filter videos by segment")}>
      <button type="button" aria-pressed={!segment} onClick={() => select(null)} className="t15-chip shrink-0">{tr("Tất cả", "All")}</button>{SEGMENT_ORDER.map((s) => <button key={s} type="button" aria-pressed={segment === s} onClick={() => select(s)} className="t15-chip shrink-0">{labels[s]}</button>)}
    </div>
    <div ref={ref} className="t15-no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0" aria-label={tr("Danh sách video công trình", "Project video list")}>
      {!list.length && <p role="status" className="w-full py-8 text-center text-fg-muted">{tr("Chưa có video cho phân khúc này.", "No videos for this segment yet.")}</p>}
      {list.map((story, index) => <button key={story.id} type="button" onClick={() => setPlaying({ stories: list, index })} className={`group relative aspect-[9/16] shrink-0 snap-start overflow-hidden rounded-card border-4 border-bg-elevated bg-bg-tint text-left shadow-video transition duration-motion-slow motion-safe:hover:-translate-y-1.5 ${CARD_W}`}>
        <MediaImage src={story.poster} alt="" sizes="(max-width:640px) 55vw, (max-width:1024px) 28vw, 220px" className="transition duration-motion-slow motion-safe:group-hover:scale-[1.05]" /><span className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-scrim/95 via-scrim/60 to-transparent" /><span className="sr-only">{tr("Phát video", "Play video")}: </span><span className="absolute left-2.5 top-2.5 rounded-full bg-accent px-2 py-1 text-4xs font-black text-on-accent">{story.kindLabel}</span><span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated/95 text-primary shadow-xl ring-4 ring-on-media/30 transition motion-safe:group-hover:scale-110"><PlayIcon aria-hidden className="ml-0.5 h-6 w-6" /></span><span className="absolute inset-x-3 bottom-3 text-on-media"><span className="line-clamp-2 text-sm font-black leading-snug">{story.title}</span><span className="mt-1 block truncate text-xs text-on-media/90">📍 {story.location} · {story.kwp} kWp</span></span>
      </button>)}
    </div>
    <CarouselNav prevLabel={tr("Xem video trước", "Previous videos")} nextLabel={tr("Xem video tiếp theo", "Next videos")} prev={prev} next={next} atStart={atStart} atEnd={atEnd} className="mt-4 justify-center" />
    {playing && <StoryPlayer stories={playing.stories} startIndex={playing.index} locale={locale} ctaLabel={ctaLabel} onClose={() => setPlaying(null)} />}
  </>;
}
