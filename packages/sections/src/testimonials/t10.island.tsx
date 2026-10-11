"use client";

import { useState } from "react";
import { SEGMENT_ORDER, formatNumber, type Segment } from "@solar/core";
import type { TestimonialItem } from "../collections/schemas";
import { T10 } from "../shared/t10";

export default function Reviews({ ui, items, labels }: {
  ui: { all: string; prev: string; next: string; of: string; filter: string }; items: TestimonialItem[]; labels: Record<Segment, string>;
}) {
  const [filter, setFilter] = useState<Segment | null>(null);
  const [index, setIndex] = useState(0);
  const list = items.filter((item) => !filter || item.segment === filter);
  const segments = SEGMENT_ORDER.filter((segment) => items.some((item) => item.segment === segment));
  const review = list[index % list.length];
  const initials = review.name.split(/\s+/).slice(-2).map((word) => word[0]).join("").toUpperCase();
  return (
    <>
      {segments.length > 1 && (
        <div role="group" aria-label={ui.filter} className="mb-7 flex flex-wrap gap-2">
          {[null, ...segments].map((segment) => (
            <button key={segment ?? "all"} type="button" aria-pressed={filter === segment} className={T10.pill}
              onClick={() => { setFilter(segment); setIndex(0); }}>{segment ? labels[segment] : ui.all}</button>
          ))}
        </div>
      )}
      <div aria-live="polite" aria-atomic="true" className={`${T10.card} grid gap-6 p-6 sm:p-10 md:grid-cols-[120px_1fr]`}>
        <span aria-hidden className="grid h-[120px] w-[120px] place-items-center rounded-full bg-accent text-3xl font-black text-on-accent">{initials}</span>
        <div>
          <blockquote className="text-xl font-bold leading-9 tracking-tight text-fg sm:text-2xl">“{review.quote}”</blockquote>
          <p className="mt-6 font-black text-primary-strong">{review.name}</p>
          <p className="mt-1 text-sm leading-7 text-fg-muted">{labels[review.segment]} · {review.location} · {formatNumber(review.kwp)} kWp</p>
        </div>
      </div>
      {list.length > 1 && (
        <div className="mt-5 flex items-center justify-end gap-4">
          <p className="text-sm text-fg-muted">{(index % list.length) + 1} {ui.of} {list.length}</p>
          <button type="button" className={T10.iconButton} aria-label={ui.prev} onClick={() => setIndex((index - 1 + list.length) % list.length)}>←</button>
          <button type="button" className={T10.iconButton} aria-label={ui.next} onClick={() => setIndex((index + 1) % list.length)}>→</button>
        </div>
      )}
    </>
  );
}
