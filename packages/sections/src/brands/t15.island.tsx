"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MediaImage } from "@solar/ui";
import { PlayIcon } from "@heroicons/react/24/solid";
import type { StorySource } from "../collections/schemas";
import type { Locale } from "../site";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
export default function SigningVideo({ title, caption, poster, source, locale }: { title: string; caption: string; poster?: string; source: StorySource; locale: Locale }) {
  const [playing, setPlaying] = useState(false);
  return <>
    <button type="button" onClick={() => setPlaying(true)} data-reveal="left" aria-label={`${locale === "en" ? "Watch video" : "Xem video"}: ${title}`} className="group relative min-h-[300px] overflow-hidden rounded-media border border-glass-border text-left shadow-feature sm:min-h-[380px]">
      <MediaImage src={poster} alt="" sizes="(max-width:1024px) 100vw, 52vw" className="transition duration-motion-slow motion-safe:group-hover:scale-[1.04]" /><span className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/30 to-transparent" /><span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-on-accent shadow-2xl transition motion-safe:group-hover:scale-110"><span aria-hidden className="absolute inset-0 rounded-full bg-accent t15-ping" /><PlayIcon aria-hidden className="relative ml-1 h-9 w-9" /></span><span className="absolute inset-x-0 bottom-0 p-6 text-on-media sm:p-8"><span className="rounded-full bg-accent/90 px-3 py-1 text-2xs font-black uppercase tracking-[.14em] text-on-accent">{locale === "en" ? "Signing ceremony" : "Lễ ký kết"}</span><span className="mt-3 block text-2xl font-black leading-tight sm:text-3xl">{title}</span><span className="mt-1 block text-sm text-on-media/80">{caption}</span></span>
    </button>
    {playing && <StoryPlayer stories={[{ id: "signing", title, location: caption, kwp: 0, segment: "factory", poster, source, kindLabel: locale === "en" ? "Signing ceremony" : "Lễ ký kết" }]} startIndex={0} locale={locale} quote={false} onClose={() => setPlaying(false)} />}
  </>;
}
