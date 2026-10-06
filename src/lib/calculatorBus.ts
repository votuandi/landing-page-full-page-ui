"use client";

import type { Segment } from "@/config/solar";

export const CALCULATOR_ID = "du-toan";
export const PACKAGES_ID = "goi-giai-phap";
const EVENT = "t12:open-calculator";
const TAB_EVENT = "t12:select-package-tab";

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/** Cuộn tới công cụ dự toán và (tùy chọn) điền sẵn phân khúc. Gọi được từ mọi component. */
export function openCalculator(segment?: Segment) {
  const el = document.getElementById(CALCULATOR_ID);
  if (!el) {
    window.location.href = `/${segment ? `?phan-khuc=${segment}` : ""}#${CALCULATOR_ID}`;
    return;
  }
  window.dispatchEvent(new CustomEvent<Segment | undefined>(EVENT, { detail: segment }));
  el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

export function onOpenCalculator(handler: (segment?: Segment) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<Segment | undefined>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/** Cuộn tới section gói giải pháp và mở tab phân khúc tương ứng. */
export function openPackages(segment: Segment) {
  window.dispatchEvent(new CustomEvent<Segment>(TAB_EVENT, { detail: segment }));
  document.getElementById(PACKAGES_ID)?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

export function onOpenPackages(handler: (segment: Segment) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<Segment>).detail);
  window.addEventListener(TAB_EVENT, listener);
  return () => window.removeEventListener(TAB_EVENT, listener);
}
