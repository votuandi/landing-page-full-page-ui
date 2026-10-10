import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { process } from "./schema";

const DOTS = ["bg-leaf", "bg-sky", "bg-accent", "bg-primary", "bg-secondary"];
export default function ProcessT15({ data, site, sectionId }: SectionPropsOf<typeof process>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section className="t15-section relative overflow-hidden bg-bg-tint" aria-labelledby={`${sectionId}-title`}>
    <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 opacity-60" />
    <div className="t15-container relative">
      <div data-reveal="down" className="max-w-3xl"><span className="t15-eyebrow">{t(data.eyebrow)}</span><h2 id={`${sectionId}-title`} className="t15-heading">{t(data.title)}</h2></div>
      <div className="relative mt-12">
        <div aria-hidden className="t15-energy-line absolute left-[10%] right-[10%] top-7 hidden h-1 rounded-full lg:block" />
        <ol data-reveal-stagger="up" data-reveal-step="0.12" className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data.steps.map((step, i) => <li key={i} className="t15-card t15-card-hover flex flex-col p-6">
            <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-bg-elevated text-lg font-black text-fg shadow-lg ring-1 ring-line/10">{String(i + 1).padStart(2, "0")}<span aria-hidden className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full ring-4 ring-bg-elevated ${DOTS[i % DOTS.length]}`} /></span>
            <h3 className="mt-5 text-xl font-black text-fg">{t(step.title)}</h3>
            <p className="mt-2 text-sm leading-6 text-fg-muted">{t(step.description)}</p>
            <div className="mt-auto pt-6"><div className="rounded-2xl bg-bg-tint p-3 text-xs font-bold leading-5 text-fg"><span className="mb-1 block text-4xs uppercase tracking-[.16em] text-primary">{t(data.outputLabel)}</span>{t(step.output)}</div></div>
          </li>)}
        </ol>
      </div>
    </div>
  </section>;
}
