import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { serializeJsonLd } from "../shared/jsonLd";
import type { faq } from "./schema";

export default function FaqT02({ data, site, sectionId }: SectionPropsOf<typeof faq>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  const items = data.items.map((item) => ({ question: t(item.question), answer: t(item.answer) }));
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg-elevated py-20 text-fg"><div className="t15-container">
    {data.jsonLd && <script type="application/ld+json">{serializeJsonLd({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) })}</script>}
    <p className="text-xs font-bold uppercase tracking-widest text-primary">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-5 text-3xl font-bold md:text-4xl">{t(data.title)}</h2>
    <div className="mt-10 max-w-4xl">{items.map((item, i) => <details key={i} className="group border-b border-line/20"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-6 text-lg font-semibold">{item.question}<span aria-hidden className="text-2xl text-primary group-open:rotate-45">+</span></summary><p className="pb-6 text-sm leading-8 text-fg-muted">{item.answer}</p></details>)}</div>
    {data.moreLink && <SectionLink link={data.moreLink} locale={site.locale} className="mt-6 inline-flex min-h-11 items-center font-bold text-primary" />}
  </div></section>;
}
