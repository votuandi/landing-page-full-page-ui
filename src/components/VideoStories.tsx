"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, VideoCameraIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG } from "@/config/site";
import { SEGMENTS, SEGMENT_ORDER } from "@/config/segments";
import { STORIES, STORY_TYPE_LABELS, TOTAL_CHANNEL_VIDEOS, type Story } from "@/data/stories";
import { SECTION_IDS, useSegment } from "@/lib/segment";
import { useStoryPlayer } from "@/lib/storyPlayer";
import { FacebookIcon, TikTokIcon, YouTubeIcon } from "@/components/BrandIcons";

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
  return <span className="flex items-center gap-1 rounded-full bg-scrim/70 px-2.5 py-1 text-[11px] font-bold text-on-media backdrop-blur"><Icon className="h-3.5 w-3.5" />{label}</span>;
}

/* Bề rộng thẻ: mobile ~1.8 thẻ, tablet ~3.5, desktop ~5.5 — thẻ cuối luôn bị cắt một phần để gợi ý vuốt */
const CARD_W = "w-[calc((100%-0.75rem*0.8)/1.8)] sm:w-[calc((100%-1rem*2.5)/3.5)] lg:w-[calc((100%-1rem*4.5)/5.5)]";
const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function VideoStories() {
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
    <section id={SECTION_IDS.video} className="t5-section relative overflow-hidden bg-bg" aria-labelledby="video-title">
      <div className="t5-container">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal="down">
            <h2 id="video-title" className="flex items-center gap-3 text-3xl font-black tracking-[-.04em] text-fg sm:text-4xl">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent"><VideoCameraIcon className="h-6 w-6" /></span>
              Video công trình thực tế
            </h2>
            {HANDLE && <p className="mt-3 text-fg-muted">Thi công & bàn giao thực tế từ kênh <strong className="text-fg">@{HANDLE}</strong></p>}
          </div>
          {SOCIAL_BUTTONS.length > 0 && (
            <div data-reveal="up" className="flex flex-wrap gap-2">
              {SOCIAL_BUTTONS.map(({ key, label, href, Icon }) => (
                <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="t13-chip"><Icon className="h-4 w-4" />{label}</a>
              ))}
            </div>
          )}
        </div>

        <div className="t13-no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Lọc video theo phân khúc">
          <button type="button" aria-pressed={!segment} onClick={() => setSegment(null)} className="t13-chip shrink-0">Tất cả</button>
          {SEGMENT_ORDER.map((s) => (
            <button key={s} type="button" aria-pressed={segment === s} onClick={() => setSegment(s)} className="t13-chip shrink-0">{SEGMENTS[s].short}</button>
          ))}
        </div>

        <div className="relative mt-6">
          <div ref={trackRef} onScroll={onScroll} className="t13-no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0" aria-label="Danh sách video công trình">
            {list.map((story) => (
              <button key={story.id} type="button" onClick={(e) => player.open(list, story.id, e.currentTarget)}
                aria-label={`Phát video: ${story.shortTitle}, ${story.location}, ${story.kwp} kWp`}
                className={`group relative aspect-[9/16] shrink-0 snap-start overflow-hidden rounded-3xl border border-glass-border bg-bg-tint text-left shadow-[0_20px_60px_-30px_rgb(var(--c-shadow)/.25)] transition duration-500 motion-safe:hover:-translate-y-1.5 ${CARD_W}`}>
                <Image src={story.poster} alt="" fill loading="lazy" sizes="(max-width:640px) 55vw, (max-width:1024px) 28vw, 220px" className="object-cover transition duration-700 motion-safe:group-hover:scale-[1.05]" />
                <span className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-scrim/95 via-scrim/70 to-transparent" />
                <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
                  <PlatformBadge story={story} />
                  <span className="rounded-full bg-bg-elevated/90 px-2 py-1 text-[10px] font-black text-fg">{STORY_TYPE_LABELS[story.type]}</span>
                </span>
                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-on-accent shadow-xl ring-4 ring-on-media/30 transition motion-safe:group-hover:scale-110"><PlayIcon className="ml-0.5 h-6 w-6" /></span>
                <span className="absolute inset-x-3 bottom-3 text-on-media">
                  <span className="line-clamp-2 text-sm font-black leading-snug">{story.shortTitle}</span>
                  <span className="mt-1 block truncate text-xs text-on-media/90">📍 {story.location} · {story.kwp} kWp</span>
                </span>
              </button>
            ))}

            {/* Thẻ "Xem thêm" */}
            <div className={`relative flex aspect-[9/16] shrink-0 snap-start flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-glass-border bg-gradient-to-br from-bg-elevated via-bg-tint to-primary/15 p-4 text-center ${CARD_W}`}>
              <span className="grid h-16 w-16 place-items-center rounded-full border-4 border-primary bg-bg-elevated text-xl font-black text-primary">{SITE_CONFIG.brand.logoText}</span>
              <div className="text-sm font-black text-fg">Hơn {TOTAL_CHANNEL_VIDEOS} video công trình</div>
              {socials.tiktok?.url && <a href={socials.tiktok.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-fg px-3 text-xs font-black text-bg"><TikTokIcon className="h-4 w-4" />Theo dõi trên TikTok</a>}
              {socials.youtube?.url && <a href={socials.youtube.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-line/20 bg-bg-elevated px-3 text-xs font-black text-fg"><YouTubeIcon className="h-4 w-4 text-primary" />Kênh YouTube</a>}
            </div>
          </div>

          <button type="button" onClick={() => scrollByCards(-1)} disabled={active === 0} aria-label="Xem video trước" className="t8-glass absolute -left-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-fg disabled:opacity-0 lg:grid"><ChevronLeftIcon className="h-6 w-6" /></button>
          <button type="button" onClick={() => scrollByCards(1)} aria-label="Xem video tiếp theo" className="t8-glass absolute -right-5 top-1/2 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-fg lg:grid"><ChevronRightIcon className="h-6 w-6" /></button>
        </div>

        <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
          {Array.from({ length: total }, (_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-primary" : "w-1.5 bg-line/25"}`} />)}
        </div>
      </div>
    </section>
  );
}
