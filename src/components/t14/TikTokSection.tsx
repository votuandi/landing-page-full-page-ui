"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { PlayIcon } from "@heroicons/react/24/solid";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";
import type { Story } from "@/data/stories";
import { TikTokIcon } from "@/components/BrandIcons";
import { MediaImage } from "@/components/t14/Media";
import { CarouselNav, SectionHead } from "@/components/t14/ui";
import { useSnapCarousel } from "@/components/t14/useSnapCarousel";

// Trình phát (StoryPlayer của template-12: hỗ trợ TikTok / YouTube / mp4) chỉ tải khi mở video
const StoryPlayer = dynamic(() => import("@/components/StoryPlayer"), { ssr: false });

const { videos } = siteConfig.tiktok;
const STORIES: Story[] = videos.map((v) => ({ id: v.id, shortTitle: v.title, location: v.creator, kwp: 0, segment: v.segment, type: "done", poster: v.poster, source: v.source }));
const channel = siteConfig.socials.find((s) => s.id === "tiktok");

export default function TikTokSection() {
  const { tr } = useLang();
  const [openAt, setOpenAt] = useState<number | null>(null);
  const c = useSnapCarousel();
  const close = useCallback(() => setOpenAt(null), []);
  if (!videos.length) return null;

  return (
    <section id="tiktok" className="t5-section relative overflow-hidden bg-bg-elevated" aria-labelledby="tiktok-title">
      <div className="t5-container">
        <SectionHead id="tiktok-title" eyebrow="TikTok" title={tr("Thi công thực tế mỗi ngày.", "Real installs, every day.")}
          desc={channel ? `${tr("Theo dõi kênh", "Follow")} ${channel.handle}` : undefined}
          action={<div className="flex items-center gap-3">
            {channel && <a href={channel.url} target="_blank" rel="noopener noreferrer" className="t12-chip"><TikTokIcon className="h-4 w-4" />{tr("Theo dõi", "Follow")}</a>}
            <CarouselNav prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} className="hidden sm:flex" />
          </div>} />

        <div ref={c.ref} className="t12-no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0" aria-label={tr("Video TikTok", "TikTok videos")}>
          {videos.map((v, i) => (
            <button key={v.id} type="button" onClick={() => setOpenAt(i)} aria-label={`${tr("Phát video", "Play video")}: ${v.title} — ${v.creator}`}
              className="group relative aspect-[9/16] w-[calc((100%-0.75rem)/1.8)] shrink-0 snap-start overflow-hidden rounded-3xl border border-glass-border bg-bg text-left transition motion-safe:hover:-translate-y-1.5 sm:w-[calc((100%-3rem)/3.5)] lg:w-[calc((100%-5rem)/5.5)]">
              <MediaImage src={v.poster} alt="" sizes="(max-width:640px) 55vw, (max-width:1024px) 28vw, 220px" className="transition duration-700 motion-safe:group-hover:scale-[1.05]" />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-scrim/90 via-scrim/40 to-transparent" />
              <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-scrim/60 px-2.5 py-1 text-[11px] font-bold text-on-media backdrop-blur"><TikTokIcon className="h-3.5 w-3.5" />TikTok</span>
              <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-on-accent shadow-xl transition motion-safe:group-hover:scale-110"><PlayIcon className="ml-0.5 h-6 w-6" /></span>
              <span className="absolute inset-x-3 bottom-3 text-on-media">
                <span className="block truncate text-xs font-black text-accent-soft">{v.creator}</span>
                <span className="mt-0.5 line-clamp-2 text-sm font-black leading-snug">{v.title}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      {openAt !== null && <StoryPlayer stories={STORIES} startIndex={openAt} onClose={close} />}
    </section>
  );
}
