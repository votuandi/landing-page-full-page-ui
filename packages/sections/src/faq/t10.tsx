import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { serializeJsonLd } from "../shared/jsonLd";
import { T10Head } from "../shared/t10";
import type { faq } from "./schema";

/** FAQ t10: danh sách `<details>` một cột, đường kẻ dưới mỗi câu; JSON-LD FAQPage. */
export default function FaqT10({ data, site, sectionId }: SectionPropsOf<typeof faq>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const items = data.items.map((item) => ({ question: t(item.question), answer: t(item.answer) }));
  return (
    <section aria-labelledby={`${sectionId}-title`} className="t15-section bg-bg-elevated">
      {data.jsonLd && <script type="application/ld+json">{serializeJsonLd({
        "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(({ question, answer }) => ({
          "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      })}</script>}
      <div className="t15-container">
        <T10Head id={`${sectionId}-title`} eyebrow={t(data.eyebrow)} title={t(data.title)} />
        <div className="max-w-4xl">
          {items.map((item, i) => (
            <details key={i} className="border-b border-line/15 py-5">
              <summary className="cursor-pointer pr-4 text-base font-bold leading-7 text-fg marker:text-primary">{item.question}</summary>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-fg-muted">{item.answer}</p>
            </details>
          ))}
          {data.moreLink && <SectionLink link={data.moreLink} locale={site.locale} className="mt-6 inline-flex min-h-11 items-center font-bold text-primary" />}
        </div>
      </div>
    </section>
  );
}
