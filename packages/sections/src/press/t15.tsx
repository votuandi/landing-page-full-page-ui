import { SectionHead, Wordmark, MediaImage } from "@solar/ui";
import { pickLocale } from "../fields";
import type { SectionPropsOf } from "../define";
import type { press } from "./schema";
import { mediaSrc } from "../shared/media";

export default function PressT15({ data, site, sectionId }: SectionPropsOf<typeof press>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-elevated" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container">
      <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{data.outlets.map((outlet) => <li key={outlet.id} className="flex min-h-[76px] items-center justify-center rounded-card border border-line/12 bg-glass px-3">
        {outlet.logo ? <div className="relative h-12 w-full"><MediaImage src={mediaSrc(outlet.logo)} alt={t(outlet.logo.alt)} sizes="160px" className="object-contain" /></div> : <Wordmark name={t(outlet.name)} short={outlet.short} size="sm" />}
      </li>)}</ul>
      <div className="t15-no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0">
        {data.articles.map((article, i) => {
          const outlet = data.outlets.find((o) => o.id === article.outletId)!;
          return <article key={i} className="t15-card flex w-[85%] shrink-0 snap-start flex-col p-5 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]">
            <div className="flex items-center justify-between gap-3"><Wordmark name={t(outlet.name)} short={outlet.short} size="sm" /><time dateTime={article.date} className="text-xs font-bold text-fg-subtle">{new Intl.DateTimeFormat(site.locale === "en" ? "en-GB" : "vi-VN", { day: "2-digit", month: site.locale === "en" ? "short" : "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(article.date))}</time></div>
            <h3 className="mt-4 text-lg font-black leading-snug text-fg">{t(article.title)}</h3>
            <p className="mt-2 text-sm leading-6 text-fg-muted">{t(article.excerpt)}</p>
            {article.url && <a href={article.url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-black text-primary">{site.locale === "en" ? "Read article" : "Đọc bài gốc"} ↗</a>}
          </article>;
        })}
      </div>
    </div>
  </section>;
}
