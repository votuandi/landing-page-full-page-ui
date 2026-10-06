"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  CLIENTS,
  COPY,
  COUNTERS,
  REVIEWS,
  SEGMENTS,
  SEGMENT_IDS,
  type Segment,
} from "@/content/site";
import { SectionTitle } from "./Sections";
export function ClientWall() {
  const [paused, setPaused] = useState(false);
  const [industry, setIndustry] = useState<string>(COPY.allIndustries);
  const clients = CLIENTS.filter(
    (c) => industry === COPY.allIndustries || c.industry === industry,
  );
  return (
    <section className="py-16">
      <div className="t5-container">
        <SectionTitle
          eyebrow={COPY.clientsEyebrow}
          title={COPY.clientsTitle}
          description={COPY.clientsNote}
        />
        <div
          className="mb-7 flex flex-wrap gap-2"
          role="group"
          aria-label={COPY.clientsFilter}
        >
          {[COPY.allIndustries, ...COPY.industries].map((i) => (
            <button
              key={i}
              className={`segment-pill ${i === industry ? "is-selected" : ""}`}
              aria-pressed={industry === i}
              onClick={() => setIndustry(i)}
            >
              {i}
            </button>
          ))}
        </div>
        <button
          className="t5-button t5-button-secondary mb-4"
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
        >
          {paused ? COPY.clientsPlay : COPY.clientsPause}
        </button>
        <div
          className="marquee-window"
          tabIndex={0}
          aria-label={COPY.clientsTitle}
        >
          <div
            className="marquee-track"
            key={industry}
            style={paused ? { animationPlayState: "paused" } : undefined}
          >
            {[false, true].map((duplicate) => (
              <ul
                className="marquee-group"
                key={String(duplicate)}
                aria-hidden={duplicate || undefined}
              >
                {clients.map((c) => (
                  <li
                    key={c.id}
                    className="w-[230px] shrink-0 rounded-2xl border border-slate-200 bg-white p-5"
                  >
                    <Image
                      src={`/images/clients/${c.id}.svg`}
                      alt={c.name}
                      width={200}
                      height={64}
                      className="h-16 w-full"
                    />
                    <p className="mt-3 text-xs leading-6 text-slate-600">
                      {c.name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-blue-900">
                      {c.location} · {c.scale}
                    </p>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export function Counters() {
  const root = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1);
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    let frame = 0;
    setProgress(0);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1200);
          setProgress(1 - Math.pow(1 - t, 3));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section className="bg-blue-900 py-12 text-white">
      <div className="t5-container" ref={root}>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {COUNTERS.map((c) => (
            <div key={c.label}>
              <p className="text-4xl font-black tracking-tight">
                <span aria-hidden="true">
                  {(c.value * progress).toLocaleString("vi-VN", {
                    minimumFractionDigits: c.decimals,
                    maximumFractionDigits: c.decimals,
                  })}
                </span>
                <span className="sr-only">
                  {c.value.toLocaleString("vi-VN")}
                </span>
                <span className="mt-2 block text-sm font-bold text-emerald-200">
                  {c.unit}
                </span>
              </p>
              <p className="mt-3 text-sm text-blue-100">{c.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs leading-6 text-blue-100">
          {COPY.counterNote}
        </p>
      </div>
    </section>
  );
}
export function Reviews({ segment }: { segment?: Segment }) {
  const [filter, setFilter] = useState<Segment | "all">(segment ?? "all");
  const [index, setIndex] = useState(0);
  const list = REVIEWS.filter((r) => filter === "all" || r.segment === filter);
  const r = list[index % list.length];
  return (
    <section className="t5-section">
      <div className="t5-container">
        <SectionTitle
          eyebrow={COPY.reviewsEyebrow}
          title={COPY.reviewsTitle}
          description={COPY.demo}
        />
        <div
          role="group"
          aria-label={COPY.reviewFilter}
          className="mb-7 flex flex-wrap gap-2"
        >
          {(["all", ...SEGMENT_IDS] as const).map((s) => (
            <button
              key={s}
              className={`segment-pill ${filter === s ? "is-selected" : ""}`}
              aria-pressed={filter === s}
              onClick={() => {
                setFilter(s);
                setIndex(0);
              }}
            >
              {s === "all" ? COPY.allSegments : SEGMENTS[s].label}
            </button>
          ))}
        </div>
        <div
          className="t8-card grid gap-6 p-6 sm:p-10 md:grid-cols-[120px_1fr]"
          aria-live="polite"
          aria-atomic="true"
        >
          <Image
            src={r.avatar}
            alt={`${COPY.imageNote}: ${r.name}`}
            width={120}
            height={120}
            className="rounded-full"
          />
          <div>
            <blockquote className="text-xl font-bold leading-9 tracking-tight sm:text-2xl">
              “{r.text}”
            </blockquote>
            <p className="mt-6 font-black text-blue-900">{r.name}</p>
            <p className="mt-1 text-sm leading-7 text-slate-600">
              {r.role} · {r.company}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-4">
          <p className="text-sm text-slate-600">
            {COPY.reviewPosition} {(index % list.length) + 1} {COPY.of}{" "}
            {list.length}
          </p>
          <button
            className="t5-icon-button"
            aria-label={COPY.prev}
            onClick={() => setIndex((index - 1 + list.length) % list.length)}
          >
            ←
          </button>
          <button
            className="t5-icon-button"
            aria-label={COPY.next}
            onClick={() => setIndex((index + 1) % list.length)}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
