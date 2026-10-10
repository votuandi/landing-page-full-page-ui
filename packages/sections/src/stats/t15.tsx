import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { stats } from "./schema";
import Stats from "./t15.client";

export default function StatsT15({ data, site, sectionId }: SectionPropsOf<typeof stats>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-invert relative overflow-hidden t15-ocean py-16 text-fg md:py-20" aria-labelledby={data.title ? `${sectionId}-title` : undefined}>
    <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-glow-accent-30" />
    <div className="t15-container relative">{data.eyebrow && <span className="t15-eyebrow">{t(data.eyebrow)}</span>}{data.title && <h2 id={`${sectionId}-title`} className="t15-heading mb-8">{t(data.title)}</h2>}
      <Stats locale={site.locale} items={data.items.map((item) => ({ value: item.value ?? Math.max(0, new Date().getFullYear() - item.sinceYear!), decimals: item.decimals, suffix: item.suffix ? t(item.suffix) : "", label: t(item.label) }))} />
    </div>
  </section>;
}
