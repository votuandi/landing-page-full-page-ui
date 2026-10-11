import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { MediaImage } from "@solar/ui";
import { mediaSrc } from "../shared/media";
import PowerChart from "../shared/PowerChart";
import type { energyMonitoring } from "./schema";

export default function EnergyMonitoringT06({ data, site, sectionId }: SectionPropsOf<typeof energyMonitoring>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section bg-primary text-on-primary" aria-labelledby={`${sectionId}-title`}>
    <div className="t15-container">
      <span className="text-xs font-black uppercase tracking-widest text-accent">{t(data.eyebrow)}</span>
      <h2 id={`${sectionId}-title`} className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{t(data.title)}</h2>
      <p className="mt-5 max-w-3xl leading-8">{t(data.description)}</p>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="min-w-0 rounded-card border border-line/15 bg-bg-elevated p-5 text-fg shadow-lg">
          <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{data.flows.map((flow, i) => <div key={i} className="rounded-card border border-line/15 bg-bg-tint p-4"><dt className="text-xs font-bold uppercase text-fg-muted">{t(flow.label)}</dt><dd className="mt-2 text-2xl font-black text-primary">{flow.value} <span className="text-sm">{t(flow.unit)}</span></dd></div>)}</dl>
          <PowerChart chart={data.chart} locale={site.locale} title={t(data.title)} unit={t(data.flows[0].unit)} id={sectionId} />
        </div>
        <div className="grid content-start gap-4">
          {data.image && <div className="relative aspect-video overflow-hidden rounded-media"><MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} sizes="(max-width:1024px) 100vw, 40vw" /></div>}
          {data.features.map((feature, i) => <article key={i} className="rounded-card border border-on-primary/20 bg-on-primary/5 p-5"><h3 className="font-bold">{t(feature.title)}</h3>{feature.description && <p className="mt-2 text-sm leading-7">{t(feature.description)}</p>}</article>)}
        </div>
      </div>
    </div>
  </section>;
}
