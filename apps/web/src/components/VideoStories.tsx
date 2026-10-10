"use client";

import { FacebookIcon, TikTokIcon, YouTubeIcon } from "@solar/ui";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG } from "@/config/site";
import { SEGMENTS } from "@/config/segments";
import { SEGMENT_ORDER, SECTION_IDS } from "@solar/core";
import { STORIES, STORY_TYPE_LABELS, TOTAL_CHANNEL_VIDEOS, type Story } from "@/data/stories";
import { useSegment } from "@/lib/segment";
import { useStoryPlayer } from "@/lib/storyPlayer";
import { useLang } from "@/i18n/LangProvider";

const socials = SITE_CONFIG.socials;
const SOCIAL_BUTTONS = [
  socials.tiktok?.url && { key: "tiktok", label: "TikTok", href: socials.tiktok.url, Icon: TikTokIcon },
  socials.youtube?.url && { key: "youtube", label: "YouTube", href: socials.youtube.url, Icon: YouTubeIcon },
  socials.facebook?.url && { key: "facebook", label: "Facebook", href: socials.facebook.url, Icon: FacebookIcon },
].filter(Boolean) as { key: string; label: string; href: string; Icon: typeof TikTokIcon }[];
const HANDLE = socials.tiktok?.handle || socials.youtube?.handle;

function PlatformBadge({ story }: { story: Story }) {
  const p = story.source.provider;
  const Icon = p === "tiktok" ? TikTokIcon : p === "youtube" ? YouTubeIcon : VideoCameraIcon;
  const label = p === "tiktok" ? "TikTok" : p === "youtube" ? "YouTube" : "Video";
  return <span className="flex items-center gap-1 rounded-full bg-scrim/70 px-2.5 py-1 text-2xs font-bold text-on-media backdrop-blur"><Icon className="h-3.5 w-3.5" />{label}</span>;
}

/* Bề rộng thẻ: mobile ~1.8 thẻ, tablet ~3.5, desktop ~5.5 — thẻ cuối luôn bị cắt một phần để gợi ý vuốt */
const CARD_W = "w-[calc((100%-0.75rem*0.8)/1.8)] sm:w-[calc((100%-1rem*2.5)/3.5)] lg:w-[calc((100%-1rem*4.5)/5.5)]";
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Video Shorts công trình: lọc theo phân khúc chung, bấm thẻ mở trình phát trong trang (StoryPlayer). */
export default function VideoStories() {
  const { tr } = useLang();
  const { segment, setSegment } = useSegment();
  const player = useStoryPlayer();
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const list = STORIES.filter((s) => !segment || s.segment === segment);
  const total = list.length + 1; // + thẻ "Xem thêm"

  useEffect(() => { trackRef.current?.scrollTo({ left: 0 }); setActive(0); }, [segment]);

  const step = () => {
    const card = trackRef.current?.firstElementChild as HTMLElement | null;
    return card ? card.offsetWidth + parseFloat(getComputedStyle(trackRef.current!).columnGap || "12") : 1;
  };
  const onScroll = () => {
    const el = trackRef.current;
    if (el) setActive(Math.min(total - 1, Math.round(el.scrollLeft / step())));
  };
  const scrollByCards = (dir: 1 | -1) => {
    trackRef.current?.scrollBy({ left: dir * step() * 2, behavior: prefersReduced() ? "auto" : "smooth" });
  };

  return (
    <section id={SECTION_IDS.video} className="t15-section relative overflow-hidden bg-bg-sky" aria-labelledby="video-title">
      <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 opacity-70 [mask-image:linear-gradient(180deg,black,transparent_70%)]" />
      <div className="t15-container relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal="down">
            <span className="t15-eyebrow">{tr("Video công trình", "Project videos")}</span>
            <h2 id="video-title" className="t15-heading">{tr("Thi công & bàn giao thực tế — xem trước khi quyết định.", "Real installs & handovers — watch before you decide.")}</h2>
            {HANDLE && <p className="t15-subheading">{tr("Video ngắn từ kênh", "Short videos from")} <strong className="text-fg">@{HANDLE}</strong></p>}
          </div>
          {SOCIAL_BUTTONS.length > 0 && (
            <div data-reveal="up" className="flex flex-wrap gap-2">
              {SOCIAL_BUTTONS.map(({ key, label, href, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="t15-chip"><Icon className="h-4 w-4" />{label}</a>
              ))}
            </div>
          )}
        </div>

        <div className="t15-no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label={tr("Lọc video theo phân khúc", "Filter videos by segment")}>
          <button type="button" aria-pressed={!segment} onClick={() => setSegment(null)} className="t15-chip shrink-0">{tr("Tất cả", "All")}</button>
          {SEGMENT_ORDER.map((s) => (
            <button key={s} type="button" aria-pressed={segment === s} onClick={() => setSegment(s)} className="t15-chip shrink-0">{tr(SEGMENTS[s].short, SEGMENTS[s].en.short)}</button>
          ))}
        </div>

        <div className="relative mt-6">
          <div ref={trackRef} onScroll={onScroll} className="t15-no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0" aria-label={tr("Danh sách video công trình", "Project video list")}>
            {list.map((story) => (
              <button key={story.id} type="button" onClick={(e) => player.open(list, story.id, e.currentTarget)}
                className={`group relative aspect-[9/16] shrink-0 snap-start overflow-hidden rounded-card border-4 border-bg-elevated bg-bg-tint text-left shadow-video transition duration-500 motion-safe:hover:-translate-y-1.5 ${CARD_W}`}>
                <Image src={story.poster} alt="" fill loading="lazy" sizes="(max-width:640px) 55vw, (max-width:1024px) 28vw, 220px" className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.05]" />
                <span className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-scrim/95 via-scrim/60 to-transparent" />
                <span className="sr-only">{tr("Phát video", "Play video")}: </span>
                <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
                  <PlatformBadge story={story} />
                  <span className="rounded-full bg-accent px-2 py-1 text-4xs font-black text-on-accent">{STORY_TYPE_LABELS[story.type]}</span>
                </span>
                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-bg-elevated/95 text-primary shadow-xl ring-4 ring-on-media/30 transition motion-safe:group-hover:scale-110"><PlayIcon className="ml-0.5 h-6 w-6" /></span>
                <span className="absolute inset-x-3 bottom-3 text-on-media">
                  <span className="line-clamp-2 text-sm font-black leading-snug">{story.shortTitle}</span>
                  <span className="mt-1 block truncate text-xs text-on-media/90">📍 {story.location} · {story.kwp} kWp</span>
                </span>
              </button>
            ))}

            {/* Thẻ "Xem thêm" */}
            <div className={`relative flex aspect-[9/16] shrink-0 snap-start flex-col items-center justify-center gap-3 overflow-hidden rounded-card bg-primary p-4 text-center text-on-primary ${CARD_W}`}>
              <span className="grid h-16 w-16 place-items-center rounded-full border-4 border-accent bg-bg-elevated text-xl font-black text-primary">{SITE_CONFIG.brand.logoText}</span>
              <div className="text-sm font-black">{tr(`Hơn ${TOTAL_CHANNEL_VIDEOS} video công trình`, `${TOTAL_CHANNEL_VIDEOS}+ project videos`)}</div>
              {socials.tiktok?.url && <a href={socials.tiktok.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-accent px-3 text-xs font-black text-on-accent"><TikTokIcon className="h-4 w-4" />{tr("Theo dõi TikTok", "Follow on TikTok")}</a>}
              {socials.youtube?.url && <a href={socials.youtube.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-on-primary/40 px-3 text-xs font-black"><YouTubeIcon className="h-4 w-4" />{tr("Kênh YouTube", "YouTube channel")}</a>}
            </div>
          </div>

          <button type="button" onClick={() => scrollByCards(-1)} disabled={active === 0} aria-label={tr("Xem video trước", "Previous videos")} className="t15-glass absolute -left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-fg disabled:opacity-0 lg:grid"><ChevronLeftIcon className="h-6 w-6" /></button>
          <button type="button" onClick={() => scrollByCards(1)} aria-label={tr("Xem video tiếp theo", "Next videos")} className="t15-glass absolute -right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-fg lg:grid"><ChevronRightIcon className="h-6 w-6" /></button>
        </div>

        <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-1.5 bg-line/25"}`} />)}
        </div>
      </div>
    </section>
  );
}
