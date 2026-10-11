import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { MediaImage, delay } from "@solar/ui";
import { SEGMENT_SLUGS } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import { SegmentIcon } from "../shared/SegmentIcon";
import type { segments } from "./schema";
import SegmentsT12 from "./t12";
import { SegmentLink } from "./t15.island";

/** SavingsBySegment: shared overview followed by alternating full-screen illustrations. */
export default function SegmentsT08(props: SectionPropsOf<typeof segments>) {
  const { data, site, sectionId } = props;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <>
    <SegmentsT12 {...props} />
    {data.items.map((item, i) => <section key={item.segment} aria-labelledby={`${sectionId}-${item.segment}-title`}
      className={`t15-screen relative bg-gradient-to-br ${i % 2 ? "from-bg via-bg-elevated to-bg-sky" : "from-bg-sun via-bg-elevated to-bg-tint"}`}>
      <div className="grid flex-1 lg:grid-cols-2">
        <div data-reveal={i % 2 ? "right" : "left"} className={`relative min-h-[52vh] overflow-hidden ${i % 2 ? "lg:order-2" : ""}`}>
          <MediaImage src={mediaSrc(item.image)} alt={t(item.image.alt)} sizes="(max-width:1024px) 100vw, 50vw" className="!object-cover" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-scrim/45 to-transparent" />
          <div className="t15-glass t15-float absolute right-4 top-6 flex items-center gap-3 rounded-card px-4 py-3 sm:right-10 sm:top-10">
            <span className="grid h-10 w-10 place-items-center rounded-input bg-accent text-on-accent"><SegmentIcon segment={item.segment} className="h-5 w-5" /></span>
            <div><div className="text-2xs font-bold uppercase tracking-widest text-fg-muted">{t(data.savingLabel)}</div><div className="text-xl font-black text-primary">{item.saving}</div></div>
          </div>
        </div>
        <div className="relative flex items-center overflow-hidden px-4 py-16 sm:px-10 lg:py-20 xl:px-20">
          <div aria-hidden className="pointer-events-none absolute -right-20 top-1/4 h-[420px] w-[420px] rounded-pill bg-glow-accent-30" />
          <div className="relative w-full max-w-[600px]">
            <div data-reveal="down" className="flex items-center gap-3 text-sm font-black text-primary"><span className="grid h-9 w-9 place-items-center rounded-pill bg-glass text-xs shadow-sm">{String(i + 1).padStart(2, "0")}</span>{t(item.label)}</div>
            <h3 id={`${sectionId}-${item.segment}-title`} data-reveal="up" style={delay(0.1)} className="mt-5 text-3xl font-black leading-tight tracking-[-.035em] text-fg sm:text-4xl">{t(item.pitch)}</h3>
            <div data-reveal="up" style={delay(0.2)} className="mt-6 rounded-card border border-glass-border bg-glass p-5 shadow-glass backdrop-blur-glass">
              <div className="text-3xl font-black text-primary">{item.saving}</div><div className="mt-1 text-sm font-semibold text-fg-muted">{t(data.savingLabel)}</div>
            </div>
            <SegmentLink segment={item.segment} anchor={data.targetAnchor} href={`?phan-khuc=${SEGMENT_SLUGS[item.segment]}#${data.targetAnchor}`}
              className="t15-button t15-button-primary mt-7">{t(item.label)}<ArrowRightIcon aria-hidden className="h-4 w-4" /></SegmentLink>
          </div>
        </div>
      </div>
    </section>)}
  </>;
}
