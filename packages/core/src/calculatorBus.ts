import { segmentFromParam, type Segment } from "./segment";

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
    const search = prefillToSearch(prefill);
    window.location.href = `/${search ? `?${search}` : ""}#${CALCULATOR_ID}`;
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

/** Đọc giá trị điền sẵn từ query, dùng được cả trong Node. */
export function prefillFromSearch(search: string): CalculatorPrefill {
  const q = new URLSearchParams(search);
  const bill = Number(q.get("hoa-don"));
  return {
    segment: segmentFromParam(q.get("phan-khuc")) ?? undefined,
    bill: Number.isFinite(bill) && bill > 0 ? bill : undefined,
    topic: q.get("nhu-cau") || undefined,
    source: q.get("nguon") || undefined,
  };
}

/** Query điền sẵn cho liên kết tới calculator; rỗng → "". */
export function prefillToSearch(prefill: CalculatorPrefill): string {
  const q = new URLSearchParams();
  if (prefill.segment) q.set("phan-khuc", prefill.segment);
  if (prefill.bill !== undefined && Number.isFinite(prefill.bill) && prefill.bill > 0) q.set("hoa-don", String(prefill.bill));
  if (prefill.topic) q.set("nhu-cau", prefill.topic);
  if (prefill.source) q.set("nguon", prefill.source);
  return q.toString();
}

/** Đọc giá trị điền sẵn từ URL khi đến từ trang khác. */
export function prefillFromUrl(): CalculatorPrefill {
  return prefillFromSearch(window.location.search);
}
