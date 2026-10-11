import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { process } from "./schema";

export default function ProcessT05({ data, site, sectionId }: SectionPropsOf<typeof process>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section bg-primary text-on-primary" aria-labelledby={`${sectionId}-title`}>
    <div className="t15-container">
      <span className="text-xs font-black uppercase tracking-widest text-accent">{t(data.eyebrow)}</span><h2 id={`${sectionId}-title`} className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{t(data.title)}</h2>
      <ol className={`mt-12 grid gap-4 sm:grid-cols-2 ${data.steps.length > 5 ? "lg:grid-cols-3" : "lg:grid-cols-5"}`}>{data.steps.map((step, i) => <li key={i} className="flex flex-col rounded-card border border-on-primary/20 p-6">
        <span className="text-sm font-black text-accent">{String(i + 1).padStart(2, "0")}</span><h3 className="mt-8 text-xl font-black">{t(step.title)}</h3><p className="mt-3 text-sm leading-6">{t(step.description)}</p>
        <div className="mt-auto pt-6"><div className="border-t border-on-primary/20 pt-4 text-xs font-bold leading-6"><span className="block text-accent">{t(data.outputLabel)}</span>{t(step.output)}</div></div>
      </li>)}</ol>
    </div>
  </section>;
}
