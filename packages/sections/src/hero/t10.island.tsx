"use client";

import Image from "next/image";
import { SunIcon } from "@heroicons/react/24/outline";
import { MediaImage } from "@solar/ui";
import type { Segment } from "@solar/core";
import type { ClientLink } from "../shared/links";
import { T10, T10_GLOW, T10Link } from "../shared/t10";
import { useSegment } from "../state/SiteState";

type View = { title: string; description: string; highlights: string[]; image: { src?: string; alt: string }; ctaLabel: string };
type Props = {
  titleId: string; badge: string; base: View; note?: string; primary: ClientLink; secondary?: ClientLink;
  card?: { label: string; value: string; unit?: string };
  picker?: { label: string; items: (View & { segment: Segment; label: string })[] };
};

export default function HeroT10({ titleId, badge, base, note, primary, secondary, card, picker }: Props) {
  const { segment, setSegment } = useSegment();
  const view = picker?.items.find((item) => item.segment === segment) ?? base;
  return (
    <section aria-labelledby={titleId} className="relative overflow-hidden py-12 md:py-20" style={T10_GLOW}>
      <div className="t15-container grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className={T10.eyebrow}>{badge}</p>
          {picker && (
            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-bold text-fg">{picker.label}</legend>
              <div className="flex flex-wrap gap-2">
                {picker.items.map((item) => (
                  <button key={item.segment} type="button" aria-pressed={segment === item.segment} className={T10.pill}
                    onClick={() => setSegment(segment === item.segment ? null : item.segment, "hero")}>{item.label}</button>
                ))}
              </div>
            </fieldset>
          )}
          <div aria-live="polite" aria-atomic="true">
            <h1 id={titleId} className="mt-6 text-4xl font-black leading-[1.13] tracking-[-.045em] text-fg sm:text-5xl xl:text-display-xl">{view.title}</h1>
            <p className={T10.sub}>{view.description}</p>
            {view.highlights.length > 0 && (
              <ul className="mt-6 grid gap-3 text-sm font-semibold text-fg-muted">
                {view.highlights.map((item) => <li key={item} className="flex gap-3"><span aria-hidden className="text-primary">✓</span>{item}</li>)}
              </ul>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <T10Link link={primary} className={`${T10.button} ${T10.primary} text-center`}>{view.ctaLabel}<span aria-hidden>↗</span></T10Link>
              {secondary && <T10Link link={secondary} className={`${T10.button} ${T10.secondary}`}>{secondary.label}</T10Link>}
            </div>
          </div>
          {note && <p className="mt-5 text-xs leading-6 text-fg-muted">{note}</p>}
        </div>
        <div className="relative pb-8">
          <div className="relative aspect-[4/4.3] overflow-hidden rounded-b-media rounded-t-full bg-bg-sky sm:aspect-[4/3.6]">
            {view.image.src
              ? <Image key={view.image.src} src={view.image.src} alt={view.image.alt} fill priority sizes="(min-width:1024px) 570px, 95vw" className="object-cover" />
              : <MediaImage alt={view.image.alt} sizes="570px" priority />}
          </div>
          {card && (
            <div className="absolute bottom-0 left-3 right-3 rounded-card border border-glass-border bg-glass p-5 shadow-glass backdrop-blur-xl sm:left-6 sm:right-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-strong">{card.label}</p>
                  <p className="mt-1 text-lg font-black text-fg">{card.value}</p>
                </div>
                <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-on-accent"><SunIcon className="h-6 w-6" /></span>
              </div>
              {card.unit && <p className="mt-2 text-xs text-fg-muted">{card.unit}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
