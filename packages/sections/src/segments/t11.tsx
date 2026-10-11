import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { segments } from "./schema";
import Comparison from "./t11.client";

export default function SegmentsT11({ data, site, sectionId }: SectionPropsOf<typeof segments>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section className="bg-bg py-section text-fg" aria-labelledby={`${sectionId}-title`}><div className="mx-auto max-w-[var(--container)] px-7">
    <p className="text-xs font-semibold uppercase tracking-widest text-primary">03 · {t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-4 max-w-3xl font-display text-3xl font-semibold sm:text-4xl">{t(data.title)}</h2><p className="mt-4 max-w-3xl leading-8 text-fg-muted">{t(data.description)}</p>
    <Comparison data={data} locale={site.locale} sectionId={sectionId} />
  </div></section>;
}
