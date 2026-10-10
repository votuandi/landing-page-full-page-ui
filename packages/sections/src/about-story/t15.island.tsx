"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MediaImage } from "@solar/ui";
import { PlayIcon } from "@heroicons/react/24/solid";
import type { StoryView } from "../shared/storyView";
import type { Locale } from "../site";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
export default function AboutVideo({ story, locale }: { story: StoryView; locale: Locale }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label={(locale === "en" ? "Watch video: " : "Xem video: ") + story.title} className="relative mt-6 block aspect-video w-full overflow-hidden rounded-media">
      <MediaImage src={story.poster} alt="" sizes="(max-width:1024px) 100vw, 40vw" />
      <span className="absolute inset-0 bg-scrim/20" />
      <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-accent text-on-accent shadow-xl"><PlayIcon aria-hidden className="h-6 w-6" /></span>
    </button>
    {open && <StoryPlayer stories={[story]} startIndex={0} locale={locale} quote={false} onClose={() => setOpen(false)} />}
  </>;
}
