import { MediaImage } from "@solar/ui";
import { SunIcon } from "@heroicons/react/24/outline";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { hero } from "./schema";

export default function HeroT02({ data, site, sectionId }: SectionPropsOf<typeof hero>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="bg-bg py-7 pb-14 text-fg">
    <div className="t15-container grid items-center gap-12 lg:grid-cols-2">
      <div className="py-8 lg:py-12"><p className="text-xs font-bold uppercase tracking-widest text-primary">{t(data.badge)}</p>
        <h1 id={`${sectionId}-title`} className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t(data.title.lead)}<br /><span className="text-primary">{t(data.title.highlight)}</span>{t(data.title.sub) && <><br />{t(data.title.sub)} <span className="text-primary">{t(data.title.subHighlight)}</span></>}</h1>
        <p className="mt-7 max-w-lg leading-8 text-fg-muted">{t(data.description)}</p>
        <div className="mt-8 flex flex-wrap items-center gap-6"><SectionLink link={data.primaryCta} locale={site.locale} className="rounded-button bg-primary px-6 py-4 font-bold text-on-primary" />{data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="font-bold text-primary" />}</div>
        <div className="mt-10 flex items-center gap-4 border-t border-line/20 pt-6"><SunIcon aria-hidden className="h-11 w-11 shrink-0 rounded-pill bg-accent p-2 text-on-accent" /><p className="text-sm leading-6 text-fg-muted">{t(data.image.alt)}</p></div>
      </div>
      <div className="relative h-[420px] overflow-hidden rounded-media bg-bg-tint lg:h-[555px]">
        <MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} priority sizes="(max-width:1024px) 100vw, 50vw" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/90 to-transparent p-8 pt-20 text-on-media"><p className="text-xs font-bold uppercase tracking-widest">{t(data.badge)}</p><p className="mt-3 text-3xl font-bold">{t(data.title.highlight)}</p></div>
      </div>
    </div>
    {data.chips.length > 0 && <ul className="t15-container mt-12 grid grid-cols-2 bg-accent text-on-accent lg:grid-cols-4">{data.chips.map((chip, i) => <li key={i} className="px-4 py-6 text-center text-sm font-semibold">{t(chip.label)}</li>)}</ul>}
  </section>;
}
