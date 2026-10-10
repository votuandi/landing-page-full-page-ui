import { MediaImage } from "@solar/ui";
import { ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { blog } from "./schema";

export default function BlogT15({ data, site, sectionId }: SectionPropsOf<typeof blog>) {
  if (!data.items.length) return null;
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section bg-bg-elevated" aria-labelledby={`${sectionId}-title`}><div className="t15-container">
    <div className="flex flex-wrap items-end justify-between gap-4"><div data-reveal="down"><span className="t15-eyebrow">{t(data.eyebrow)}</span><h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title)}</h2></div>{data.allLink && <SectionLink link={data.allLink} locale={site.locale} className="t15-button t15-button-secondary" />}</div>
    <div data-reveal-stagger="up" data-reveal-step="0.1" className="mt-10 grid gap-5 md:grid-cols-3">
      {data.items.map((post) => <article key={post.id} className="t15-card t15-card-hover group relative flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[16/10] overflow-hidden bg-bg-tint"><MediaImage src={mediaSrc(post.cover)} alt={t(post.cover.alt)} sizes="(max-width:768px) 100vw, 400px" className="transition duration-motion-slow motion-safe:group-hover:scale-[1.05]" />{post.segment && <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-2xs font-black text-on-accent">{t(data.segmentLabels[post.segment])}</span>}</div>
        <div className="flex flex-1 flex-col p-5"><h3 className="text-lg font-black leading-snug text-fg"><a href={post.href} className="after:absolute after:inset-0 after:content-['']">{post.title}</a></h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-fg-muted">{post.excerpt}</p><div className="mt-auto flex items-center justify-between pt-4 text-xs font-bold text-fg-muted"><span className="flex items-center gap-1"><ClockIcon aria-hidden className="h-4 w-4" />{post.readMinutes} {t(data.readMinutesLabel)}</span><ArrowRightIcon aria-hidden className="h-5 w-5 text-primary transition group-hover:translate-x-1" /></div></div>
      </article>)}
    </div>
  </div></section>;
}
