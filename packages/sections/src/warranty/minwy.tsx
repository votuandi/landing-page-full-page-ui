import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { warranty } from "./schema";

/** Source registration/lookup is a simulated API; show the shared warranty policy honestly. */
export default function WarrantyMinwy({ data, site, sectionId }: SectionPropsOf<typeof warranty>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg py-12 text-fg"><div className="t15-container max-w-4xl">
    <p className="text-sm font-semibold text-primary">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-3 text-3xl font-bold">{t(data.title)}</h2><p className="mt-4 leading-7 text-fg-muted">{t(data.description)}</p>
    <dl className="mt-8 rounded-card border border-line/20 bg-bg-elevated p-6 shadow-sm">{data.rows.map((row, i) => <div key={i} className="grid gap-2 border-b border-line/15 py-5 last:border-b-0 sm:grid-cols-2"><dt className="font-bold">{t(row.item)}</dt><dd className="text-primary">{t(row.period)}{row.note && <p className="mt-2 text-sm leading-6 text-fg-muted">{t(row.note)}</p>}</dd></div>)}</dl>
    {data.footnote && <p className="mt-5 text-sm leading-7 text-fg-muted">{t(data.footnote)}</p>}
  </div></section>;
}
