import { SunIcon } from "@heroicons/react/24/outline";
import { formatNumber } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { packageSimulationFixture } from "../shared/packageSimulationFixture";
import type { hero } from "./schema";
import BillHero from "./t11.client";

export default function HeroT11({ data, site, sectionId }: SectionPropsOf<typeof hero>) {
  const t = (v: { vi: string; en?: string }) => pickLocale(v, site.locale);
  return <section className="border-b border-line bg-gradient-to-br from-bg via-bg to-bg-sky py-14 text-fg md:py-20">
    <div className="mx-auto grid max-w-container items-center gap-12 px-7 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
      <div>
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-primary"><SunIcon aria-hidden className="h-6 w-6" />{t(data.badge)}</p>
        <h1 className="my-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t(data.title.lead)} <span className="block text-primary">{t(data.title.highlight)}</span>
          <span className="mt-2 block text-2xl text-fg-muted">{t(data.title.sub)} {t(data.title.subHighlight)}</span></h1>
        <p className="max-w-xl text-lg leading-8 text-fg-muted">{t(data.description)}</p>
        <dl className="mt-9 grid grid-cols-3 gap-4 border-y border-line py-6">{data.stats.map((s, i) => <div key={i}>
          <dt className="text-xs text-fg-muted">{t(s.label)}</dt><dd className="mt-1 text-2xl font-semibold">{formatNumber(s.value, s.decimals)}{s.suffix} <span className="text-xs">{t(s.unit)}</span></dd>
        </div>)}</dl>
        {data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">{t(data.secondaryCta.label)}</SectionLink>}
      </div>
      <BillHero simulation={data.packageSimulation ?? packageSimulationFixture} locale={site.locale} sectionId={sectionId} ctaLabel={t(data.primaryCta.label)} />
    </div>
  </section>;
}
