import { SectionHead } from "@solar/ui";
import { pickLocale } from "../fields";
import type { SectionPropsOf } from "../define";
import type { dealer } from "./schema";
import { mediaSrc } from "../shared/media";
import Dealer from "./t15.client";

export default function DealerT15({ data, site, sectionId }: SectionPropsOf<typeof dealer>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-invert t15-section relative overflow-hidden t15-ocean text-fg" aria-labelledby={sectionId + "-title"}>
    <div aria-hidden className="pointer-events-none absolute -left-32 top-0 h-[520px] w-[520px] rounded-full bg-glow-accent-18" />
    <div className="t15-container relative">
      <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} desc={t(data.description)} />
      <dl className="mt-10 grid grid-cols-3 gap-3 sm:gap-5">{data.stats.map((stat, i) => <div key={i} className="t15-glass-dark flex flex-col-reverse rounded-card p-4 text-center sm:p-6">
        <dt className="mt-1 text-xs font-semibold text-fg-muted sm:text-sm">{t(stat.label)}</dt>
        <dd className="text-3xl font-black tabular-nums text-accent-ink sm:text-5xl">{new Intl.NumberFormat(site.locale).format(stat.value)}{stat.suffix && t(stat.suffix)}</dd>
      </div>)}</dl>
      <Dealer sectionId={sectionId} locale={site.locale} policyTab={t(data.policyTab)} faqTab={t(data.faqTab)}
        policies={data.policies.map((p) => ({ title: t(p.title), body: t(p.body) }))}
        faqs={data.faqs.map((f) => ({ question: t(f.question), answer: t(f.answer) }))}
        gallery={data.gallery.map((g) => ({ title: t(g.title), src: mediaSrc(g.image), alt: t(g.image.alt) }))}
        form={{ title: t(data.form.title), description: data.form.description && t(data.form.description), businessTypes: data.form.businessTypes.map(t), submitLabel: t(data.form.submitLabel), successTitle: t(data.form.successTitle), successMessage: t(data.form.successMessage) }} />
    </div>
  </section>;
}
