import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { services } from "./schema";

export default function ServicesT02({ data, site, sectionId }: SectionPropsOf<typeof services>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg-elevated py-20 text-fg"><div className="t15-container">
    <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-widest text-primary">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-5 text-3xl font-bold md:text-4xl">{t(data.title)}</h2>{data.description && <p className="mt-5 leading-8 text-fg-muted">{t(data.description)}</p>}</div>
    <div className="mt-10 grid gap-6 md:grid-cols-3">{data.items.map((item, i) => <article key={item.id} className="overflow-hidden rounded-card border border-line/20 bg-bg-elevated">
      <div className="relative h-56"><MediaImage src={mediaSrc(item.image)} alt={t(item.image.alt)} sizes="(max-width:768px) 100vw, 33vw" /></div>
      <div className="p-6"><span className="text-xs text-fg-muted">{String(i + 1).padStart(2, "0")}</span><h3 className="mt-3 text-2xl font-bold">{t(item.title)}</h3><ul className="my-5 space-y-2 text-sm leading-7 text-fg-muted">{item.points.map((point, n) => <li key={n}>{t(point)}</li>)}</ul>{item.link && <SectionLink link={item.link} locale={site.locale} className="inline-flex min-h-11 items-center font-bold text-primary" />}</div>
    </article>)}</div>
  </div></section>;
}
