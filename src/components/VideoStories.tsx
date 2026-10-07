"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG } from "@/config/site";
import { SEGMENTS, SEGMENT_ORDER, type Segment } from "@/config/solar";
import { STORIES, STORY_TYPE_LABELS, TOTAL_CHANNEL_VIDEOS, type Story } from "@/data/stories";
import { FacebookIcon, TikTokIcon, YouTubeIcon } from "@/components/BrandIcons";
import dynamic from "next/dynamic";

// Trình phát chỉ được tải khi người dùng mở video
const StoryPlayer = dynamic(() => import("@/components/StoryPlayer"), { ssr: false });

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
  return <span className="flex items-center gap-1 rounded-full bg-scrim/60 px-2.5 py-1 text-[11px] font-bold text-on-media backdrop-blur"><Icon className="h-3.5 w-3.5" />{label}</span>;
}

/* Kích thước thẻ: mobile ~1.8 thẻ, tablet ~3.5, desktop ~5.5 (thẻ cuối luôn bị cắt để gợi ý vuốt) */
const CARD_W = "w-[calc((100%-0.75rem*0.8)/1.8)] sm:w-[calc((100%-1rem*2.5)/3.5)] lg:w-[calc((100%-1rem*4.5)/5.5)]";

export default function VideoStories() {
  const [filter, setFilter] = useState<Segment | "all">("all");
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const list = STORIES.filter((s) => filter === "all" || s.segment === filter);
  const total = list.length + 1;

  useEffect(() => { trackRef.current?.scrollTo({ left: 0 }); setActive(0); }, [filter]);

  const onScroll = () => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    setActive(Math.min(total - 1, Math.round(el.scrollLeft / (card.offsetWidth + 12))));
  };

  const scrollByCards = (dir: 1 | -1) => {
    const el = trackRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 16) * 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const close = useCallback(() => {
    setOpenAt(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <section id="video" className="t5-section relative overflow-hidden bg-bg" aria-labelledby="video-title">
      <div className="t5-container">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal="down">
            <h2 id="video-title" className="flex items-center gap-3 text-3xl font-black tracking-[-.04em] text-fg sm:text-4xl">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-on-accent"><VideoCameraIcon className="h-6 w-6" /></span>
              Video công trình thực tế
            </h2>
            {HANDLE && <p className="mt-3 text-fg-muted">Xem thi công & bàn giao thực tế từ kênh <strong className="text-fg">@{HANDLE}</strong></p>}
          </div>
          {SOCIAL_BUTTONS.length > 0 && (
            <div data-reveal="up" className="flex flex-wrap gap-2">
              {SOCIAL_BUTTONS.map(({ key, label, href, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="t12-chip"><Icon className="h-4 w-4" />{label}</a>
              ))}
            </div>
          )}
        </div>

        <div className="t12-no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible px-4 sm:mx-0 sm:px-0" role="group" aria-label="Lọc video theo phân khúc">
          {(["all", ...SEGMENT_ORDER] as const).map((s) => (
            <button key={s} type="button" aria-pressed={filter === s} onClick={() => setFilter(s)} className="t12-chip shrink-0">{s === "all" ? "Tất cả" : SEGMENTS[s].short}</button>
          ))}
        </div>

        <div className="relative mt-6">
          <div ref={trackRef} onScroll={onScroll} className="t12-no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0" aria-label="Danh sách video">
            {list.map((story, i) => (
              <button key={story.id} type="button" onClick={(e) => { triggerRef.current = e.currentTarget; setOpenAt(i); }}
                aria-label={`Phát video: ${story.shortTitle}`}
                className={`group relative aspect-[9/16] shrink-0 snap-start overflow-hidden rounded-3xl border border-glass-border bg-bg-elevated text-left shadow-[0_20px_60px_-30px_rgb(var(--c-shadow)/.25)] transition duration-500 motion-safe:hover:-translate-y-1.5 ${CARD_W}`}>
                <Image src={story.poster} alt="" fill loading="lazy" sizes="(max-width:640px) 55vw, (max-width:1024px) 28vw, 220px" className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.05]" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-scrim/90 via-scrim/40 to-transparent" />
                <span className="absolute left-2.5 top-2.5"><PlatformBadge story={story} /></span>
                <span className="absolute right-2.5 top-2.5 hidden rounded-full bg-accent/90 px-2 py-1 text-[10px] font-black text-on-accent sm:block">{STORY_TYPE_LABELS[story.type]}</span>
                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-on-accent shadow-xl transition motion-safe:group-hover:scale-110"><PlayIcon className="ml-0.5 h-6 w-6" /></span>
                <span className="absolute inset-x-3 bottom-3 text-on-media">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-accent-soft sm:hidden">{STORY_TYPE_LABELS[story.type]}</span>
                  <span className="line-clamp-2 text-sm font-black leading-snug">{story.shortTitle}</span>
                  <span className="mt-1 block truncate text-xs text-on-media/80">📍 {story.location} · {story.kwp} kWp</span>
                </span>
              </button>
            ))}

            {/* Thẻ "Xem thêm" */}
            <div className={`relative flex aspect-[9/16] shrink-0 snap-start flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-glass-border bg-gradient-to-br from-primary-deep via-bg-tint to-bg-elevated p-4 text-center ${CARD_W}`}>
              <span className="grid h-16 w-16 place-items-center rounded-full border-4 border-accent bg-bg-deep text-xl font-black text-accent">{SITE_CONFIG.brand.logoText}</span>
              <div className="text-sm font-black text-fg">Hơn {TOTAL_CHANNEL_VIDEOS} video công trình</div>
              {socials.tiktok?.url && <a href={socials.tiktok.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-accent px-3 text-xs font-black text-on-accent"><TikTokIcon className="h-4 w-4" />Theo dõi trên TikTok</a>}
              {socials.youtube?.url && <a href={socials.youtube.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-line/20 bg-glass px-3 text-xs font-black text-fg"><YouTubeIcon className="h-4 w-4" />Kênh YouTube</a>}
            </div>
          </div>

          <button type="button" onClick={() => scrollByCards(-1)} aria-label="Cuộn sang trái" className="t8-glass absolute -left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-fg lg:grid"><ChevronLeftIcon className="h-6 w-6" /></button>
          <button type="button" onClick={() => scrollByCards(1)} aria-label="Cuộn sang phải" className="t8-glass absolute -right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-fg lg:grid"><ChevronRightIcon className="h-6 w-6" /></button>
        </div>

        <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-accent" : "w-1.5 bg-line/25"}`} />)}
        </div>
      </div>

      {openAt !== null && <StoryPlayer stories={list} startIndex={openAt} onClose={close} />}
    </section>
  );
}
