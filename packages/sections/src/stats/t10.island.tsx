"use client";

import { useLayoutEffect, useState } from "react";
import { useCountUp, useInViewOnce } from "@solar/ui";

/** Số đếm: HTML server có số cuối; sau hydrate mới đếm, bỏ qua khi prefers-reduced-motion. */
export default function StatsT10Counter({ value, decimals, locale }: { value: number; decimals: number; locale: "vi" | "en" }) {
  const [ref, seen] = useInViewOnce<HTMLSpanElement>(0.15);
  const [animate, setAnimate] = useState(false);
  useLayoutEffect(() => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAnimate(true); }, []);
  const counted = useCountUp(value, { duration: 1200, start: animate && seen });
  const format = (n: number) => new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
  return <span ref={ref} className="tabular-nums" aria-label={format(value)}><span aria-hidden>{format(animate ? counted : value)}</span></span>;
}
