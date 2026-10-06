"use client";

import type { Segment } from "@/config/solar";

export const CALCULATOR_ID = "du-toan";
const EVENT = "t12:open-calculator";

/** Cuộn tới công cụ dự toán và (tùy chọn) điền sẵn phân khúc. Gọi được từ mọi component. */
export function openCalculator(segment?: Segment) {
  window.dispatchEvent(new CustomEvent<Segment | undefined>(EVENT, { detail: segment }));
  const el = document.getElementById(CALCULATOR_ID);
  if (el) {
    el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  } else {
    window.location.href = `/${segment ? `?phan-khuc=${segment}` : ""}#${CALCULATOR_ID}`;
  }
}

export function onOpenCalculator(handler: (segment?: Segment) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<Segment | undefined>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
