import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { MediaImage } from "@solar/ui";
import { mediaSrc } from "../shared/media";
import { SectionLink } from "../render/SectionLink";
import type { hero } from "./schema";
import PowerChart from "../shared/PowerChart";

export default function HeroT06({ data, site, sectionId }: SectionPropsOf<typeof hero>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="relative overflow-hidden bg-primary text-on-primary" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="absolute inset-y-0 right-0 hidden w-1/3 bg-secondary/20 lg:block" />
    <div className="t15-container relative grid min-h-[720px] items-center gap-10 py-16 lg:grid-cols-[.92fr_1.08fr]">
      <div><span className="inline-flex rounded-pill border border-accent/45 bg-accent/10 px-3 py-2 text-xs font-black uppercase tracking-widest text-accent">{t(data.badge)}</span>
        <h1 id={`${sectionId}-title`} className="mt-7 text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">{t(data.title.lead)} <span className="text-accent">{t(data.title.highlight)}</span><span className="mt-4 block text-2xl sm:text-3xl">{t(data.title.sub)} {t(data.title.subHighlight)}</span></h1>
        <p className="mt-7 max-w-2xl text-lg leading-8">{t(data.description)}</p>
        <div className="mt-9 flex flex-wrap gap-3"><SectionLink link={data.primaryCta} locale={site.locale} className="rounded-button bg-accent px-5 py-3 font-bold text-on-accent" />{data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="rounded-button border border-on-primary/30 px-5 py-3 font-bold" />}</div>
        <dl className="mt-10 grid grid-cols-3 gap-3">{data.stats.map((stat, i) => <div key={i} className="rounded-card border border-on-primary/20 p-3"><dd className="text-xl font-black">{stat.value.toLocaleString(site.locale === "vi" ? "vi-VN" : "en-US", { minimumFractionDigits: stat.decimals, maximumFractionDigits: stat.decimals })}{stat.suffix} <span className="text-xs">{t(stat.unit)}</span></dd><dt className="mt-2 text-xs">{t(stat.label)}</dt></div>)}</dl>
        {data.rating && <a href={data.rating.url} className="mt-4 inline-block text-sm">{data.rating.score}/5 · {data.rating.count} {t(data.rating.label)}</a>}
      </div>
      <div className="rounded-card border border-on-primary/20 bg-glass p-4 shadow-xl">
        {data.chart ? <div className="rounded-card bg-bg-elevated p-4 text-fg"><PowerChart chart={data.chart} locale={site.locale} title={t(data.badge)} unit={t(data.chart.unit)} id={sectionId} /></div>
          : <div className="relative aspect-[3/2] overflow-hidden rounded-media"><MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} priority sizes="(max-width:1024px) 100vw, 50vw" /></div>}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">{[data.outputCard, data.savingCard, data.co2Card].map((card, i) => card && <div key={i} className="rounded-card bg-bg-elevated p-4 text-fg"><div className="text-xs font-bold text-fg-muted">{t(card.label)}</div><div className="mt-2 text-xl font-black text-primary">{card.value} {card.unit && t(card.unit)}</div>{"liveLabel" in card && <span className="text-xs text-fg-muted">{String(card.liveLabel)}</span>}</div>)}</div>
        {data.chips.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{data.chips.map((chip, i) => <li key={i} className="rounded-pill bg-bg-elevated px-3 py-2 text-xs font-bold text-fg">{t(chip.label)}</li>)}</ul>}
      </div>
    </div>
  </section>;
}
