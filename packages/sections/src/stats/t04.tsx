import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { stats } from "./schema";

export default function StatsT04({ data, site, sectionId }: SectionPropsOf<typeof stats>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={data.title ? `${sectionId}-title` : undefined} className="border-b border-line/15 bg-bg-elevated text-fg"><div className="t15-container">
    {data.eyebrow && <p className="pt-6 text-sm font-bold text-primary">{t(data.eyebrow)}</p>}{data.title && <h2 id={`${sectionId}-title`} className="pt-4 text-3xl font-black">{t(data.title)}</h2>}
    <dl className="grid grid-cols-2 lg:grid-cols-4">{data.items.map((item, i) => <div key={i} className="border-b border-r border-line/15 p-6 last:border-r-0 lg:border-b-0"><dd className="text-3xl font-black tracking-tight text-primary">{new Intl.NumberFormat(site.locale, { maximumFractionDigits: item.decimals }).format(item.value ?? Math.max(0, new Date().getFullYear() - item.sinceYear!))}{item.suffix && t(item.suffix)}</dd><dt className="mt-1 text-sm font-semibold text-fg-muted">{t(item.label)}</dt></div>)}</dl>
  </div></section>;
}
