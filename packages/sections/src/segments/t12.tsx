import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { SEGMENT_SLUGS } from "@solar/core";
import { MediaImage, SectionHead } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import { SegmentIcon } from "../shared/SegmentIcon";
import type { segments } from "./schema";
import { SegmentLink } from "./t15.island";

/** SavingsBySegment: tall illustrated cards with savings in a glass overlay. */
export default function SegmentsT12({ data, site, sectionId }: SectionPropsOf<typeof segments>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="t15-section relative overflow-hidden bg-bg">
    <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-glow-accent-30" />
    <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full bg-glow-primary-14" />
    <div className="t15-container relative">
      <div className="mx-auto max-w-3xl text-center"><SectionHead id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={t(data.description)} /></div>
      <ul data-reveal-stagger="up" data-reveal-step="0.15" className={`mt-12 grid gap-5 ${data.items.length === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
        {data.items.map((item, i) => <li key={item.segment}>
          <SegmentLink segment={item.segment} anchor={data.targetAnchor} href={`?phan-khuc=${SEGMENT_SLUGS[item.segment]}#${data.targetAnchor}`}
            className="group relative block overflow-hidden rounded-media border-4 border-glass-border text-left shadow-package transition motion-safe:hover:-translate-y-1.5">
            <span className="relative block aspect-[4/3] bg-bg-tint md:aspect-[3/4] lg:aspect-[10/9]">
              {mediaSrc(item.image) ? <Image src={mediaSrc(item.image)!} alt={t(item.image.alt)} fill loading="lazy" style={item.image.focal && { objectPosition: `${item.image.focal.x * 100}% ${item.image.focal.y * 100}%` }} sizes="(max-width:768px) 100vw, 33vw" className="object-cover transition duration-motion-slow motion-safe:group-hover:scale-[1.05]" /> : <MediaImage alt={t(item.image.alt)} sizes="33vw" />}
              <span className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/15 to-transparent" />
            </span>
            <span className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-input border border-on-media/20 bg-scrim/60 text-on-media backdrop-blur-xl"><SegmentIcon segment={item.segment} className="h-5 w-5" /></span>
            <span className="absolute right-5 top-5 text-sm font-black text-on-media/90">{String(i + 1).padStart(2, "0")}</span>
            <span className="absolute inset-x-4 bottom-4 rounded-card border border-on-media/20 bg-scrim/60 p-5 text-on-media backdrop-blur-xl">
              <span className="block text-lg font-black">{t(item.label)}</span>
              <span className="mt-2 flex items-end justify-between gap-3">
                <span><span className="block text-2xs font-semibold uppercase tracking-widest text-on-media/80">{t(data.savingLabel)}</span><span className="block text-3xl font-black text-accent">{item.saving}</span></span>
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-pill bg-accent text-on-accent transition motion-safe:group-hover:translate-x-1"><ArrowRightIcon className="h-4 w-4" /></span>
              </span>
            </span>
          </SegmentLink>
        </li>)}
      </ul>
    </div>
  </section>;
}
