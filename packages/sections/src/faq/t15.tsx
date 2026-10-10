import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { serializeJsonLd } from "../shared/jsonLd";
import type { faq } from "./schema";

export default function FaqT15({ data, site, sectionId }: SectionPropsOf<typeof faq>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const items = data.items.map((item) => ({ question: t(item.question), answer: t(item.answer) }));
  return <section className="t15-section bg-bg" aria-labelledby={`${sectionId}-title`}>
    {data.jsonLd && <script type="application/ld+json">{serializeJsonLd({
      "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(({ question, answer }) => ({
        "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    })}</script>}
    <div className="t15-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
      <div data-reveal="left" className="lg:sticky lg:top-28 lg:self-start">
        <span className="t15-eyebrow">{t(data.eyebrow)}</span>
        <h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title)}</h2>
        {data.moreLink && <SectionLink link={data.moreLink} locale={site.locale} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-primary hover:gap-3" />}
      </div>
      <div data-reveal-stagger="right" data-reveal-step="0.06" className="grid gap-3">
        {items.map(({ question, answer }, i) => <details key={i} className="t15-card group px-6 py-5 open:border-primary/30">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-black text-fg">{question}
            <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-lg text-primary transition group-open:rotate-45 group-open:bg-accent group-open:text-on-accent">+</span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-fg-muted">{answer}</p>
        </details>)}
      </div>
    </div>
  </section>;
}
