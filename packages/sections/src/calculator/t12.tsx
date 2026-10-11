import { CalculatorIcon } from "@heroicons/react/24/outline";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { calculator } from "./schema";
import Calculator from "./t12.client";

export default function CalculatorT12({ data, site, sectionId }: SectionPropsOf<typeof calculator>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="t15-section relative overflow-hidden bg-gradient-to-b from-bg-tint to-bg">
    <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-glow-accent-18" />
    <div className="t15-container relative">
      <div data-reveal="down" className="max-w-3xl">
        <span className="t15-eyebrow"><CalculatorIcon aria-hidden className="h-4 w-4" />{t(data.eyebrow)}</span>
        <h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title.lead)} {t(data.title.highlight)}</h2>
        <p className="t15-subheading">{t(data.description)}</p>
      </div>
      <Calculator data={data} locale={site.locale} sectionId={sectionId} layout="wizard" />
    </div>
  </section>;
}
