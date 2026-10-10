import Image from "next/image";
import { ArrowRightIcon, Battery100Icon, BoltIcon, CpuChipIcon, LightBulbIcon, PlayIcon, SunIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { MediaImage, delay } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { SectionLink } from "../render/SectionLink";
import { mediaSrc } from "../shared/media";
import type { hero } from "./schema";
import HeroStats from "./t15.client";

const ICONS = { sun: SunIcon, cpu: CpuChipIcon, battery: Battery100Icon, light: LightBulbIcon } as const;
const TONES = {
  accent: "bg-accent text-on-accent",
  secondary: "bg-secondary text-on-secondary",
  primary: "bg-primary text-on-primary",
  leaf: "bg-leaf text-on-accent",
} as const;
// Vị trí + nhịp nổi của chip theo thứ tự (chip 4 ẩn trên mobile).
const CHIP_SLOTS = [
  "right-[-3%] top-[14%] t15-float",
  "right-[-6%] top-[33%] t15-float-delay",
  "right-[-2%] top-[52%] t15-float-slow",
  "right-[2%] top-[71%] t15-float hidden sm:flex",
];
const BARS = [22, 35, 48, 66, 82, 100, 92, 74, 55, 34];

/** Hero t15 "Fresh Energy": chữ lớn gradient, CTA dự toán, số liệu đếm, ảnh vòm + mặt trời xoay + thẻ dữ liệu nổi. */
export default function HeroT15({ data, site }: SectionPropsOf<typeof hero>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const src = mediaSrc(data.image);
  const focal = data.image.focal;
  const { rating, outputCard, savingCard, co2Card } = data;
  return (
    <section className="t15-screen relative isolate overflow-hidden !min-h-[calc(100svh-7.5rem)] bg-gradient-to-b from-bg-tint to-bg">
      <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-glow-leaf-22" />

      <div className="t15-container grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:py-12">
        <div className="relative z-10">
          <div data-hero="down" className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-bg-elevated/80 py-1.5 pl-1.5 pr-4 text-2xs font-bold text-fg-muted shadow-sm backdrop-blur sm:text-xs">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-on-primary"><BoltIcon aria-hidden className="h-4 w-4" /></span>
            {t(data.badge)}
          </div>
          <h1 data-hero="left" style={delay(0.1)} className="mt-6 max-w-2xl text-display-md font-black leading-[1.06] tracking-[-.045em] text-fg sm:text-6xl lg:text-display-xl">
            {t(data.title.lead)}{" "}
            <span className="t15-gradient-text">{t(data.title.highlight)}</span>
            <span className="mt-2 block text-display-relative font-black leading-[1.15] tracking-[-.03em] text-fg-muted">
              {t(data.title.sub)}{" "}
              <span className="t15-marker text-fg">{t(data.title.subHighlight)}</span>
            </span>
          </h1>
          <p data-hero="left" style={delay(0.22)} className="mt-6 max-w-xl text-base leading-8 text-fg-muted sm:text-lg">{t(data.description)}</p>
          <div data-hero="up" style={delay(0.34)} className="mt-8 flex flex-wrap items-center gap-3">
            <SectionLink link={data.primaryCta} locale={site.locale} className="t15-button t15-button-accent min-h-12 text-base">
              {t(data.primaryCta.label)} <ArrowRightIcon aria-hidden className="h-4 w-4" />
            </SectionLink>
            {data.secondaryCta && (
              <SectionLink link={data.secondaryCta} locale={site.locale} className="t15-button t15-button-secondary min-h-12 text-base">
                <PlayIcon aria-hidden className="h-4 w-4 text-primary" />{t(data.secondaryCta.label)}
              </SectionLink>
            )}
          </div>
          {rating && rating.score > 0 && (
            <a data-hero="up" style={delay(0.42)} href={rating.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-fg-muted hover:text-fg">
              <span className="flex text-accent" aria-hidden>{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} className="h-4 w-4" />)}</span>
              <span><strong className="text-fg">{String(rating.score).replace(".", ",")}/5</strong> · {rating.count} {t(rating.label)}</span>
            </a>
          )}
          {data.stats.length > 0 && (
            <HeroStats stats={data.stats.map((stat) => ({ value: stat.value, decimals: stat.decimals, suffix: stat.suffix, unit: t(stat.unit), label: t(stat.label) }))} />
          )}
        </div>

        <div className="relative mx-auto h-[460px] w-full max-w-[600px] sm:h-[600px]">
          <div aria-hidden className="absolute right-[2%] top-[-2%] h-[46%] w-[46%]">
            <svg viewBox="0 0 200 200" className="t15-spin-slow h-full w-full text-accent">
              {Array.from({ length: 18 }, (_, i) => <rect key={i} x="98" y="4" width="4" height="26" rx="2" fill="currentColor" opacity=".55" transform={`rotate(${i * 20} 100 100)`} />)}
            </svg>
            <span className="absolute inset-[22%] rounded-full bg-sun-disc shadow-sun" />
          </div>
          <div aria-hidden className="absolute left-1/2 top-[55%] h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/20" />
          <div aria-hidden className="absolute left-1/2 top-[55%] h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary/15" />

          <div data-hero="up" style={delay(0.15)} className="absolute bottom-0 left-[10%] h-[88%] w-[62%] overflow-hidden rounded-b-hero rounded-t-full border-6 border-bg-elevated bg-bg-tint shadow-hero">
            {src
              ? <Image src={src} alt={t(data.image.alt)} fill priority quality={70} className="object-cover" style={focal && { objectPosition: `${focal.x * 100}% ${focal.y * 100}%` }} sizes="(max-width:1024px) 62vw, 370px" />
              : <MediaImage alt={t(data.image.alt)} sizes="370px" priority />}
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/45 to-transparent" />
          </div>

          <div aria-hidden data-reveal="zoom" style={delay(0.6)} className="pointer-events-none absolute inset-0 text-on-media">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M44 30 C 56 26, 66 22, 76 22" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M58 50 C 66 46, 70 43, 78 42" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M50 70 C 60 66, 66 64, 76 63" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="t15-hotspot absolute left-[44%] top-[30%] -translate-x-1/2 -translate-y-1/2" />
            <span className="t15-hotspot absolute left-[58%] top-[50%] -translate-x-1/2 -translate-y-1/2" />
            <span className="t15-hotspot absolute left-[50%] top-[70%] -translate-x-1/2 -translate-y-1/2" />
          </div>

          {data.chips.map((chip, i) => {
            const Icon = ICONS[chip.icon];
            return (
              <div key={i} data-reveal="right" style={delay(0.45 + i * 0.12)} className={`absolute flex items-center ${CHIP_SLOTS[i]}`}>
                <span className={`relative z-10 grid h-11 w-11 place-items-center rounded-full border-4 border-bg-elevated shadow-lg ${TONES[chip.tone]}`}><Icon aria-hidden className="h-5 w-5" /></span>
                <span className="t15-glass -ml-3 rounded-full py-2.5 pl-6 pr-4 text-xs font-black text-fg sm:text-sm">{t(chip.label)}</span>
              </div>
            );
          })}

          {outputCard && (
            <div data-reveal="down" style={delay(0.5)} className="t15-glass t15-float-slow absolute left-0 top-[4%] hidden w-56 rounded-3xl p-4 sm:block">
              <div className="flex items-center justify-between text-2xs font-bold uppercase tracking-[.12em] text-fg-muted">{t(outputCard.label)}<span className="flex items-center gap-1 text-success"><span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf motion-reduce:animate-none" />{outputCard.liveLabel}</span></div>
              <div className="mt-2 text-2xl font-black text-fg">{outputCard.value} {outputCard.unit && <span className="text-sm font-bold text-fg-subtle">{t(outputCard.unit)}</span>}</div>
              <div aria-hidden className="mt-3 flex h-10 items-end gap-1">
                {BARS.map((h, i) => <span key={i} className={`flex-1 rounded-full ${h > 80 ? "bg-accent" : "bg-leaf"}`} style={{ height: `${h}%` }} />)}
              </div>
            </div>
          )}

          {savingCard && (
            <div data-reveal="left" style={delay(0.7)} className="t15-glass t15-float absolute bottom-[12%] left-[-3%] rounded-3xl p-4 sm:left-[-2%]">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-on-accent"><BoltIcon aria-hidden className="h-6 w-6" /></span>
                <div><div className="text-2xs font-bold uppercase tracking-[.12em] text-fg-muted">{t(savingCard.label)}</div><div className="text-xl font-black text-fg">{savingCard.value}{savingCard.unit && <span className="ml-1 text-xs font-semibold text-fg-subtle">{t(savingCard.unit)}</span>}</div></div>
              </div>
            </div>
          )}

          {co2Card && (
            <div data-reveal="up" style={delay(0.85)} className="t15-float-delay absolute bottom-[1%] right-0 hidden rounded-2xl bg-primary px-4 py-3 text-on-primary shadow-xl sm:block">
              <div className="text-2xs font-semibold text-on-primary/85">{t(co2Card.label)}</div>
              <div className="text-lg font-black">{co2Card.value}{co2Card.unit && <> {t(co2Card.unit)}</>}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
