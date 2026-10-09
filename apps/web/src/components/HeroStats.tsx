"use client";

import { useLayoutEffect, useState } from "react";
import { useCountUp, useInViewOnce } from "@/lib/useCountUp";
import { useLang } from "@/i18n/LangProvider";
import { delay } from "@/utils/reveal";

/** unit / label: [tiếng Việt, English] */
export type HeroStat = { value: number; decimals?: number; suffix?: string; unit: readonly [string, string]; label: readonly [string, string] };

const format = (n: number, decimals = 0) =>
  new Intl.NumberFormat("vi-VN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

function Stat({ stat, index }: { stat: HeroStat; index: number }) {
  const { tr } = useLang();
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.4);
  // HTML từ server hiện số cuối (đúng cả khi chưa có JS); sau khi hydrate mới về 0 để đếm khi xuất hiện.
  const [animate, setAnimate] = useState(false);
  useLayoutEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAnimate(true);
  }, []);
  const counted = useCountUp(stat.value, { duration: 1400, start: animate && seen });
  const shown = animate ? counted : stat.value;
  const unit = tr(stat.unit[0], stat.unit[1]);
  const label = tr(stat.label[0], stat.label[1]);

  return (
    <div ref={ref} data-hero="up" style={delay(0.46 + index * 0.12)} className="relative pl-4">
      <span aria-hidden className={`absolute bottom-1 left-0 top-1 w-1 rounded-full ${["bg-leaf", "bg-sky", "bg-accent"][index % 3]}`} />
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-black tabular-nums tracking-tight text-fg sm:text-4xl" aria-label={`${format(stat.value, stat.decimals)}${stat.suffix ?? ""} ${unit}`}>
        {format(shown, stat.decimals)}{stat.suffix}<span className="ml-1 text-xs font-bold text-fg-subtle sm:text-base">{unit}</span>
      </dd>
      <dd className="mt-1 text-xs font-semibold text-fg-muted sm:text-sm">{label}</dd>
    </div>
  );
}

/** 3 con số nổi bật của hero, đếm số khi xuất hiện (tắt khi prefers-reduced-motion). */
export default function HeroStats({ stats }: { stats: HeroStat[] }) {
  return (
    <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 sm:mt-12">
      {stats.map((stat, i) => <Stat key={stat.label[0]} stat={stat} index={i} />)}
    </dl>
  );
}
