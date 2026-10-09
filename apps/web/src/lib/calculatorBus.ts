"use client";

import { segmentFromParam, type Segment } from "@/config/segments";

export const CALCULATOR_ID = "du-toan";
export const PACKAGES_ID = "goi-giai-phap";
const EVENT = "t15:open-calculator";

/** Giá trị điền sẵn vào công cụ dự toán (từ mega menu bảng giá, gói, video, dự án…). */
export type CalculatorPrefill = {
  segment?: Segment;
  /** Tiền điện/tháng (VNĐ) */
  bill?: number;
  /** Nhu cầu cụ thể, vd. "Hộ gia đình · Có lưu trữ · 3 – 5 triệu" — gửi kèm form báo giá */
  topic?: string;
  /** Nguồn lead khi khách gửi form dự toán, vd. "story-cta" (bấm từ video công trình) */
  source?: string;
};

const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

const normalize = (input?: Segment | CalculatorPrefill): CalculatorPrefill =>
  typeof input === "string" ? { segment: input } : input || {};

/** Cuộn tới công cụ dự toán và (tùy chọn) điền sẵn giá trị. Gọi được từ mọi component, mọi trang. */
export function openCalculator(input?: Segment | CalculatorPrefill) {
  const prefill = normalize(input);
  const el = document.getElementById(CALCULATOR_ID);
  if (!el) {
    const q = new URLSearchParams();
    if (prefill.segment) q.set("phan-khuc", prefill.segment);
    if (prefill.bill) q.set("hoa-don", String(prefill.bill));
    if (prefill.topic) q.set("nhu-cau", prefill.topic);
    if (prefill.source) q.set("nguon", prefill.source);
    window.location.href = `/${q.toString() ? `?${q}` : ""}#${CALCULATOR_ID}`;
    return;
  }
  window.dispatchEvent(new CustomEvent<CalculatorPrefill>(EVENT, { detail: prefill }));
  el.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

export function onOpenCalculator(handler: (prefill: CalculatorPrefill) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<CalculatorPrefill>).detail || {});
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/** Đọc giá trị điền sẵn từ URL (?phan-khuc=&hoa-don=&nhu-cau=&nguon=) khi đến từ trang khác. */
export function prefillFromUrl(): CalculatorPrefill {
  const q = new URLSearchParams(window.location.search);
  const bill = Number(q.get("hoa-don"));
  return {
    segment: segmentFromParam(q.get("phan-khuc")) ?? undefined,
    bill: Number.isFinite(bill) && bill > 0 ? bill : undefined,
    topic: q.get("nhu-cau") || undefined,
    source: q.get("nguon") || undefined,
  };
}
