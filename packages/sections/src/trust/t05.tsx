import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { MediaImage } from "@solar/ui";
import { mediaSrc } from "../shared/media";
import type { trust } from "./schema";

export default function TrustT05({ data, site, sectionId }: SectionPropsOf<typeof trust>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section bg-bg-sun" aria-labelledby={`${sectionId}-title`}>
    <div className="t15-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
      <div><span className="t15-eyebrow">{t(data.eyebrow)}</span><h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title)}</h2>{data.description && <p className="t15-subheading">{t(data.description)}</p>}</div>
      <div className="grid gap-4">{data.items.map((item) => <article key={item.id} className="rounded-card border border-line/15 bg-bg-elevated p-5">
        <h3 className="text-xl font-black text-primary">{t(item.title)}</h3><p className="mt-2 text-sm text-fg-muted">{t(item.subtitle)}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">{[[data.issuerLabel, item.issuer], [data.numberLabel, item.number], [data.validLabel, item.validUntil], [data.scopeLabel, item.scope]].map(([label, value], i) => <div key={i}><dt className="font-bold text-fg-muted">{t(label)}</dt><dd className="mt-1 leading-7">{t(value)}</dd></div>)}</dl>
        <div className="mt-4 flex flex-wrap gap-3">{[item.logo, item.image].map((image, i) => image && <div key={i} className="relative h-24 w-40 overflow-hidden rounded-media"><MediaImage src={mediaSrc(image)} alt={t(image.alt)} sizes="160px" className="object-contain" /></div>)}</div>
      </article>)}</div>
    </div>
  </section>;
}
