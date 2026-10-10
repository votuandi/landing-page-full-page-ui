"use client";
import { useLayoutEffect, useState } from "react";
import { useCountUp, useInViewOnce } from "@solar/ui";
import type { Locale } from "../site";

type Item = { value: number; decimals: number; suffix: string; label: string };
function Stat({ item, locale }: { item: Item; locale: Locale }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.3);
  const [animate, setAnimate] = useState(false);
  useLayoutEffect(() => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAnimate(true); }, []);
  const counted = useCountUp(item.value, { duration: 1600, start: animate && seen });
  const format = (value: number) => new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN", { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals }).format(value);
  return <div ref={ref} className="t15-glass-dark flex flex-col-reverse rounded-3xl p-6 text-center"><dt className="mt-2 text-sm font-semibold text-fg-muted">{item.label}</dt><dd className="text-4xl font-black tabular-nums tracking-tight text-accent-ink sm:text-5xl" aria-label={`${format(item.value)}${item.suffix}`}>{format(animate ? counted : item.value)}<span className="text-2xl">{item.suffix}</span></dd></div>;
}
export default function Stats({ items, locale }: { items: Item[]; locale: Locale }) {
  return <dl data-reveal-stagger="zoom" data-reveal-step="0.1" className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">{items.map((item, i) => <Stat key={i} item={item} locale={locale} />)}</dl>;
}
