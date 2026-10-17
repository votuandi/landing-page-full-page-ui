import { currentYear } from "@solar/core";
import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { RichText } from "../render/RichText";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import AboutVideo from "./t15.client";
import type { aboutStory } from "./schema";

export default function AboutStoryMinwy({ data, site, sectionId }: SectionPropsOf<typeof aboutStory>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="bg-gradient-to-br from-bg-elevated to-bg-tint py-20 text-fg"><div className="t15-container">
    <div className="grid items-center gap-12 lg:grid-cols-2"><div><p className="text-sm font-semibold uppercase text-primary">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-5 text-3xl font-bold tracking-tight md:text-5xl">{t(data.title)}</h2><div className="mt-6 text-lg leading-8 text-fg-muted"><RichText value={data.body} locale={site.locale} /></div>
      <dl className="mt-10 grid grid-cols-3 gap-4">{data.stats.map((stat, i) => <div key={i} className="text-center"><dd className="text-3xl font-bold text-primary">{new Intl.NumberFormat(site.locale).format(stat.value ?? Math.max(0, currentYear() - stat.sinceYear!))}{stat.suffix && t(stat.suffix)}</dd><dt className="mt-2 text-sm text-fg-muted">{t(stat.label)}</dt></div>)}</dl>
      <div className="mt-8 flex flex-wrap gap-4">{data.ctas.map((cta, i) => <SectionLink key={i} link={cta} locale={site.locale} className={i === 0 ? "rounded-button bg-primary px-6 py-4 font-bold text-on-primary" : "rounded-button border border-primary px-6 py-4 font-bold text-primary"} />)}</div>
    </div><div>{data.image && <div className="relative aspect-[4/3] overflow-hidden rounded-media border-8 border-bg-elevated shadow-2xl"><MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} sizes="(max-width:1024px) 100vw, 50vw" /></div>}{data.video && <AboutVideo story={{ id: `${sectionId}-video`, title: t(data.title), location: "", kwp: 0, segment: "household", poster: mediaSrc(data.video.poster), source: data.video.source, kindLabel: t(data.eyebrow) }} locale={site.locale} />}</div></div>
    {data.milestones.length > 0 && <ol className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{data.milestones.map((item, i) => <li key={i} className="rounded-card border border-line/15 bg-bg-elevated p-6 shadow-sm"><p className="text-2xl font-bold text-primary">{item.year}</p><h3 className="mt-4 text-lg font-bold">{t(item.title)}</h3><p className="mt-3 text-sm leading-7 text-fg-muted">{t(item.description)}</p></li>)}</ol>}
    {data.values.length > 0 && <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{data.values.map((value, i) => <article key={i} className="rounded-card bg-bg-elevated p-6 text-center"><h3 className="text-lg font-bold text-primary">{t(value.title)}</h3><p className="mt-3 text-sm leading-7 text-fg-muted">{t(value.description)}</p></article>)}</div>}
  </div></section>;
}
