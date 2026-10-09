"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG } from "@/config/site";
import { SEGMENTS } from "@/config/segments";
import { SEGMENT_ORDER, formatMoneyShort, formatNumber, SECTION_IDS } from "@solar/core";
import { PROJECTS } from "@/data/projects";
import { STORIES } from "@/data/stories";
import { useSegment } from "@/lib/segment";
import { useStoryPlayer } from "@/lib/storyPlayer";
import { useLang } from "@/i18n/LangProvider";
import { SectionHead } from "@/components/ui/ui";

/** Gallery công trình lọc theo phân khúc chung. Công trình có video → nút play mở trình phát đúng video. */
export default function ProjectsGallery() {
  const { tr } = useLang();
  const { segment, setSegment } = useSegment();
  const player = useStoryPlayer();
  const list = PROJECTS.filter((p) => !segment || p.segment === segment);

  return (
    <section id={SECTION_IDS.projects} className="t15-section relative overflow-hidden bg-bg-tint" aria-labelledby="cong-trinh-title">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-sky)/.2),transparent_65%)]" />
      <div className="t15-container relative">
        <SectionHead id="cong-trinh-title" eyebrow={tr("Công trình đã thực hiện", "Completed projects")}
          title={tr(`Hơn ${formatNumber(SITE_CONFIG.capabilities.customers)} khách hàng đã dùng điện từ nắng.`, `${formatNumber(SITE_CONFIG.capabilities.customers)}+ clients already run on sunshine.`)}
          action={
            <div className="t15-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:justify-end" role="group" aria-label={tr("Lọc công trình theo phân khúc", "Filter projects by segment")}>
              <button type="button" aria-pressed={!segment} onClick={() => setSegment(null)} className="t15-chip shrink-0">{tr("Tất cả", "All")}</button>
              {SEGMENT_ORDER.map((s) => (
                <button key={s} type="button" aria-pressed={segment === s} onClick={() => setSegment(s)} className="t15-chip shrink-0">{tr(SEGMENTS[s].short, SEGMENTS[s].en.short)}</button>
              ))}
            </div>
          } />

        <div data-reveal-stagger="up" data-reveal-step="0.08" className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {list.map((p) => (
            <article key={p.slug} className="t15-card t15-card-hover group relative flex flex-col overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden bg-bg-tint">
                <Image src={p.image} alt={p.title} fill loading="lazy" sizes="(max-width:1024px) 50vw, 300px" className="object-cover transition duration-700 group-hover:scale-[1.05]" />
                <span className="absolute left-2 top-2 rounded-full bg-bg-elevated/95 px-2.5 py-1 text-[11px] font-black text-primary shadow sm:left-3 sm:top-3 sm:text-xs">{formatNumber(p.kwp)} kWp</span>
                {p.storyId && STORIES.some((s) => s.id === p.storyId) && (
                  <button type="button" onClick={(e) => player.open(STORIES, p.storyId!, e.currentTarget)} aria-label={`${tr("Xem video công trình", "Watch project video")} ${p.title}`}
                    className="absolute bottom-2 right-2 z-10 grid h-11 w-11 place-items-center rounded-full bg-accent text-on-accent shadow-xl ring-4 ring-on-media/40 transition motion-safe:hover:scale-110 sm:bottom-3 sm:right-3 sm:h-12 sm:w-12">
                    <PlayIcon className="ml-0.5 h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3 sm:p-5">
                <div className="text-xs font-bold uppercase tracking-[.14em] text-secondary">{tr(SEGMENTS[p.segment].short, SEGMENTS[p.segment].en.short)}</div>
                <h3 className="mt-1.5 text-sm font-black leading-snug text-fg sm:text-lg">
                  <Link href={`/cong-trinh/${p.slug}`} className="after:absolute after:inset-0 after:content-['']">{p.title}</Link>
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-fg-muted sm:text-sm"><MapPinIcon className="h-4 w-4 shrink-0" />{p.location}</div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <div><div className="text-[11px] font-bold uppercase tracking-[.12em] text-fg-subtle">{tr("Tiết kiệm", "Savings")}</div><div className="text-base font-black text-primary sm:text-lg">~{formatMoneyShort(p.savingPerMonth)}<span className="text-xs font-bold text-fg-muted">/{tr("tháng", "mo")}</span></div></div>
                  <ArrowRightIcon className="hidden h-5 w-5 text-primary transition group-hover:translate-x-1 sm:block" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
