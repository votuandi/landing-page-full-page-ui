import { ArrowRightIcon, Battery100Icon, BoltIcon, CpuChipIcon, LightBulbIcon, SunIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { MediaImage, delay } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { hero } from "./schema";
import HeroStats from "./t15.client";

const ICONS = { sun: SunIcon, cpu: CpuChipIcon, battery: Battery100Icon, light: LightBulbIcon };
const TONES = { accent: "bg-accent text-on-accent", secondary: "bg-secondary text-on-secondary", primary: "bg-primary text-on-primary", leaf: "bg-leaf text-on-accent" };
const SLOTS = [
  "right-[-2%] top-[22%] sm:right-[2%] t15-float",
  "right-[-4%] top-[44%] sm:right-[-6%] t15-float-delay",
  "right-0 top-[66%] sm:right-[4%] t15-float-slow",
  "right-[2%] top-[84%] hidden sm:flex t15-float",
];
const BARS = [22, 35, 48, 66, 82, 100, 92, 74, 55, 34];

/** HeroT8 from template-12: underlined title, concentric rings, arch and floating chips. */
export default function HeroT12({ data, site }: SectionPropsOf<typeof hero>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const { outputCard, savingCard, co2Card } = data;
  const src = mediaSrc(data.image);
  const focal = data.image.focal;
  return <section className="t15-screen relative isolate overflow-hidden !min-h-[calc(100svh-5rem)] bg-gradient-to-br from-bg via-bg-elevated to-bg-tint">
    <div aria-hidden className="pointer-events-none absolute -right-40 top-10 -z-10 h-[680px] w-[680px] rounded-full bg-glow-primary-25" />
    <div aria-hidden className="pointer-events-none absolute right-[18%] -top-24 -z-10 h-[360px] w-[360px] rounded-full bg-glow-accent-22" />
    <div className="t15-container grid items-center gap-10 pb-14 pt-12 lg:grid-cols-[1fr_1.02fr] lg:gap-6 lg:py-10">
      <div className="relative z-10">
        <div data-hero="down" className="inline-flex items-center gap-2 rounded-pill border border-glass-border bg-glass py-1.5 pl-1.5 pr-4 text-xs font-bold text-fg-muted shadow-sm backdrop-blur">
          <span className="grid h-6 w-6 place-items-center rounded-pill bg-accent text-on-accent"><SunIcon aria-hidden className="h-4 w-4" /></span>{t(data.badge)}
        </div>
        <h1 data-hero="left" style={delay(0.1)} className="mt-6 max-w-2xl text-display-md font-black leading-[1.05] tracking-[-.045em] text-fg sm:text-6xl lg:text-display-xl">
          {t(data.title.lead)} <span className="relative text-primary">{t(data.title.highlight)}
            <svg aria-hidden viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-2.5 w-full text-accent"><path d="M2 10 C 50 2, 150 2, 198 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg>
          </span> {t(data.title.sub)} {t(data.title.subHighlight)}
        </h1>
        <p data-hero="left" style={delay(0.22)} className="mt-7 max-w-xl text-base leading-8 text-fg-muted sm:text-lg">{t(data.description)}</p>
        <div data-hero="up" style={delay(0.34)} className="mt-9 flex flex-wrap gap-3">
          <SectionLink link={data.primaryCta} locale={site.locale} className="t15-button t15-button-accent shadow-lg">{t(data.primaryCta.label)}<ArrowRightIcon aria-hidden className="h-4 w-4" /></SectionLink>
          {data.secondaryCta && <SectionLink link={data.secondaryCta} locale={site.locale} className="t15-button t15-button-secondary">{t(data.secondaryCta.label)}</SectionLink>}
        </div>
        {data.rating && <a href={data.rating.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex gap-2 text-sm font-bold text-fg-muted">{data.rating.score}/5 · {data.rating.count} {t(data.rating.label)}</a>}
        <HeroStats stats={data.stats.map((stat) => ({ value: stat.value, decimals: stat.decimals, suffix: stat.suffix, unit: t(stat.unit), label: t(stat.label) }))} />
      </div>
      <div className="relative mx-auto h-[460px] w-full max-w-[600px] sm:h-[580px]">
        <div aria-hidden className="absolute left-1/2 top-[54%] h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/12" />
        <div aria-hidden className="absolute left-1/2 top-[54%] h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" />
        <div aria-hidden className="absolute left-1/2 top-[54%] h-[66%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow-primary-25" />
        {["left-[8%] top-[18%]", "right-[10%] top-[8%]", "left-[14%] bottom-[16%]", "right-[22%] bottom-[6%]"].map((pos) => <span key={pos} aria-hidden className={`absolute h-2 w-2 rounded-full bg-accent shadow-lg ${pos}`} />)}
        <div data-hero="up" style={delay(0.15)} className="absolute bottom-0 left-[12%] h-[90%] w-[60%] overflow-hidden rounded-b-media rounded-t-full border-6 border-glass-tint/15 bg-bg-tint shadow-hero">
          {src ? <Image src={src} alt={t(data.image.alt)} fill priority className="object-cover" style={{ objectPosition: focal ? `${focal.x * 100}% ${focal.y * 100}%` : "72% center" }} sizes="(max-width:1024px) 70vw, 360px" /> : <MediaImage alt={t(data.image.alt)} priority sizes="360px" />}
          <div className="absolute inset-0 bg-gradient-to-t from-scrim/55 via-transparent to-glass-tint/10" />
        </div>
        <div aria-hidden data-reveal="zoom" style={delay(0.6)} className="pointer-events-none absolute inset-0 text-on-media">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M48 30 C 60 28, 66 27, 74 27" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <path d="M60 52 C 66 50, 70 49, 76 49" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <path d="M52 74 C 60 72, 66 71, 72 71" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="t15-hotspot absolute left-[48%] top-[30%] -translate-x-1/2 -translate-y-1/2" />
          <span className="t15-hotspot absolute left-[60%] top-[52%] -translate-x-1/2 -translate-y-1/2" />
          <span className="t15-hotspot absolute left-[52%] top-[74%] -translate-x-1/2 -translate-y-1/2" />
        </div>
        {data.chips.map((chip, i) => { const Icon = ICONS[chip.icon]; return <div key={i} data-reveal="right" style={delay(0.45 + i * 0.15)} className={`absolute flex items-center ${SLOTS[i]}`}>
          <span className={`relative z-10 grid h-11 w-11 place-items-center rounded-pill border-4 border-bg-elevated/80 shadow-lg ${TONES[chip.tone]}`}><Icon aria-hidden className="h-5 w-5" /></span>
          <span className="t15-glass -ml-3 rounded-pill py-2.5 pl-6 pr-5 text-xs font-black text-fg sm:text-sm">{t(chip.label)}</span>
        </div>; })}
        {outputCard && <div data-reveal="down" style={delay(0.5)} className="t15-glass t15-float-slow absolute left-0 top-[6%] hidden w-52 rounded-card p-4 sm:block">
          <div className="flex items-center justify-between text-2xs font-bold uppercase tracking-widest text-fg-muted">{t(outputCard.label)}<span className="flex items-center gap-1 text-success"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success motion-safe:animate-pulse" />{outputCard.liveLabel}</span></div>
          <div className="mt-2 text-2xl font-black text-fg">{outputCard.value} {outputCard.unit && <span className="text-sm font-bold text-fg-subtle">{t(outputCard.unit)}</span>}</div>
          <div aria-hidden className="mt-3 flex h-10 items-end gap-1">{BARS.map((height, i) => <span key={i} className="flex-1 rounded-pill bg-gradient-to-t from-primary to-accent" style={{ height: `${height}%`, opacity: 0.45 + height / 200 }} />)}</div>
        </div>}
        {savingCard && <div data-reveal="left" style={delay(0.7)} className="t15-glass t15-float absolute bottom-[10%] left-[-2%] rounded-card p-4 sm:left-0">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-input bg-accent text-on-accent"><BoltIcon aria-hidden className="h-5 w-5" /></span>
            <div><div className="text-2xs font-bold uppercase tracking-widest text-fg-muted">{t(savingCard.label)}</div><div className="text-xl font-black text-fg">{savingCard.value}{savingCard.unit && <span className="ml-1 text-xs font-semibold text-fg-subtle">{t(savingCard.unit)}</span>}</div></div>
          </div>
        </div>}
        {co2Card && <div data-reveal="up" style={delay(0.85)} className="t15-float-delay absolute bottom-[3%] right-[2%] hidden rounded-input border border-glass-strong-border bg-scrim/60 px-4 py-3 text-on-media backdrop-blur-xl sm:block">
          <div className="text-2xs font-semibold text-on-media/75">{t(co2Card.label)}</div><div className="text-lg font-black">{co2Card.value} {co2Card.unit && t(co2Card.unit)}</div>
        </div>}
      </div>
    </div>
  </section>;
}
