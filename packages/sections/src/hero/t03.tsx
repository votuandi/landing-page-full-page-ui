import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import HeroMinwy from "./minwy";
import type { hero } from "./schema";

export default function HeroT03(props: SectionPropsOf<typeof hero>) {
  // The source homepage starts with the same SliderBanner as minwy.
  if (props.data.slides) return <HeroMinwy {...props} />;
  const { data, site, sectionId } = props;
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="relative overflow-hidden bg-bg-tint py-20 text-fg md:py-28">
    <div aria-hidden className="absolute -left-24 top-16 h-72 w-72 rounded-pill bg-accent/30 blur-3xl" />
    <div className="t15-container relative grid items-center gap-14 lg:grid-cols-2">
      <div><p className="inline-flex rounded-pill border border-line/20 bg-bg-elevated px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary">{t(data.badge)}</p>
        <h1 id={`${sectionId}-title`} className="mt-6 text-4xl font-black leading-tight tracking-tight md:text-6xl">{t(data.title.lead)} <span className="text-primary">{t(data.title.highlight)}</span> {t(data.title.sub)} {t(data.title.subHighlight)}</h1>
        <p className="mt-6 text-lg leading-8 text-fg-muted">{t(data.description)}</p>
        <div className="mt-8 flex flex-wrap gap-3"><SectionLink link={data.primaryCta} locale={site.locale} className="rounded-button bg-primary px-7 py-4 font-bold text-on-primary shadow-lg" />{data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="rounded-button border border-line/20 bg-bg-elevated px-7 py-4 font-bold text-fg" />}</div>
        <dl className="mt-12 grid grid-cols-3 gap-3">{data.stats.map((stat, i) => <div key={i} className="rounded-card border border-line/15 bg-bg-elevated p-4 text-center shadow-sm"><dd className="text-2xl font-black text-primary">{new Intl.NumberFormat(site.locale, { maximumFractionDigits: stat.decimals }).format(stat.value)}{stat.suffix} {t(stat.unit)}</dd><dt className="mt-1 text-xs font-semibold text-fg-muted">{t(stat.label)}</dt></div>)}</dl>
      </div>
      <div className="relative"><div aria-hidden className="absolute -left-4 -top-4 h-full w-full rounded-media border border-primary/30" /><div className="relative aspect-[5/4] overflow-hidden rounded-media border-8 border-bg-elevated shadow-2xl"><MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} priority sizes="(max-width:1024px) 100vw, 50vw" /></div></div>
    </div>
  </section>;
}
