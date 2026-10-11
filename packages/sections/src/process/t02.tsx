import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { process } from "./schema";

export default function ProcessT02({ data, site, sectionId }: SectionPropsOf<typeof process>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="bg-primary py-20 text-on-primary"><div className="t15-container">
    <p className="text-xs font-bold uppercase tracking-widest">{t(data.eyebrow)}</p><h2 id={`${sectionId}-title`} className="mt-5 max-w-3xl text-3xl font-bold md:text-4xl">{t(data.title)}</h2>
    <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{data.steps.map((step, i) => <li key={i}><div className="mb-6 border-b border-on-primary/25 pb-6 text-3xl font-bold">{String(i + 1).padStart(2, "0")}</div><h3 className="text-lg font-bold">{t(step.title)}</h3><p className="mt-3 text-sm leading-7">{t(step.description)}</p>{t(step.output) && <p className="mt-3 text-sm font-semibold">{t(data.outputLabel)}: {t(step.output)}</p>}</li>)}</ol>
  </div></section>;
}
