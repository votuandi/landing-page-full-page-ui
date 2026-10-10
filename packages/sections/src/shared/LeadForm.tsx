"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { isVnMobile, normalizeVnPhone } from "@solar/core";
import type { Locale } from "../site";

/** Nội dung tenant đã chọn ngôn ngữ ở server. */
export type LeadFormText = {
  submit: string;
  success: string;
  privacy: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  fallbackPhone?: string;
};
export type LeadFormFields = { zalo: boolean; address: boolean; message: boolean };
type Extra = { segment?: string; estimate?: Record<string, string | number | boolean> };

// Chuỗi giao diện của form (không phải nội dung tenant).
const UI = {
  vi: {
    name: "Họ và tên", phone: "Số điện thoại di động", optional: "tùy chọn", zaloHint: "Nếu khác số điện thoại",
    address: "Địa chỉ lắp đặt", addressHint: "Phường/xã, tỉnh/thành", message: "Nhu cầu",
    messageHint: "Tiền điện/tháng, loại mái, nhu cầu lưu trữ…", sending: "Đang gửi…", done: "Đã nhận yêu cầu của bạn!",
    badPhone: "Số di động chưa đúng (vd. 0901 234 567)", failed: "Chưa gửi được thông tin.", orCall: "Hoặc gọi",
  },
  en: {
    name: "Full name", phone: "Mobile number", optional: "optional", zaloHint: "If different from phone",
    address: "Installation address", addressHint: "Ward, province", message: "Your needs",
    messageHint: "Monthly bill, roof type, storage needs…", sending: "Sending…", done: "Request received!",
    badPhone: "Invalid mobile number (e.g. 0901 234 567)", failed: "Could not send your details.", orCall: "Or call",
  },
} as const;

type Status = "idle" | "sending" | "success" | "error";

/** Form lead dùng chung của section: kiểm số di động VN, honeypot chống spam, POST /api/lead. */
export function LeadForm({ locale, source, fields, text, getExtra, columns = 2, children }: {
  locale: Locale;
  source: string;
  fields: LeadFormFields;
  text: LeadFormText;
  /** Đọc lúc bấm gửi (vd. kết quả dự toán). */
  getExtra?: () => Extra;
  columns?: 1 | 2;
  children?: ReactNode;
}) {
  const ui = UI[locale];
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = new FormData(event.currentTarget);
    if (!isVnMobile(String(form.get("phone") || ""))) { setPhoneError(ui.badPhone); return; }
    setPhoneError("");
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form.entries()), source, page: window.location.pathname, ...getExtra?.() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.message || "");
      setStatus("success");
    } catch (e) {
      setError((e as Error).message || ui.failed);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-3xl border border-success/40 bg-success/10 p-6">
        <div className="flex items-center gap-2 text-lg font-black text-fg"><CheckCircleIcon className="h-6 w-6 shrink-0 text-success" />{ui.done}</div>
        <p className="mt-2 text-sm leading-6 text-fg-muted">{text.success}</p>
      </div>
    );
  }

  const span = columns === 2 ? "sm:col-span-2" : "";
  const optional = <span className="font-medium text-fg-subtle">({ui.optional})</span>;
  return (
    <form onSubmit={submit} noValidate className={`relative grid gap-4 ${columns === 2 ? "sm:grid-cols-2" : ""}`} aria-busy={status === "sending"}>
      <label className="t15-label">{ui.name} *<input name="name" required autoComplete="name" className="t15-input" placeholder="Nguyễn Văn A" /></label>
      <label className="t15-label">{ui.phone} *
        <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" className="t15-input" placeholder="09xx xxx xxx"
          aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? `${id}-phone` : undefined} onChange={() => phoneError && setPhoneError("")} />
        {phoneError && <span id={`${id}-phone`} role="alert" className="mt-1.5 block text-xs font-bold text-danger">{phoneError}</span>}
      </label>
      {fields.zalo && <label className="t15-label">Zalo {optional}<input name="zalo" inputMode="tel" className="t15-input" placeholder={ui.zaloHint} /></label>}
      {fields.address && <label className="t15-label">{ui.address} {optional}<input name="address" autoComplete="street-address" className="t15-input" placeholder={ui.addressHint} /></label>}
      {fields.message && <label className={`t15-label ${span}`}>{text.messageLabel || ui.message}<textarea name="message" rows={3} className="t15-input resize-none" placeholder={text.messagePlaceholder || ui.messageHint} /></label>}
      {/* Honeypot: ẩn với người dùng và trình đọc màn hình */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {children && <div className={span}>{children}</div>}
      <button disabled={status === "sending"} className={`t15-button t15-button-accent min-h-12 text-base disabled:opacity-60 ${span}`}>
        {status === "sending" ? ui.sending : text.submit}
      </button>
      {status === "error" && (
        <p role="alert" className={`text-sm font-bold text-danger ${span}`}>
          {error}{text.fallbackPhone && <> {ui.orCall} <a className="underline" href={`tel:${normalizeVnPhone(text.fallbackPhone)}`}>{text.fallbackPhone}</a>.</>}
        </p>
      )}
      <p className={`text-xs leading-5 text-fg-subtle ${span}`}>{text.privacy}</p>
    </form>
  );
}
