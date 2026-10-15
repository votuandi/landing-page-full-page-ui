"use client";

import { PriceTag } from "@solar/ui";
import { formatMoneyShort } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { useSegment } from "../state/SiteState";
import { SectionLink } from "../render/SectionLink";
import type { packages } from "./schema";

export default function PackagesT04({ data, site, sectionId }: SectionPropsOf<typeof packages>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  const { segment, setSegment } = useSegment();
  const current = segment && data.segments.some((entry) => entry.segment === segment) ? segment : data.defaultSegment;
  const items = data.items.filter((entry) => entry.segment === current).slice(0, data.maxPerSegment);
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg-elevated py-20 text-fg"><div className="t15-container">
    <p className="text-xs font-black uppercase tracking-widest text-primary">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{t(data.title)}</h2>
    {data.segments.length > 1 && <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label={site.locale === "en" ? "Customer segment" : "Phân khúc"}>{data.segments.map((entry) => <button key={entry.segment} type="button" aria-pressed={entry.segment === current} onClick={() => setSegment(entry.segment, "packages")} className={entry.segment === current ? "rounded-button bg-primary px-5 py-3 font-bold text-on-primary" : "rounded-button border border-line/20 px-5 py-3 font-bold text-primary"}>{t(entry.label)}</button>)}</div>}
    <div className="mt-10 grid gap-5 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="flex flex-col rounded-card border border-line/15 bg-bg-tint p-7">
      <p className="text-xs font-bold uppercase text-fg-muted">{t(item.suitableFor)}</p><h3 className="mt-3 text-2xl font-black">{t(item.name)}</h3><p className="mt-2 text-sm text-fg-muted">{item.kwp} kWp</p><div className="mt-6"><PriceTag locale={site.locale} price={item.price} salePrice={item.salePrice} short className="text-3xl" /></div>
      {item.monthlySaving !== undefined && <p className="mt-3 text-sm font-bold text-primary">{t(data.savingLabel)}: {formatMoneyShort(item.monthlySaving, site.locale)}</p>}
      {item.popular && <p className="mt-3 text-sm font-bold text-primary">{t(data.popularLabel)}</p>}
      <ul className="mt-7 space-y-3 text-sm leading-7 text-fg-muted">{item.highlights.map((entry, i) => <li key={i}>✓ {t(entry)}</li>)}</ul>
      <SectionLink link={{ kind: "calculator", value: `phan-khuc=${item.segment}`, label: data.ctaLabel }} locale={site.locale} className="mt-auto inline-flex min-h-11 items-center justify-between border-t border-line/15 pt-5 font-black text-primary">{t(data.ctaLabel)} <span aria-hidden>→</span></SectionLink>
    </article>)}</div><p className="mt-6 text-sm leading-7 text-fg-muted">{t(data.footnote)}</p>
  </div></section>;
}
