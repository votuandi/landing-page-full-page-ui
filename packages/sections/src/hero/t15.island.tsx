"use client";

import { useLayoutEffect, useState } from "react";
import { delay, useCountUp, useInViewOnce } from "@solar/ui";

export type HeroStatView = { value: number; decimals: number; suffix?: string; unit: string; label: string };

const format = (n: number, decimals: number) =>
  new Intl.NumberFormat("vi-VN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
const BARS = ["bg-leaf", "bg-sky", "bg-accent"];

function Stat({ stat, index }: { stat: HeroStatView; index: number }) {
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.4);
  // HTML server hiện số cuối (đúng cả khi tắt JS); sau hydrate mới đếm, trừ khi prefers-reduced-motion.
  const [animate, setAnimate] = useState(false);
  useLayoutEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAnimate(true);
  }, []);
  const counted = useCountUp(stat.value, { duration: 1400, start: animate && seen });
  const shown = animate ? counted : stat.value;
  return (
    <div ref={ref} data-hero="up" style={delay(0.46 + index * 0.12)} className="relative pl-4">
      <span aria-hidden className={`absolute bottom-1 left-0 top-1 w-1 rounded-full ${BARS[index % 3]}`} />
      <dt className="sr-only">{stat.label}</dt>
      <dd className="text-2xl font-black tabular-nums tracking-tight text-fg sm:text-4xl" aria-label={`${format(stat.value, stat.decimals)}${stat.suffix ?? ""} ${stat.unit}`}>
        {format(shown, stat.decimals)}{stat.suffix}{/* Đơn vị xuống dòng trên mobile để cột hẹp không tràn (vd. "12.500+ khách" ở 390px). */}<span className="block text-xs font-bold text-fg-subtle sm:ml-1 sm:inline sm:text-base">{stat.unit}</span>
      </dd>
      <dd className="mt-1 text-xs font-semibold text-fg-muted sm:text-sm">{stat.label}</dd>
    </div>
  );
}

/** Số liệu nổi bật của hero, đếm số khi xuất hiện. */
export default function HeroStats({ stats }: { stats: HeroStatView[] }) {
  return (
    <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 sm:mt-12">
      {stats.map((stat, i) => <Stat key={i} stat={stat} index={i} />)}
    </dl>
  );
}
