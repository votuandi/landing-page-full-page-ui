import { normalizeVnPhone } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { T10, T10_GLOW } from "../shared/t10";
import type { leadForm } from "./schema";
import LeadForm from "./t15.client";

/** Lead form t10 (ContactSection): cột chữ + hotline lớn bên trái, thẻ form bên phải, nền quầng sky/mint. */
export default function LeadFormT10({ data, site, sectionId }: SectionPropsOf<typeof leadForm>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const titleId = `${sectionId}-title`;
  return (
    <section aria-labelledby={titleId} className="t15-section" style={T10_GLOW}>
      <div className="t15-container grid gap-9 lg:grid-cols-[.85fr_1.15fr]">
        <div data-reveal="up">
          <p className={T10.eyebrow}>{t(data.formTitle)}</p>
          <h2 id={titleId} className={T10.heading}>{t(data.title)}</h2>
          {data.points.map((point, i) => <p key={i} className={T10.sub}>{t(point)}</p>)}
          {data.fallbackPhone && (
            <a href={`tel:${normalizeVnPhone(data.fallbackPhone)}`} className="mt-8 inline-flex min-h-11 items-center text-2xl font-black text-primary-strong">{data.fallbackPhone}</a>
          )}
          <p className="mt-4 text-xs leading-6 text-fg-muted">{t(data.privacyNote)}</p>
        </div>
        <div data-reveal="up" className={`${T10.card} p-6 sm:p-8`}>
          <LeadForm locale={site.locale} source={data.source} fields={data.fields} text={{
            submit: t(data.submitLabel), success: t(data.successText), privacy: t(data.privacyNote),
            messageLabel: data.messageLabel && t(data.messageLabel), fallbackPhone: data.fallbackPhone,
          }} />
        </div>
      </div>
    </section>
  );
}
