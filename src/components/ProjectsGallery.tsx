"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG } from "@/config/site";
import { SEGMENTS, SEGMENT_ORDER } from "@/config/segments";
import { PROJECTS } from "@/data/projects";
import { STORIES } from "@/data/stories";
import { formatMoneyShort, formatNumber } from "@/lib/format";
import { SECTION_IDS, useSegment } from "@/lib/segment";
import { useStoryPlayer } from "@/lib/storyPlayer";

/** Gallery công trình lọc theo phân khúc chung. Công trình có video → nút play mở trình phát đúng video. */
export default function ProjectsGallery() {
  const { segment, setSegment } = useSegment();
  const player = useStoryPlayer();
  const list = PROJECTS.filter((p) => !segment || p.segment === segment);

  return (
    <section id={SECTION_IDS.projects} className="t5-section bg-bg-tint" aria-labelledby="cong-trinh-title">
      <div className="t5-container">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal="down">
            <span className="t5-eyebrow">Công trình đã thực hiện</span>
            <h2 id="cong-trinh-title" className="t5-heading">Hơn {formatNumber(SITE_CONFIG.capabilities.customers)} khách hàng đã dùng điện từ nắng.</h2>
          </div>
          <div className="t13-no-scrollbar -mx-4 flex gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible px-4 sm:mx-0 sm:px-0 lg:max-w-[55%] lg:justify-end" role="group" aria-label="Lọc công trình theo phân khúc">
            <button type="button" aria-pressed={!segment} onClick={() => setSegment(null)} className="t13-chip shrink-0">Tất cả</button>
            {SEGMENT_ORDER.map((s) => (
              <button key={s} type="button" aria-pressed={segment === s} onClick={() => setSegment(s)} className="t13-chip shrink-0">{SEGMENTS[s].short}</button>
            ))}
          </div>
        </div>

        <div data-reveal-stagger="up" data-reveal-step="0.08" className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {list.map((p) => (
            <article key={p.slug} className="t8-card group relative flex flex-col overflow-hidden transition hover:-translate-y-1.5">
              <div className="relative aspect-[4/3] overflow-hidden bg-bg-tint">
                <Image src={p.image} alt={p.title} fill loading="lazy" sizes="(max-width:1024px) 50vw, 300px" className="object-cover transition duration-700 group-hover:scale-[1.05]" />
                <span className="t8-glass absolute left-2 top-2 rounded-full px-2.5 py-1 text-[11px] sm:left-3 sm:top-3 sm:text-xs font-black text-primary-strong">{formatNumber(p.kwp)} kWp</span>
                {p.storyId && STORIES.some((s) => s.id === p.storyId) && (
                  <button type="button" onClick={(e) => player.open(STORIES, p.storyId!, e.currentTarget)} aria-label={`Xem video công trình ${p.title}`}
                    className="absolute bottom-2 right-2 z-10 grid h-11 w-11 sm:bottom-3 sm:right-3 sm:h-12 sm:w-12 place-items-center rounded-full bg-accent text-on-accent shadow-xl ring-4 ring-on-media/40 transition motion-safe:hover:scale-110">
                    <PlayIcon className="ml-0.5 h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3 sm:p-5">
                <div className="text-xs font-bold uppercase tracking-[.14em] text-fg-subtle">{SEGMENTS[p.segment].short}</div>
                <h3 className="mt-1.5 text-sm font-black leading-snug text-fg sm:text-lg">
                  <Link href={`/cong-trinh/${p.slug}`} className="after:absolute after:inset-0 after:content-['']">{p.title}</Link>
                </h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-fg-muted sm:text-sm"><MapPinIcon className="h-4 w-4 shrink-0" />{p.location}</div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                  <div><div className="text-[11px] font-bold uppercase tracking-[.12em] text-fg-subtle">Tiết kiệm</div><div className="text-base font-black text-primary sm:text-lg">~{formatMoneyShort(p.savingPerMonth)}<span className="text-xs font-bold text-fg-muted">/tháng</span></div></div>
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
