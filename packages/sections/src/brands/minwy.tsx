import { Wordmark } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import ClassicCarousel from "../shared/ClassicCarousel.client";
import SigningVideo from "./t15.client";
import type { brands } from "./schema";

export default function BrandsMinwy({ data, site, sectionId }: SectionPropsOf<typeof brands>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  const pages = Array.from({ length: Math.ceil(data.items.length / 6) }, (_, i) => data.items.slice(i * 6, i * 6 + 6));
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg-tint py-16 text-fg"><div className="t15-container">
    <div className="mb-12 text-center"><p className="text-xs font-semibold uppercase tracking-widest text-primary">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-4 text-3xl font-bold">{t(data.title)}</h2>{data.description && <p className="mx-auto mt-4 max-w-3xl text-lg leading-7 text-fg-muted">{t(data.description)}</p>}</div>
    <ClassicCarousel label={t(data.title)} locale={site.locale} autoplay>{pages.map((page, i) => <ul key={i} className="grid w-full shrink-0 snap-start grid-cols-2 items-center gap-6 py-8 md:grid-cols-3 lg:grid-cols-6">{page.map((item, n) => <li key={n} className="flex min-h-24 items-center justify-center rounded-card bg-bg-elevated p-4 shadow-sm"><Wordmark name={t(item.name)} src={mediaSrc(item.logo)} /></li>)}</ul>)}</ClassicCarousel>
    {data.signingVideo && <div className="mt-8 grid"><SigningVideo title={t(data.signingVideo.title)} caption={t(data.signingVideo.caption)} poster={mediaSrc(data.signingVideo.poster)} source={data.signingVideo.source} locale={site.locale} /></div>}
  </div></section>;
}
