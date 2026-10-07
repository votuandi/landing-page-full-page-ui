"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowRightIcon, CheckIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";
import { openCalculator } from "@/lib/calculatorBus";
import { MediaImage } from "@/components/t14/Media";
import { CarouselNav, SectionHead } from "@/components/t14/ui";
import { pad2, useSnapCarousel } from "@/components/t14/useSnapCarousel";

const VideoModal = dynamic(() => import("@/components/t14/VideoModal"), { ssr: false });
const { segments, videos } = siteConfig.solutions;

export default function SolutionsSection() {
  const { tr } = useLang();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);
  const c = useSnapCarousel();
  const seg = segments[active];

  return (
    <section id="giai-phap" className="t5-section relative overflow-hidden bg-bg" aria-labelledby="giai-phap-title">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.14),transparent_65%)]" />
      <div className="t5-container relative">
        <SectionHead id="giai-phap-title" eyebrow={tr("Giải pháp theo phân khúc", "Solutions by segment")}
          title={tr("Một đơn vị — từ thiết bị đến công trình hoàn chỉnh.", "One partner — from equipment to a finished system.")} />

        <div role="tablist" aria-label={tr("Phân khúc", "Segment")} className="t12-no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {segments.map((s, i) => (
            <button key={s.id} type="button" role="tab" id={`gp-tab-${s.id}`} aria-controls="gp-panel" aria-selected={i === active} onClick={() => setActive(i)} className="t12-chip shrink-0">{tr(s.label)}</button>
          ))}
        </div>

        <div id="gp-panel" role="tabpanel" aria-labelledby={`gp-tab-${seg.id}`} className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative min-h-[340px] overflow-hidden rounded-[32px] border-[5px] border-glass-tint/15 shadow-[0_30px_60px_-35px_rgb(var(--c-shadow)/.55)]">
            <MediaImage key={seg.id} src={seg.image} alt={tr(seg.label)} sizes="(max-width:1024px) 100vw, 45vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/20 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-on-media/20 bg-on-media/10 p-5 text-on-media backdrop-blur-xl">
              <div className="text-xl font-black">{tr(seg.label)}</div>
              <ul className="mt-3 grid gap-2 text-sm">
                {seg.points.map((p) => <li key={p} className="flex gap-2"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={2.5} />{p}</li>)}
              </ul>
              <button type="button" onClick={() => openCalculator({ segment: seg.calcSegment, topic: `Giải pháp ${typeof seg.label === "string" ? seg.label : seg.label.vi}` })} className="t5-button t5-button-primary mt-4 w-full sm:w-auto">
                {tr("Dự toán cho tôi", "Estimate for me")} <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="t8-card flex min-w-0 flex-col p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-black text-fg">{tr("Video công trình thực tế", "On-site project videos")}</div>
                <div className="text-sm font-black tabular-nums text-fg-muted" aria-live="polite"><span className="text-accent">{pad2(c.index + 1)}</span> / {pad2(c.count || videos.length)}</div>
              </div>
              <CarouselNav prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} />
            </div>
            <div ref={c.ref} className="t12-no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto" aria-label={tr("Danh sách video", "Video list")}>
              {videos.map((v, i) => (
                <button key={i} type="button" onClick={() => setPlaying(i)} aria-label={`${tr("Phát video", "Play video")}: ${v.title}`}
                  className="group relative aspect-video w-full shrink-0 snap-start overflow-hidden rounded-3xl border border-glass-border text-left">
                  <MediaImage src={v.poster} alt="" sizes="(max-width:1024px) 90vw, 50vw" className="transition duration-700 motion-safe:group-hover:scale-[1.04]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/10 to-transparent" />
                  <span className="absolute left-1/2 top-1/2 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-on-accent shadow-xl transition motion-safe:group-hover:scale-110"><PlayIcon className="ml-1 h-7 w-7" /></span>
                  <span className="absolute inset-x-4 bottom-4 text-on-media">
                    <span className="block text-lg font-black leading-snug">{v.title}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-on-media/80"><MapPinIcon className="h-4 w-4" />{v.location}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-1.5" aria-hidden>
              {videos.map((_, i) => <button key={i} type="button" tabIndex={-1} onClick={() => c.goTo(i)} className={`h-1.5 rounded-full transition-all ${i === c.index ? "w-6 bg-accent" : "w-1.5 bg-line/25"}`} />)}
            </div>
          </div>
        </div>
      </div>
      {playing !== null && <VideoModal video={videos[playing].video} title={videos[playing].title} onClose={() => setPlaying(null)} />}
    </section>
  );
}
