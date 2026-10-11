import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { pageHero } from "./schema";

export default function PageHeroT03({ data, site, sectionId }: SectionPropsOf<typeof pageHero>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="relative overflow-hidden bg-bg-tint text-fg">
    <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-pill bg-accent/30 blur-3xl" />
    <div className="t15-container relative grid min-h-[520px] items-center gap-12 py-16 lg:grid-cols-2">
      <div>
        {data.breadcrumb && <nav aria-label={site.locale === "en" ? "Breadcrumb" : "Đường dẫn"}><ol className="mb-6 flex flex-wrap gap-3 text-sm text-primary">{data.breadcrumb.map((entry, i) => <li key={i}><SectionLink link={entry} locale={site.locale} /> <span aria-hidden>/</span></li>)}</ol></nav>}
        <p className="inline-flex rounded-pill border border-line/20 bg-bg-elevated px-4 py-2 text-sm font-bold uppercase tracking-widest text-primary">{t(data.eyebrow)}</p>
        <h1 id={`${sectionId}-title`} className="mt-6 text-4xl font-black leading-tight tracking-tight md:text-6xl">{t(data.title)}</h1>
        <p className="mt-6 text-lg leading-8 text-fg-muted">{t(data.subtitle)}</p>
        <div className="mt-8 flex flex-wrap gap-3">{data.ctas?.map((entry, i) => <SectionLink key={i} link={entry} locale={site.locale} className={i === 0 ? "rounded-button bg-primary px-6 py-4 font-bold text-on-primary shadow-lg" : "rounded-button border border-line/20 bg-bg-elevated px-6 py-4 font-bold text-fg"} />)}</div>
      </div>
      <div className="relative"><div aria-hidden className="absolute -left-4 -top-4 h-full w-full rounded-media border border-primary/30" /><div className="relative aspect-[5/4] overflow-hidden rounded-media border-8 border-bg-elevated shadow-2xl"><MediaImage src={mediaSrc(data.media)} alt={t(data.media.alt)} priority sizes="(max-width:1024px) 100vw, 52vw" /></div></div>
    </div>
  </section>;
}
