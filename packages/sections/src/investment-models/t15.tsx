import { SectionHead } from "@solar/ui";
import { BanknotesIcon, CalendarDaysIcon, KeyIcon, BuildingLibraryIcon } from "@heroicons/react/24/outline";
import { pickLocale } from "../fields";
import type { SectionPropsOf } from "../define";
import type { investmentModels } from "./schema";
import { SectionLink } from "../render/SectionLink";

const icons = [BanknotesIcon, CalendarDaysIcon, KeyIcon, BuildingLibraryIcon];
export default function InvestmentModelsT15({ data, site, sectionId }: SectionPropsOf<typeof investmentModels>) {
  const t = (text: { vi: string; en?: string }) => pickLocale(text, site.locale);
  return <section className="t15-section bg-gradient-to-b from-bg to-bg-elevated" aria-labelledby={sectionId + "-title"}>
    <div className="t15-container">
      <SectionHead id={sectionId + "-title"} eyebrow={t(data.eyebrow)} title={t(data.title)} />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{data.models.map((model, i) => {
        const Icon = icons[i % icons.length];
        return <article key={model.id} className={"t15-card group flex flex-col p-6 transition motion-safe:hover:-translate-y-1.5 " + (model.highlight ? "bg-bg-tint" : "")}>
          <span className="grid h-12 w-12 place-items-center rounded-card bg-accent text-on-accent"><Icon aria-hidden className="h-6 w-6" /></span>
          <h3 className="mt-5 text-xl font-black text-fg">{t(model.title)}</h3>
          {model.badge && <div className="mt-1 text-sm font-bold text-accent-ink">{t(model.badge)}</div>}
          <p className="mt-3 text-sm text-fg-muted">{t(model.summary)}</p>
          <ul className="mt-4 grid gap-2 text-sm text-fg">{model.points.map((point, j) => <li key={j} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{t(point)}</li>)}</ul>
          {data.cta && <SectionLink link={data.cta} locale={site.locale} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-black text-primary" />}
        </article>;
      })}</div>
      {data.description && <p className="mt-4 text-xs text-fg-subtle">{t(data.description)}</p>}
    </div>
  </section>;
}
