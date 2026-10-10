import { SectionHead } from "@solar/ui";
import { ArrowTopRightOnSquareIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { formatNumber } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SegmentIcon } from "../shared/SegmentIcon";
import type { testimonials } from "./schema";

function Stars({ value }: { value: number }) {
  return <span className="flex text-accent" role="img" aria-label={`${value}/5`}>{Array.from({ length: 5 }, (_, i) => <StarIcon aria-hidden key={i} className={`h-4 w-4 ${i < Math.round(value) ? "" : "opacity-25"}`} />)}</span>;
}
export default function TestimonialsT15({ data, site, sectionId }: SectionPropsOf<typeof testimonials>) {
  if (!data.items.length && !data.ratings.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-sun/60" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-glow-accent-30" />
    <div className="t15-container relative"><SectionHead id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} action={<div className="flex flex-wrap gap-2">{data.ratings.map((rating, i) => <a key={i} href={rating.url} target="_blank" rel="noopener noreferrer" className="t15-card flex min-h-11 items-center gap-3 !rounded-full px-4 py-2 text-sm font-bold text-fg"><Stars value={rating.score} /><span>{rating.score}/5 · {formatNumber(rating.count)} {t(rating.label)}</span><ArrowTopRightOnSquareIcon aria-hidden className="h-4 w-4 text-fg-muted" /></a>)}</div>} />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{data.items.map((item, i) => <figure key={item.id} data-reveal={i % 2 ? "right" : "left"} className="t15-card relative flex flex-col p-6">
        <span aria-hidden className="absolute right-5 top-2 text-7xl font-black leading-none text-primary/10">“</span><Stars value={item.rating} /><blockquote className="mt-4 flex-1 text-base font-semibold leading-7 text-fg">“{item.quote}”</blockquote>
        <figcaption className="mt-5 border-t border-line/10 pt-4 text-sm"><div className="font-black text-fg">{item.name}</div><div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted"><span className="flex items-center gap-1"><SegmentIcon segment={item.segment} className="h-3.5 w-3.5" />{t(data.segmentLabels[item.segment])}</span><span className="flex items-center gap-1"><MapPinIcon aria-hidden className="h-3.5 w-3.5" />{item.location}</span><span className="font-bold text-primary">{formatNumber(item.kwp)} kWp</span></div></figcaption>
      </figure>)}</div>
    </div>
  </section>;
}
