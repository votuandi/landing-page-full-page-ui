"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MediaImage, CarouselNav, useSnapCarousel } from "@solar/ui";
import { PlayIcon } from "@heroicons/react/24/solid";
import { CheckIcon } from "@heroicons/react/24/outline";
import type { StoryView } from "../shared/storyView";
import type { ClientLink } from "../shared/links";
import { Anchor } from "../shared/Anchor";
import type { Locale } from "../site";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
export default function Services({ items, stories, sectionId, locale }: {
  items: { id: string; title: string; src?: string; alt: string; points: string[]; link?: ClientLink }[];
  stories: StoryView[]; sectionId: string; locale: Locale;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const first = items[0].id;
  useEffect(() => setActive(first), [first]);
  const c = useSnapCarousel();
  return <>
    <div role="tablist" aria-label={locale === "en" ? "Solutions" : "Giải pháp"} className="t15-no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {items.map((item, i) => <button key={item.id} type="button" role="tab" id={sectionId + "-tab-" + item.id} aria-controls={sectionId + "-panel-" + item.id}
        aria-selected={(active ?? first) === item.id} tabIndex={(active ?? first) === item.id ? 0 : -1} onClick={() => setActive(item.id)}
        onKeyDown={(event) => {
          if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const index = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
            setActive(items[index].id); document.getElementById(sectionId + "-tab-" + items[index].id)?.focus();
          }
        }} className="t15-chip shrink-0">{item.title}</button>)}
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
      <div>{items.map((item) => <div key={item.id} id={sectionId + "-panel-" + item.id} role="tabpanel" aria-labelledby={sectionId + "-tab-" + item.id} hidden={active !== null && active !== item.id}
        className="relative mb-4 min-h-[340px] overflow-hidden rounded-media border-4 border-glass-tint/15 shadow-feature">
        <MediaImage src={item.src} alt={item.alt} sizes="(max-width:1024px) 100vw, 45vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/20 to-transparent" />
        <div className="relative m-4 mt-32 rounded-card border border-on-media/20 bg-on-media/10 p-5 text-on-media backdrop-blur-xl">
          <h3 className="text-xl font-black">{item.title}</h3><ul className="mt-3 grid gap-2 text-sm">{item.points.map((point, i) => <li key={i} className="flex gap-2"><CheckIcon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />{point}</li>)}</ul>
          {item.link && <Anchor link={item.link} className="t15-button t15-button-primary mt-4 w-full sm:w-auto" />}
        </div>
      </div>)}</div>
      {stories.length > 0 && <div className="t15-card flex min-w-0 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4"><h3 className="text-lg font-black text-fg">{locale === "en" ? "On-site project videos" : "Video công trình thực tế"}</h3><CarouselNav prevLabel={locale === "en" ? "Previous" : "Trước"} nextLabel={locale === "en" ? "Next" : "Tiếp"} prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} /></div>
        <div ref={c.ref} className="t15-no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto">
          {stories.map((story, i) => <button key={story.id} type="button" onClick={() => setPlaying(i)} aria-label={(locale === "en" ? "Play video: " : "Phát video: ") + story.title}
            className="group relative aspect-video w-full shrink-0 snap-start overflow-hidden rounded-card border border-glass-border text-left">
            <MediaImage src={story.poster} alt="" sizes="(max-width:1024px) 90vw, 50vw" /><span className="absolute inset-0 bg-gradient-to-t from-scrim/85 to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-accent text-on-accent shadow-xl"><PlayIcon aria-hidden className="h-7 w-7" /></span>
            <span className="absolute inset-x-4 bottom-4 text-on-media"><span className="block text-lg font-black leading-snug">{story.title}</span><span className="mt-1 block text-xs">{story.location}</span></span>
          </button>)}
        </div>
      </div>}
    </div>
    {playing !== null && <StoryPlayer stories={stories} startIndex={playing} locale={locale} quote={false} onClose={() => setPlaying(null)} />}
  </>;
}
