import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import type { investmentModels } from "./schema";

export default function InvestmentModelsT05({ data, site, sectionId }: SectionPropsOf<typeof investmentModels>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section bg-bg-tint" aria-labelledby={`${sectionId}-title`}>
    <div className="t15-container">
      <span className="t15-eyebrow">{t(data.eyebrow)}</span><h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title)}</h2>
      <div className="mt-10 overflow-x-auto rounded-card border border-line/15 bg-bg-elevated" role="region" aria-labelledby={`${sectionId}-title`} tabIndex={0}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <caption className="sr-only">{t(data.title)}</caption>
          <thead className="bg-primary text-on-primary"><tr>{data.models.map((model) => <th key={model.id} scope="col" className="p-5 text-lg font-black">{t(model.title)}{model.badge && <span className="mt-2 block text-xs text-accent">{t(model.badge)}</span>}</th>)}</tr></thead>
          <tbody><tr>{data.models.map((model) => <td key={model.id} className={`border-t border-line/15 p-5 font-bold ${model.highlight ? "bg-bg-sun" : ""}`}>{t(model.summary)}</td>)}</tr>
            <tr>{data.models.map((model) => <td key={model.id} className={`border-t border-line/15 p-5 align-top ${model.highlight ? "bg-bg-sun" : ""}`}><ul className="grid gap-3 text-fg-muted">{model.points.map((point, i) => <li key={i}>{t(point)}</li>)}</ul></td>)}</tr></tbody>
        </table>
      </div>
      {data.description && <p className="mt-4 text-sm leading-7 text-fg-muted">{t(data.description)}</p>}
      {data.cta && <SectionLink link={data.cta} locale={site.locale} className="mt-6 inline-flex rounded-button bg-primary px-5 py-3 font-bold text-on-primary" />}
    </div>
  </section>;
}
