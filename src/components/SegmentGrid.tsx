"use client";

import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import { SEGMENTS, SEGMENT_ORDER } from "@/config/segments";
import { SECTION_IDS, useSegment } from "@/lib/segment";
import SegmentIcon from "@/components/SegmentIcon";

/**
 * Lưới 4 phân khúc. Bấm một ô → ghi phân khúc vào state chung (video, gói giải pháp,
 * dự toán, công trình tự lọc/điền sẵn) rồi cuộn tới video công trình.
 */
export default function SegmentGrid() {
  const { segment, focusSegment } = useSegment();

  return (
    <section id={SECTION_IDS.segments} aria-labelledby="phan-khuc-title" className="relative overflow-hidden bg-bg-tint py-14 md:py-20">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-20 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-sun)/.3),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-primary)/.12),transparent_65%)]" />
      <div className="t5-container relative">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div data-reveal="down">
            <span className="t5-eyebrow">Giải pháp theo công trình</span>
            <h2 id="phan-khuc-title" className="mt-4 text-3xl font-black tracking-[-.04em] text-fg sm:text-4xl">Bạn cần lắp cho công trình nào?</h2>
          </div>
          <p data-reveal="up" className="max-w-md text-sm leading-6 text-fg-muted">Chọn một mục — video, gói giải pháp, dự toán và công trình bên dưới sẽ hiển thị đúng nhu cầu của bạn.</p>
        </div>

        <div data-reveal-stagger="up" data-reveal-step="0.1" className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {SEGMENT_ORDER.map((s) => {
            const active = segment === s;
            return (
              <button key={s} type="button" aria-pressed={active} onClick={() => focusSegment(s, SECTION_IDS.video)}
                className={`t8-glass group relative flex min-h-[156px] flex-col rounded-[28px] p-4 text-left transition hover:-translate-y-1.5 sm:min-h-[176px] sm:p-6 ${active ? "!border-primary ring-2 ring-primary/30" : ""}`}>
                <span className={`grid h-12 w-12 place-items-center rounded-2xl transition sm:h-14 sm:w-14 ${active ? "bg-primary text-on-primary" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary"}`}>
                  <SegmentIcon segment={s} className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <span className="mt-4 text-base font-black leading-tight text-fg sm:text-lg">{SEGMENTS[s].label}</span>
                <span className="mt-1 text-xs leading-5 text-fg-muted sm:text-sm">{SEGMENTS[s].pitch}</span>
                <span className={`absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full transition sm:right-5 sm:top-5 ${active ? "bg-primary text-on-primary" : "bg-bg-elevated text-primary group-hover:translate-x-1"}`}>
                  {active ? <CheckIcon className="h-4 w-4" strokeWidth={2.5} /> : <ArrowRightIcon className="h-4 w-4" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
