import { SectionHead } from "@solar/ui";
import { pickLocale } from "../fields";
import type { SectionPropsOf } from "../define";
import type { warranty } from "./schema";

export default function WarrantyT15({ data, site, sectionId }: SectionPropsOf<typeof warranty>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section bg-bg" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container grid gap-12 lg:grid-cols-2">
      <div><SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={t(data.description)} />{data.footnote && <p className="mt-6 text-xs text-fg-subtle">{t(data.footnote)}</p>}</div>
      <dl className="t15-card h-fit overflow-hidden">{data.rows.map((row, i) => <div key={i} className="grid grid-cols-2 gap-4 border-b border-line/10 p-5 last:border-0">
        <dt><span className="font-black text-fg">{t(row.item)}</span>{row.note && <span className="mt-1 block text-xs text-fg-muted">{t(row.note)}</span>}</dt><dd className="text-right text-sm font-bold text-fg">{t(row.period)}</dd>
      </div>)}</dl>
    </div>
  </section>;
}
