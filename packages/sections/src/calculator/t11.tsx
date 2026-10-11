import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { packageSimulationFixture } from "../shared/packageSimulationFixture";
import type { calculator } from "./schema";
import Calculator from "./t11.client";

export default function CalculatorT11({ data, site, sectionId }: SectionPropsOf<typeof calculator>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section className="bg-bg-tint py-section text-fg" aria-labelledby={`${sectionId}-title`}>
    <div className="mx-auto max-w-[var(--container)] px-7">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">02 · {t(data.eyebrow)}</p>
      <h2 id={`${sectionId}-title`} className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight sm:text-4xl">{t(data.title.lead)} {t(data.title.highlight)}</h2>
      <p className="mt-4 max-w-3xl leading-8 text-fg-muted">{t(data.description)}</p>
      <Calculator simulation={data.packageSimulation ?? packageSimulationFixture} locale={site.locale} sectionId={sectionId} data={data} />
    </div>
  </section>;
}
