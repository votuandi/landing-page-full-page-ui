"use client";

import { useCountUp } from "./useCountUp";
import { formatNumber } from "@solar/core";

/** Số đếm khi `start` = true; tôn trọng prefers-reduced-motion (qua useCountUp). */
export function CountUp({ value, start = true, decimals = 0, duration = 1400 }: { value: number; start?: boolean; decimals?: number; duration?: number }) {
  const v = useCountUp(value, { duration, start });
  return <>{decimals ? v.toFixed(decimals).replace(".", ",") : formatNumber(v)}</>;
}

