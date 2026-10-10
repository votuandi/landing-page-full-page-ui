"use client";

import { SectionHead } from "@solar/ui";

import Image from "next/image";
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import { SEGMENTS } from "@/config/segments";
import { SEGMENT_ORDER, type Segment, SECTION_IDS } from "@solar/core";
import { useSegment } from "@/lib/segment";
import { useLang } from "@/i18n/LangProvider";
import SegmentIcon from "@/components/SegmentIcon";

/** Ảnh minh họa + mức giảm hóa đơn tham khảo cho từng phân khúc. [CẦN XÁC MINH] theo công trình thực tế. */
const CARD: Record<Segment, { image: string; saving: string }> = {
  household: { image: "/images/illustrations/home-solar.webp", saving: "50–90%" },
  shop: { image: "/images/illustrations/shop-solar.webp", saving: "30–50%" },
  factory: { image: "/images/illustrations/factory-solar.webp", saving: "25–40%" },
  farm: { image: "/images/illustrations/farm-hybrid-solar.webp", saving: "30–60%" },
};

/**
 * Lưới 4 phân khúc. Bấm một ô → ghi phân khúc vào state chung (video, gói giải pháp,
 * dự toán, công trình tự lọc/điền sẵn) rồi cuộn tới video công trình.
 */
export default function SegmentGrid() {
  const { tr } = useLang();
  const { segment, focusSegment } = useSegment();

  return (
    <section id={SECTION_IDS.segments} aria-labelledby="phan-khuc-title" className="t15-section relative overflow-hidden bg-bg-elevated">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-20 h-[460px] w-[460px] rounded-full bg-glow-accent-22" />
      <div className="t15-container relative">
        <SectionHead id="phan-khuc-title" eyebrow={tr("Giải pháp theo công trình", "Solutions by building")}
          title={tr("Bạn cần lắp cho công trình nào?", "What are you powering?")}
          desc={tr("Chọn một mục — video, gói giải pháp, dự toán và công trình bên dưới sẽ hiển thị đúng nhu cầu của bạn.", "Pick one — videos, packages, the estimator and projects below adapt to your needs.")} />

        <div data-reveal-stagger="up" data-reveal-step="0.1" className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {SEGMENT_ORDER.map((s) => {
            const active = segment === s;
            const card = CARD[s];
            return (
              <button key={s} type="button" aria-pressed={active} onClick={() => focusSegment(s, SECTION_IDS.video)}
                className={`t15-card t15-card-hover group relative flex flex-col overflow-hidden text-left ${active ? "!border-primary ring-4 ring-primary/15" : ""}`}>
                <span className={`relative block aspect-[4/3] overflow-hidden bg-bg-tint`}>
                  <Image src={card.image} alt="" fill loading="lazy" sizes="(max-width:1024px) 50vw, 300px" className="object-cover transition duration-700 group-hover:scale-[1.06]" />
                  <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-scrim/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-accent px-2.5 py-1 text-2xs font-black text-on-accent shadow">{tr("Giảm đến", "Save up to")} {card.saving}</span>
                </span>
                <span className="flex flex-1 flex-col p-4 sm:p-5">
                  <span className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition ${active ? "bg-primary text-on-primary" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-on-primary"}`}>
                      <SegmentIcon segment={s} className="h-6 w-6" />
                    </span>
                    <span className="text-base font-black leading-tight text-fg sm:text-lg">{tr(SEGMENTS[s].label, SEGMENTS[s].en.label)}</span>
                  </span>
                  <span className="mt-2 text-xs leading-5 text-fg-muted sm:text-sm">{tr(SEGMENTS[s].pitch, SEGMENTS[s].en.pitch)}</span>
                </span>
                <span className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full shadow transition ${active ? "bg-primary text-on-primary" : "bg-bg-elevated text-primary group-hover:translate-x-1"}`}>
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
