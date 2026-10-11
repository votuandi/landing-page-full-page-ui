import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { leadForm } from "./schema";
import LeadForm from "./t15.client";

export default function LeadFormT05({ data, site, sectionId }: SectionPropsOf<typeof leadForm>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section border-t-8 border-secondary bg-primary text-on-primary" aria-labelledby={`${sectionId}-title`}>
    <div className="t15-container grid items-start gap-10 lg:grid-cols-[.8fr_1.2fr]">
      <div><h2 id={`${sectionId}-title`} className="text-4xl font-black tracking-tight">{t(data.title)}</h2><ul className="mt-6 grid gap-4 leading-8">{data.points.map((point, i) => <li key={i} className="border-l-4 border-accent pl-4">{t(point)}</li>)}</ul></div>
      <div className="rounded-card border border-line/15 bg-bg-elevated p-6 text-fg md:p-8">
        <h3 className="mb-5 text-xl font-black">{t(data.formTitle)}</h3>
        <LeadForm locale={site.locale} source={data.source} fields={data.fields} text={{ submit: t(data.submitLabel), success: t(data.successText), privacy: t(data.privacyNote), messageLabel: data.messageLabel && t(data.messageLabel), fallbackPhone: data.fallbackPhone }} />
      </div>
    </div>
  </section>;
}
