import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import type { services } from "./schema";

/** Các nút kỹ thuật/giải pháp C&I hiện đồng thời, kể cả khi không có JavaScript. */
export default function ServicesT06({ data, site, sectionId }: SectionPropsOf<typeof services>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section bg-bg-tint" aria-labelledby={`${sectionId}-title`}>
    <div className="t15-container">
      <span className="t15-eyebrow">{t(data.eyebrow)}</span><h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title)}</h2>
      {data.description && <p className="t15-subheading">{t(data.description)}</p>}
      <ol className={`mt-10 grid gap-4 sm:grid-cols-2 ${data.items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {data.items.map((item, i) => <li key={item.id} className="rounded-card border border-line/15 bg-bg-elevated p-6">
          <span className="text-xs font-black text-secondary">{String(i + 1).padStart(2, "0")}</span>
          <h3 className="mt-7 text-xl font-black text-primary">{t(item.title)}</h3>
          <ul className="mt-4 grid gap-3 text-sm leading-7 text-fg-muted">{item.points.map((point, j) => <li key={j}>{t(point)}</li>)}</ul>
          {item.link && <SectionLink link={item.link} locale={site.locale} className="mt-6 inline-flex text-sm font-bold text-primary" />}
        </li>)}
      </ol>
    </div>
  </section>;
}
