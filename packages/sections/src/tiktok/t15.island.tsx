"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MediaImage, CarouselNav, TikTokIcon, useSnapCarousel } from "@solar/ui";
import { PlayIcon } from "@heroicons/react/24/solid";
import type { StoryView } from "../shared/storyView";
import type { Locale } from "../site";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
export default function TikTok({ stories, locale }: { stories: StoryView[]; locale: Locale }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const c = useSnapCarousel();
  return <>
    <div className="mt-4 flex justify-end"><CarouselNav prevLabel={locale === "en" ? "Previous" : "Trước"} nextLabel={locale === "en" ? "Next" : "Tiếp"} prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} /></div>
    <div ref={c.ref} className="t15-no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0">
      {stories.map((story, i) => <button key={story.id} type="button" onClick={() => setOpenAt(i)} aria-label={(locale === "en" ? "Play video: " : "Phát video: ") + story.title + " — " + story.location}
        className="group relative aspect-[9/16] w-[calc((100%-0.75rem)/1.8)] shrink-0 snap-start overflow-hidden rounded-card border border-glass-border bg-bg text-left transition motion-safe:hover:-translate-y-1.5 sm:w-[calc((100%-3rem)/3.5)] lg:w-[calc((100%-5rem)/5.5)]">
        <MediaImage src={story.poster} alt="" sizes="(max-width:640px) 55vw, (max-width:1024px) 28vw, 220px" />
        <span className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-scrim/90 via-scrim/40 to-transparent" />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-pill bg-scrim/60 px-2.5 py-1 text-2xs font-bold text-on-media backdrop-blur"><TikTokIcon aria-hidden className="h-3.5 w-3.5" />TikTok</span>
        <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-accent text-on-accent shadow-xl"><PlayIcon aria-hidden className="ml-0.5 h-6 w-6" /></span>
        <span className="absolute inset-x-3 bottom-3 text-on-media"><span className="block truncate text-xs font-black text-accent">{story.location}</span><span className="mt-0.5 line-clamp-2 text-sm font-black leading-snug">{story.title}</span></span>
      </button>)}
    </div>
    {openAt !== null && <StoryPlayer stories={stories} startIndex={openAt} locale={locale} onClose={() => setOpenAt(null)} />}
  </>;
}
