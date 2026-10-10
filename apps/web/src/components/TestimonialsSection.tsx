"use client";

import { SectionHead } from "@solar/ui";

import { ArrowTopRightOnSquareIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { siteConfig } from "@/config/site.config";
import { SEGMENTS } from "@/config/segments";
import { TESTIMONIALS } from "@/data/testimonials";
import { formatNumber } from "@solar/core";
import { useLang } from "@/i18n/LangProvider";
import SegmentIcon from "@/components/SegmentIcon";

const REVIEW_LINKS = [
  siteConfig.reviews.google.url && { label: "Google", ...siteConfig.reviews.google },
  siteConfig.reviews.trustpilot.url && { label: "Trustpilot", ...siteConfig.reviews.trustpilot },
].filter(Boolean) as { label: string; url: string; rating: number; count: number }[];

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="flex text-accent" role="img" aria-label={`${String(value).replace(".", ",")}/5`}>
      {Array.from({ length: 5 }, (_, i) => <StarIcon key={i} className={`${className} ${i < Math.round(value) ? "" : "opacity-25"}`} />)}
    </span>
  );
}

/** Đánh giá khách hàng (theo phân khúc, công suất) + điểm đánh giá Google/Trustpilot từ config. */
export default function TestimonialsSection() {
  const { tr } = useLang();
  if (!TESTIMONIALS.length) return null;

  return (
    <section id="danh-gia" className="t15-section relative overflow-hidden bg-bg-sun/60" aria-labelledby="danh-gia-title">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-glow-accent-30" />
      <div className="t15-container relative">
        <SectionHead id="danh-gia-title" eyebrow={tr("Khách hàng nói gì", "What clients say")}
          title={tr("Niềm tin đến từ những hóa đơn điện thật.", "Trust built on real electricity bills.")}
          action={REVIEW_LINKS.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {REVIEW_LINKS.map((r) => (
                <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" className="t15-card flex min-h-11 items-center gap-3 !rounded-full px-4 py-2 text-sm font-bold text-fg">
                  <Stars value={r.rating} />
                  <span>{String(r.rating).replace(".", ",")}/5 · {formatNumber(r.count)} {tr("đánh giá", "reviews")} {r.label}</span>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-fg-muted" />
                </a>
              ))}
            </div>
          )} />

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <figure key={t.name} data-reveal={i % 2 ? "right" : "left"} className="t15-card relative flex flex-col p-6">
              <span aria-hidden className="absolute right-5 top-2 text-7xl font-black leading-none text-primary/10">“</span>
              <Stars value={t.rating} />
              <blockquote className="mt-4 flex-1 text-base font-semibold leading-7 text-fg">“{t.quote}”</blockquote>
              <figcaption className="mt-5 border-t border-line/10 pt-4 text-sm">
                <div className="font-black text-fg">{t.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
                  <span className="flex items-center gap-1"><SegmentIcon segment={t.segment} className="h-3.5 w-3.5" />{tr(SEGMENTS[t.segment].short, SEGMENTS[t.segment].en.short)}</span>
                  <span className="flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" />{t.location}</span>
                  <span className="font-bold text-primary">{formatNumber(t.kwp)} kWp</span>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
