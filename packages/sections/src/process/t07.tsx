import { ChartBarIcon, DevicePhoneMobileIcon, ShieldCheckIcon, SunIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { JourneyIllustration } from "../shared/illustrations/t07/SolarIllustrations";
import type { process } from "./schema";

const ICONS = [ChartBarIcon, SunIcon, WrenchScrewdriverIcon, ShieldCheckIcon, DevicePhoneMobileIcon];

export default function ProcessT07({ data, site, sectionId }: SectionPropsOf<typeof process>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="flex min-h-section flex-col justify-center bg-bg-elevated py-section text-fg">
    <div className="mx-auto w-full max-w-[var(--container)] px-6 sm:px-7">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div><p data-reveal="down" className="text-xs font-bold uppercase tracking-widest text-primary">{t(data.eyebrow)}</p><h2 data-reveal="left" id={`${sectionId}-title`} className="mt-4 whitespace-pre-line font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t(data.title)}</h2></div>
        <div data-reveal="right" className="mx-auto w-full max-w-md"><JourneyIllustration /></div>
      </div>
      <div aria-hidden className="mt-10 hidden items-center justify-between border-t-2 border-line px-16 lg:flex">{data.steps.map((_, i) => <span key={i} className="-mt-2 h-3 w-3 rounded-pill border-2 border-primary bg-bg-elevated" />)}</div>
      <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{data.steps.map((step, i) => { const Icon = ICONS[i % ICONS.length]; return <li key={i} data-reveal={i % 2 ? "down" : "up"} className="flex flex-col rounded-card border border-line bg-bg-tint p-5">
        <span aria-hidden className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-card bg-bg-elevated text-primary"><Icon className="h-6 w-6" /></span><span className="text-sm font-bold text-fg-subtle">{String(i + 1).padStart(2, "0")}</span></span>
        <h3 className="mt-5 text-lg font-bold">{t(step.title)}</h3><p className="mt-3 text-sm leading-6 text-fg-muted">{t(step.description)}</p>
        <div className="mt-auto pt-6"><p className="rounded-card bg-bg-elevated p-3 text-xs font-semibold leading-5"><span className="mb-1 block text-primary">{t(data.outputLabel)}</span>{t(step.output)}</p></div>
      </li>; })}</ol>
    </div>
  </section>;
}
