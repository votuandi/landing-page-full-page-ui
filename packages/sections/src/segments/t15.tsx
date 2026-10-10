import Image from "next/image";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { SEGMENT_SLUGS } from "@solar/core";
import { MediaImage, SectionHead } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import { SegmentIcon } from "../shared/SegmentIcon";
import type { segments } from "./schema";

/**
 * Lưới phân khúc t15. Mỗi thẻ là link `?phan-khuc=<slug>#<targetAnchor>` nên chạy cả khi tắt JavaScript;
 * state phân khúc dùng chung giữa section là E3-S08.
 */
export default function SegmentsT15({ data, site, sectionId }: SectionPropsOf<typeof segments>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const titleId = `${sectionId}-title`;
  return (
    <section aria-labelledby={titleId} className="t15-section relative overflow-hidden bg-bg-elevated">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-20 h-[460px] w-[460px] rounded-full bg-glow-accent-22" />
      <div className="t15-container relative">
        <SectionHead id={titleId} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={t(data.description)} />
        <ul data-reveal-stagger="up" data-reveal-step="0.1" className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {data.items.map((item) => {
            const src = mediaSrc(item.image);
            return (
              <li key={item.segment} className="flex">
                <a href={`?phan-khuc=${SEGMENT_SLUGS[item.segment]}#${data.targetAnchor}`}
                  className="t15-card t15-card-hover group relative flex w-full flex-col overflow-hidden text-left">
                  <span className="relative block aspect-[4/3] overflow-hidden bg-bg-tint">
                    {src
                      ? <Image src={src} alt={t(item.image.alt)} fill loading="lazy" sizes="(max-width:1024px) 50vw, 300px" className="object-cover transition duration-700 group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                      : <MediaImage alt={t(item.image.alt)} sizes="300px" />}
                    <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-scrim/60 to-transparent" />
                    {item.saving && <span className="absolute bottom-3 left-3 rounded-full bg-accent px-2.5 py-1 text-2xs font-black text-on-accent shadow">{t(data.savingLabel)} {item.saving}</span>}
                  </span>
                  <span className="flex flex-1 flex-col p-4 sm:p-5">
                    <span className="flex items-center gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-on-primary">
                        <SegmentIcon segment={item.segment} className="h-6 w-6" />
                      </span>
                      <span className="text-base font-black leading-tight text-fg sm:text-lg">{t(item.label)}</span>
                    </span>
                    <span className="mt-2 text-xs leading-5 text-fg-muted sm:text-sm">{t(item.pitch)}</span>
                  </span>
                  <span aria-hidden className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-bg-elevated text-primary shadow transition group-hover:translate-x-1 motion-reduce:transition-none">
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
