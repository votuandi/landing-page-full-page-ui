import { MediaImage, PriceTag } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import ClassicCarousel from "../shared/ClassicCarousel.client";
import type { products } from "./schema";

export default function ProductsMinwy({ data, site, sectionId }: SectionPropsOf<typeof products>) {
  if (!data.items.length) return null;
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  const categories = [...new Set(data.items.map((item) => item.category))];
  const pagesOf = (category: string) => {
    const items = data.items.filter((item) => item.category === category);
    return Array.from({ length: Math.ceil(items.length / 4) }, (_, i) => items.slice(i * 4, i * 4 + 4));
  };
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg-elevated py-16 text-fg"><div className="t15-container">
    <p className="text-xs font-bold uppercase tracking-widest text-primary">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-4 text-3xl font-bold">{t(data.title)}</h2>{data.description && <p className="mt-4 leading-7 text-fg-muted">{t(data.description)}</p>}
    {categories.map((category) => <div key={category} className="mt-12"><h3 className="border-b-2 border-primary pb-4 text-2xl font-bold text-primary">{data.items.find((item) => item.category === category)!.categoryLabel}</h3><div className="mt-6"><ClassicCarousel label={data.items.find((item) => item.category === category)!.categoryLabel} locale={site.locale}>
      {pagesOf(category).map((page, i) => <div key={i} className="grid w-full shrink-0 snap-start grid-cols-2 gap-5 lg:grid-cols-4">{page.map((item) => <article key={item.id} className="rounded-card border border-line/15 bg-bg-elevated p-4 shadow-sm"><a href={item.href}><div className="relative aspect-square bg-bg-tint"><MediaImage src={mediaSrc(item.images[0])} alt={t(item.images[0].alt)} sizes="(max-width:768px) 50vw, 25vw" className="!object-contain" /></div><h4 className="mt-4 font-bold leading-6">{item.name}</h4></a><div className="mt-3"><PriceTag price={item.price} salePrice={item.salePrice} /></div><ul className="mt-3 space-y-1 text-sm text-fg-muted">{item.specs.slice(0, 4).map((spec, i) => <li key={i}>{spec.label}: {spec.value}</li>)}</ul><p className="mt-3 text-xs text-fg-muted">{t(data.warrantyLabel)}: {item.warranty}</p></article>)}</div>)}
    </ClassicCarousel></div></div>)}
    {data.allLink && <SectionLink link={data.allLink} locale={site.locale} className="mt-8 inline-flex rounded-button bg-primary px-6 py-3 font-bold text-on-primary" />}
  </div></section>;
}
