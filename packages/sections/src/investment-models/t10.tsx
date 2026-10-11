import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { T10, T10Head } from "../shared/t10";
import type { investmentModels } from "./schema";

/** "Nhãn: nội dung" → cặp dt/dd như bảng điều kiện của template-10; không có dấu hai chấm → chỉ nội dung. */
const split = (text: string) => {
  const at = text.indexOf(": ");
  return at > 0 ? [text.slice(0, at), text.slice(at + 2)] : ["", text];
};

/** Investment models t10 (Finance): ba thẻ, thẻ nổi bật nền sky; điểm dạng "Nhãn: nội dung"; `summary` là ghi chú cuối thẻ. */
export default function InvestmentModelsT10({ data, site, sectionId }: SectionPropsOf<typeof investmentModels>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return (
    <section aria-labelledby={`${sectionId}-title`} className="t15-section">
      <div className="t15-container">
        <T10Head id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} />
        <div data-reveal-stagger="up" className="grid gap-5 md:grid-cols-3">
          {data.models.map((model, i) => (
            <article key={model.id} className={`${T10.card} p-7 ${model.highlight ? "border-primary/30 bg-bg-sky/70" : ""}`}>
              <p className="text-sm font-black text-primary-strong">{model.badge ? t(model.badge) : String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-4 text-2xl font-black text-fg">{t(model.title)}</h3>
              <dl className="mt-6 space-y-5">
                {model.points.map((point, j) => {
                  const [label, value] = split(t(point));
                  return (
                    <div key={j}>
                      {label && <dt className="text-xs font-bold uppercase tracking-wider text-fg-muted">{label}</dt>}
                      <dd className="mt-1 text-sm leading-7 text-fg">{value}</dd>
                    </div>
                  );
                })}
              </dl>
              <p className="mt-5 border-t border-line/15 pt-4 text-xs leading-6 text-fg-muted">{t(model.summary)}</p>
            </article>
          ))}
        </div>
        {data.description && <p className="mt-5 text-sm text-fg-muted">{t(data.description)}</p>}
        {data.cta && <SectionLink link={data.cta} locale={site.locale} className={`${T10.button} ${T10.primary} mt-6`} />}
      </div>
    </section>
  );
}
