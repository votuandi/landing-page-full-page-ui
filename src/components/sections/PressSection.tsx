"use client";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";
import { MediaImage, Wordmark } from "@/components/ui/Media";
import { CarouselNav, SectionHead } from "@/components/ui/ui";
import { pad2, useSnapCarousel } from "@/components/ui/useSnapCarousel";

const { outlets, articles } = siteConfig.press;
const outletOf = (id: string) => outlets.find((o) => o.id === id);

export const formatDate = (iso: string, lang: "vi" | "en") =>
  new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "vi-VN", { day: "2-digit", month: lang === "en" ? "short" : "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

export function ArticleCard({ a, className = "" }: { a: (typeof articles)[number]; className?: string }) {
  const { tr, lang } = useLang();
  const outlet = outletOf(a.outlet);
  return (
    <a href={a.url} target="_blank" rel="noopener noreferrer" className={`t15-card group flex flex-col overflow-hidden transition motion-safe:hover:-translate-y-1.5 ${className}`}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <MediaImage src={a.image} alt="" sizes="(max-width:640px) 85vw, (max-width:1024px) 45vw, 380px" className="transition duration-700 motion-safe:group-hover:scale-[1.05]" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          {outlet && <Wordmark name={outlet.name} short={outlet.short} size="sm" />}
          <time dateTime={a.date} className="shrink-0 text-xs font-bold text-fg-subtle">{formatDate(a.date, lang)}</time>
        </div>
        <h3 className="mt-4 line-clamp-2 text-lg font-black leading-snug text-fg">{a.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-fg-muted">{a.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-black text-primary">
          {tr("Đọc bài gốc", "Read article")}<ArrowTopRightOnSquareIcon className="h-4 w-4" /><span className="sr-only">({tr("mở tab mới", "opens in new tab")})</span>
        </span>
      </div>
    </a>
  );
}

export default function PressSection() {
  const { tr } = useLang();
  const c = useSnapCarousel();

  return (
    <section id="bao-chi" className="t15-section relative overflow-hidden bg-bg-elevated" aria-labelledby="bao-chi-title">
      <div className="t15-container">
        <SectionHead id="bao-chi-title" eyebrow={tr("Báo chí & truyền hình", "Press & TV")}
          title={tr("Truyền thông nói về chúng tôi.", "What the media says.")}
          desc={tr("Tên báo, đài và bài viết trong bản demo là hư cấu.", "Outlets and articles in this demo are fictional.")} />

        <ul data-reveal-stagger="zoom" data-reveal-step="0.05" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label={tr("Cơ quan báo chí", "Media outlets")}>
          {outlets.map((o) => (
            <li key={o.id} className="flex min-h-[76px] items-center justify-center rounded-2xl border border-line/12 bg-glass px-3 opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0">
              <Wordmark name={o.name} short={o.short} size="sm" />
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center justify-between gap-4">
          <div className="text-sm font-black tabular-nums text-fg-muted" aria-hidden><span className="text-fg">{pad2(c.index + 1)}</span> / {pad2(c.count || articles.length)}</div>
          <CarouselNav prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} />
        </div>
        <div ref={c.ref} className="t15-no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0" aria-label={tr("Bài viết", "Articles")}>
          {articles.map((a) => <ArticleCard key={a.url} a={a} className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]" />)}
        </div>
      </div>
    </section>
  );
}
