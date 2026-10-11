import { Battery50Icon, BoltIcon, SunIcon } from "@heroicons/react/24/outline";
import { formatNumber } from "@solar/core";
import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { hero } from "./schema";

const POSITIONS = ["right-2 top-8 sm:right-6 sm:top-16", "bottom-16 left-2 sm:bottom-28 sm:left-6", "bottom-2 right-2 sm:bottom-12 sm:right-6"];
const ICONS = [SunIcon, BoltIcon, Battery50Icon];

export default function HeroT07({ data, site, sectionId }: SectionPropsOf<typeof hero>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const cards = [data.outputCard, data.savingCard, data.co2Card];
  return <section aria-labelledby={`${sectionId}-title`} className="flex min-h-section flex-col justify-center bg-gradient-to-br from-bg-sky to-bg px-5 py-8 text-fg sm:px-7">
    <div className="mx-auto w-full max-w-[var(--container)]">
      <div className="grid items-center overflow-hidden rounded-media border border-line/40 bg-glass shadow-hero lg:grid-cols-[1fr_1.05fr]">
        <div data-reveal="left" className="relative z-10 px-6 py-10 sm:p-11">
          <p className="inline-flex items-center gap-2 rounded-pill border border-line bg-bg-elevated/70 px-3 py-2 text-xs font-semibold text-fg-muted"><span aria-hidden className="h-2 w-2 rounded-pill bg-success" />{t(data.badge)}</p>
          <h1 id={`${sectionId}-title`} className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t(data.title.lead)}<span className="block text-primary">{t(data.title.highlight)}</span><span className="block">{t(data.title.sub)} {t(data.title.subHighlight)}</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-fg-muted">{t(data.description)}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <SectionLink link={data.primaryCta} locale={site.locale} className="inline-flex min-h-12 items-center rounded-button bg-primary px-5 py-3 text-xs font-bold text-on-primary" />
            {data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="inline-flex min-h-12 items-center rounded-button border border-line bg-bg-elevated/70 px-5 py-3 text-xs font-bold text-fg" />}
          </div>
          <dl className="mt-9 grid grid-cols-3 gap-3 border-t border-line pt-6">{data.stats.map((stat, i) => <div key={i}><dt className="text-xs text-fg-muted">{t(stat.label)}</dt><dd className="mt-2 text-2xl font-extrabold">{formatNumber(stat.value, stat.decimals)}{stat.suffix} <span className="text-xs font-medium">{t(stat.unit)}</span></dd></div>)}</dl>
        </div>
        <div data-reveal="right" className="relative min-h-[380px] bg-gradient-to-br from-bg-sky to-bg-tint sm:min-h-[570px] lg:h-full">
          <MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} priority sizes="(max-width:1023px) 100vw, 55vw" className="!object-contain" />
          {cards.map((card, i) => { const Icon = ICONS[i]; return card && <div key={i} className={`absolute flex max-w-[70%] items-center gap-2 rounded-card border border-line/40 bg-glass p-3 shadow-float backdrop-blur-glass ${POSITIONS[i]}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-pill bg-accent-soft text-accent-ink"><Icon aria-hidden className="h-5 w-5" /></span>
            <div><span className="block text-2xs text-fg-muted">{t(card.label)}</span><strong className="block text-xl font-extrabold">{card.value} <small className="text-xs font-semibold">{card.unit && t(card.unit)}</small></strong></div>
          </div>; })}
        </div>
      </div>
      <p className="px-3 py-6 text-xs text-fg-muted">{t({ vi: "[DỮ LIỆU MẪU] Chỉ số vận hành minh họa; cấu hình thực tế tùy công trình.", en: "[SAMPLE DATA] Illustrative readings; actual configuration depends on the building." })}</p>
    </div>
  </section>;
}
