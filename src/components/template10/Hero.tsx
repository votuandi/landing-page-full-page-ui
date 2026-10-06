"use client";
import Image from "next/image";
import Link from "next/link";
import {
  COPY,
  HOME_COPY,
  IMAGES,
  SEGMENTS,
  SEGMENT_IDS,
  type Segment,
} from "@/content/site";
import { contactUrl, useSegment } from "./SegmentContext";
export default function Hero({ fixed }: { fixed?: Segment }) {
  const { segment, select } = useSegment();
  const selected = fixed ?? segment;
  const c = selected ? SEGMENTS[selected] : HOME_COPY;
  const image = selected ? SEGMENTS[selected].image : IMAGES.factory;
  return (
    <section className="solar-hero relative overflow-hidden py-12 md:py-20">
      <div className="t5-container grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <p className="t5-eyebrow">{HOME_COPY.eyebrow}</p>
          {!fixed && (
            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-bold">
                {HOME_COPY.selector}
              </legend>
              <div className="flex flex-wrap gap-2">
                {SEGMENT_IDS.map((s) => (
                  <button
                    key={s}
                    onClick={() => select(s)}
                    aria-pressed={selected === s}
                    className={`segment-pill ${selected === s ? "is-selected" : ""}`}
                  >
                    {SEGMENTS[s].label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <div aria-live="polite" aria-atomic="true">
            <h1 className="mt-6 text-[2.35rem] font-black leading-[1.13] tracking-[-.045em] text-[var(--t8-ink)] sm:text-5xl xl:text-[3.65rem]">
              {c.headline}
            </h1>
            <p className="t5-subheading">{c.description}</p>
            <ul className="mt-6 grid gap-3 text-sm font-semibold text-slate-700">
              {c.highlights.map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="text-blue-800" aria-hidden="true">
                    ✓
                  </span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={selected === "home" ? "#may-tinh" : contactUrl(selected)}
                className="t5-button t5-button-primary text-center"
              >
                {c.cta}
                <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href={selected === "home" ? contactUrl(selected) : "#may-tinh"}
                className="t5-button t5-button-secondary"
              >
                {c.secondaryCta}
              </Link>
            </div>
          </div>
          <p className="mt-5 text-xs leading-6 text-slate-600">
            {COPY.conditions}
          </p>
        </div>
        <div className="relative pb-8">
          <div className="relative aspect-[4/4.3] overflow-hidden rounded-t-[160px] rounded-b-[32px] bg-blue-100 sm:aspect-[4/3.6]">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width:1024px) 570px, 95vw"
              className="object-cover"
            />
            <span className="absolute right-6 top-8 rounded-full bg-white/95 px-3 py-2 text-xs font-bold">
              {COPY.imageNote}
            </span>
          </div>
          <div className="t8-glass absolute bottom-0 left-3 right-3 rounded-[24px] p-5 sm:left-6 sm:right-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  {HOME_COPY.heroMetric.label}
                </p>
                <p className="mt-1 text-lg font-black text-[var(--t8-ink)]">
                  {HOME_COPY.heroMetric.value}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-200 text-2xl"
              >
                ☀
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {HOME_COPY.heroMetric.note}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
