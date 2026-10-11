import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { blog } from "./schema";

export default function BlogMinwy({ data, site, sectionId }: SectionPropsOf<typeof blog>) {
  if (!data.items.length) return null;
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  const [featured, ...rest] = data.items;
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg-elevated py-16 text-fg"><div className="t15-container">
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold text-primary">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-3 text-3xl font-bold">{t(data.title)}</h2></div>{data.allLink && <SectionLink link={data.allLink} locale={site.locale} className="inline-flex min-h-11 items-center font-semibold text-primary" />}</div>
    <article className="mb-10 grid overflow-hidden rounded-card bg-bg-tint lg:grid-cols-2"><div className="p-6 md:p-10"><h3 className="text-2xl font-bold leading-snug"><a href={featured.href}>{featured.title}</a></h3><p className="mt-4 leading-8 text-fg-muted">{featured.excerpt}</p><p className="mt-5 text-sm text-fg-muted">{featured.readMinutes} {t(data.readMinutesLabel)}</p></div><a href={featured.href} aria-label={featured.title} className="relative block min-h-72"><MediaImage src={mediaSrc(featured.cover)} alt={t(featured.cover.alt)} sizes="(max-width:1024px) 100vw, 50vw" /></a></article>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{rest.map((post) => <article key={post.id} className="overflow-hidden rounded-card border border-line/15"><a href={post.href} aria-label={post.title} className="relative block aspect-[16/10]"><MediaImage src={mediaSrc(post.cover)} alt={t(post.cover.alt)} sizes="(max-width:768px) 100vw, 33vw" /></a><div className="p-5"><h3 className="text-lg font-bold"><a href={post.href}>{post.title}</a></h3><p className="mt-3 text-sm leading-7 text-fg-muted">{post.excerpt}</p><p className="mt-4 text-xs text-fg-muted">{post.readMinutes} {t(data.readMinutesLabel)}</p></div></article>)}</div>
  </div></section>;
}
