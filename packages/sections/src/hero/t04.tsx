import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { hero } from "./schema";

export default function HeroT04({ data, site, sectionId }: SectionPropsOf<typeof hero>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="overflow-hidden bg-primary-deep text-on-primary">
    <div className="t15-container grid min-h-[720px] items-center gap-12 py-16 lg:grid-cols-2">
      <div><p className="inline-flex rounded-input border border-on-primary/20 px-3 py-2 text-xs font-black uppercase tracking-widest">{t(data.badge)}</p>
        <h1 id={`${sectionId}-title`} className="mt-7 text-5xl font-black leading-none tracking-tight sm:text-6xl lg:text-7xl">{t(data.title.lead)} <span>{t(data.title.highlight)}</span> {t(data.title.sub)} {t(data.title.subHighlight)}</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8">{t(data.description)}</p>
        <div className="mt-9 flex flex-wrap gap-3"><SectionLink link={data.primaryCta} locale={site.locale} className="rounded-button bg-accent px-6 py-4 font-black text-on-accent" />{data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="rounded-button border border-on-primary/40 px-6 py-4 font-black" />}</div>
      </div>
      <div className="relative pb-8"><div className="relative aspect-square overflow-hidden rounded-media border border-on-primary/20"><MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} priority sizes="(max-width:1024px) 100vw, 48vw" /></div>
        <dl className="relative mx-4 -mt-12 grid grid-cols-3 border border-line/15 bg-bg-elevated text-fg shadow-2xl">{[data.outputCard, data.savingCard, data.co2Card].flatMap((card, i) => card ? <div key={i} className="border-r border-line/15 p-3 last:border-r-0 sm:p-4"><dt className="text-xs font-bold uppercase text-fg-muted">{t(card.label)}</dt><dd className="mt-1 text-lg font-black text-primary">{card.value} {card.unit && t(card.unit)}</dd></div> : [])}</dl>
      </div>
    </div>
  </section>;
}
