import { ArrowRightIcon, CheckIcon } from "@heroicons/react/24/outline";
import { SEGMENT_SLUGS } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SegmentIcon } from "../shared/SegmentIcon";
import type { segments } from "./schema";
import { SegmentLink } from "./t15.island";

/** Thẻ icon kính của template-13; dùng cùng nội dung và state phân khúc với t15. */
export default function SegmentsT13({ data, site, sectionId }: SectionPropsOf<typeof segments>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const titleId = `${sectionId}-title`;
  return (
    <section aria-labelledby={titleId} className="relative overflow-hidden bg-bg-tint py-14 md:py-20">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-20 h-[460px] w-[460px] rounded-pill bg-glow-leaf-22" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[460px] w-[460px] rounded-pill bg-glow-primary-14" />
      <div className="t15-container relative">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div data-reveal="down">
            <span className="t15-eyebrow">{t(data.eyebrow)}</span>
            <h2 id={titleId} className="mt-4 text-3xl font-black tracking-[-.04em] text-fg sm:text-4xl">{t(data.title)}</h2>
          </div>
          <p data-reveal="up" className="max-w-md text-sm leading-6 text-fg-muted">{t(data.description)}</p>
        </div>
        <ul data-reveal-stagger="up" data-reveal-step="0.1" className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {data.items.map((item) => (
            <li key={item.segment} className="flex">
              <SegmentLink segment={item.segment} anchor={data.targetAnchor} href={`?phan-khuc=${SEGMENT_SLUGS[item.segment]}#${data.targetAnchor}`}
                className="group relative flex min-h-[156px] w-full flex-col rounded-card border border-glass-border bg-glass p-4 text-left shadow-glass backdrop-blur-glass transition duration-motion-base motion-safe:hover:-translate-y-1.5 motion-reduce:transition-none aria-[current=true]:border-primary aria-[current=true]:ring-2 aria-[current=true]:ring-primary/30 sm:min-h-[176px] sm:p-6">
                <span className="grid h-12 w-12 place-items-center rounded-input bg-primary/10 text-primary transition duration-motion-fast group-hover:bg-primary group-hover:text-on-primary group-aria-[current=true]:bg-primary group-aria-[current=true]:text-on-primary motion-reduce:transition-none sm:h-14 sm:w-14">
                  <SegmentIcon segment={item.segment} className="h-6 w-6 sm:h-7 sm:w-7" />
                </span>
                <span className="mt-4 text-base font-black leading-tight text-fg sm:text-lg">{t(item.label)}</span>
                <span className="mt-1 text-xs leading-5 text-fg-muted sm:text-sm">{t(item.pitch)}</span>
                <span aria-hidden className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-pill bg-bg-elevated text-primary transition duration-motion-fast group-aria-[current=true]:bg-primary group-aria-[current=true]:text-on-primary motion-safe:group-hover:translate-x-1 motion-reduce:transition-none sm:right-5 sm:top-5">
                  <ArrowRightIcon className="h-4 w-4 group-aria-[current=true]:hidden" />
                  <CheckIcon className="hidden h-4 w-4 group-aria-[current=true]:block" strokeWidth={2.5} />
                </span>
              </SegmentLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
