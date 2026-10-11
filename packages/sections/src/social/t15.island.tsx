"use client";
import { useLayoutEffect, useState } from "react";
import { useCountUp, useInViewOnce } from "@solar/ui";
import type { Locale } from "../site";

export default function Followers({ value, locale }: { value: number; locale: Locale }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.3);
  // SSR / no-JS / reduced motion show the final total; animation starts only after hydration.
  const [animate, setAnimate] = useState(false);
  useLayoutEffect(() => { if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAnimate(true); }, []);
  const counted = useCountUp(value, { start: animate && seen, duration: 1800 });
  return <div ref={ref} className="t15-gradient-text text-6xl font-black tabular-nums tracking-tight sm:text-7xl">{new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN").format(Math.round(animate ? counted : value))}+</div>;
}
