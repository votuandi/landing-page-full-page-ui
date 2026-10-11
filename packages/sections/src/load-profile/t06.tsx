import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import PowerChart from "../shared/PowerChart";
import type { loadProfile } from "./schema";

export default function LoadProfileT06({ data, site, sectionId }: SectionPropsOf<typeof loadProfile>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section bg-bg" aria-labelledby={`${sectionId}-title`}>
    <div className="t15-container">
      <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
        <div><span className="t15-eyebrow">{t(data.eyebrow)}</span><h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title)}</h2></div>
        <p className="t15-subheading">{t(data.description)}</p>
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="min-w-0 rounded-card border border-line/15 bg-bg-tint p-4 sm:p-6"><PowerChart chart={data.chart} locale={site.locale} title={t(data.title)} unit={t(data.unit)} id={sectionId} /></div>
        <dl className="grid gap-px overflow-hidden rounded-card border border-line/15 bg-line/15">{data.metrics.map((metric, i) => <div key={i} className="bg-bg-elevated p-6"><dt className="text-xs font-bold uppercase text-fg-muted">{t(metric.label)}</dt><dd className="mt-3 text-3xl font-black text-primary">{metric.value}</dd></div>)}</dl>
      </div>
    </div>
  </section>;
}
