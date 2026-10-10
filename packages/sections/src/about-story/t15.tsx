import { SectionHead, MediaImage } from "@solar/ui";
import { pickLocale } from "../fields";
import type { SectionPropsOf } from "../define";
import type { aboutStory } from "./schema";
import { mediaSrc } from "../shared/media";
import { RichText } from "../render/RichText";
import { SectionLink } from "../render/SectionLink";
import AboutVideo from "./t15.client";

export default function AboutStoryT15({ data, site, sectionId }: SectionPropsOf<typeof aboutStory>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section bg-bg" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} />
          <div className="mt-4 text-sm leading-7 text-fg-muted"><RichText value={data.body} locale={site.locale} /></div>
          <dl className="mt-8 grid grid-cols-2 gap-4">{data.stats.map((stat, i) => <div key={i} className="t15-card p-6">
            <dd className="text-3xl font-black text-primary">{new Intl.NumberFormat(site.locale, { maximumFractionDigits: 1 }).format(stat.value ?? Math.max(0, new Date().getFullYear() - stat.sinceYear!))}{stat.suffix && t(stat.suffix)}</dd>
            <dt className="mt-1 text-sm text-fg-muted">{t(stat.label)}</dt>
          </div>)}</dl>
          <div className="mt-8 flex flex-wrap gap-3">{data.ctas.map((cta, i) => <SectionLink key={i} link={cta} locale={site.locale} className={`t15-button ${i === 0 ? "t15-button-accent" : "t15-button-secondary"}`} />)}</div>
        </div>
        <div>
          {data.image && <div className="relative min-h-80 overflow-hidden rounded-media border-4 border-bg-elevated shadow-xl"><MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} sizes="(max-width:1024px) 100vw, 40vw" /></div>}
          {data.video && <AboutVideo locale={site.locale} story={{ id: sectionId + "-video", title: t(data.title), location: "", kwp: 0, segment: "household", poster: mediaSrc(data.video.poster), source: data.video.source, kindLabel: t(data.eyebrow) }} />}
        </div>
      </div>
      {data.milestones.length > 0 && <div className="t15-invert t15-ocean mt-12 grid gap-4 rounded-media p-6 text-fg md:grid-cols-4">{data.milestones.map((milestone, i) => <article key={i} className="t15-glass-dark rounded-card p-6">
        <div className="text-2xl font-black text-accent-ink">{milestone.year}</div><h3 className="mt-7 text-xl font-black">{t(milestone.title)}</h3><p className="mt-3 text-sm leading-6 text-fg-muted">{t(milestone.description)}</p>
      </article>)}</div>}
      {data.values.length > 0 && <div className="mt-8 grid gap-4 sm:grid-cols-3">{data.values.map((value, i) => <article key={i} className="t15-card p-6"><h3 className="font-black text-fg">{t(value.title)}</h3><p className="mt-2 text-sm text-fg-muted">{t(value.description)}</p></article>)}</div>}
    </div>
  </section>;
}
