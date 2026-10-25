import { formatMoneyShort, formatNumber } from "@solar/core";
import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { CalculatorLink } from "../render/CalculatorLink";
import { mediaSrc } from "../shared/media";
import { storyQuoteLink } from "../shared/storyQuote";
import { T10, T10Head, T10_UI } from "../shared/t10";
import type { projects } from "./schema";

/** Projects t10 (CaseStudies): thẻ kính ảnh 4:3 + nhãn phân khúc · địa điểm, ba chỉ số, cả thẻ là link. */
export default function ProjectsT10({ data, site, sectionId }: SectionPropsOf<typeof projects>) {
  if (!data.items.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const ui = T10_UI[site.locale];
  return (
    <section aria-labelledby={`${sectionId}-title`} className="t15-section bg-bg-sky/40">
      <div className="t15-container">
        <T10Head id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} />
        <div data-reveal-stagger="up" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => {
            const src = mediaSrc(item.image);
            const quote = storyQuoteLink(item, site.locale, t(data.ctaLabel));
            const body = <>
              <div className="relative aspect-[4/3] overflow-hidden">
                {src ? <MediaImage src={src} alt={t(item.image.alt)} focal={item.image.focal} sizes="(min-width:1024px) 390px, (min-width:768px) 48vw, 95vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  : <MediaImage alt={t(item.image.alt)} sizes="390px" />}
                <span className="absolute bottom-4 left-4 rounded-full bg-bg-elevated px-3 py-1 text-xs font-bold text-fg">{t(data.segmentLabels[item.segment])} · {item.location}</span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-black leading-7 text-fg">{item.title}</h3>
                <dl className="mt-5 grid grid-cols-3 gap-2 border-y border-line/10 py-4">
                  {[[`${formatNumber(item.kwp)} kWp`, ui.capacity], ...(item.savingPerMonth !== undefined ? [[`~${formatMoneyShort(item.savingPerMonth)}`, t(data.savingLabel)]] : []), [item.location, ui.location]].map(([value, label]) => (
                    <div key={label} className="flex flex-col-reverse">
                      <dt className="mt-1 text-2xs text-fg-muted">{label}</dt>
                      <dd className="text-sm font-black text-primary-strong">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 font-bold text-primary-strong">{t(data.ctaLabel)}<span aria-hidden> ↗</span></p>
              </div>
            </>;
            return (
              <article key={item.id} className={`${T10.card} overflow-hidden`}>
                {item.href ? <a href={item.href} className="group block">{body}</a>
                  : <CalculatorLink href={quote.href} prefill={quote.calculator!} className="group block">{body}</CalculatorLink>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
