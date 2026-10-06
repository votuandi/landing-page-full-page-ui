"use client";

import { FormEvent, useId, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { isVnMobile } from "@/lib/phone";
import { SITE_CONFIG } from "@/config/site";

type Props = {
  source?: string;
  /** Hiện ô ghi chú (form liên hệ chung). */
  withMessage?: boolean;
  defaultMessage?: string;
  /** Dữ liệu gửi kèm (vd. kết quả dự toán). */
  extra?: { segment?: string; estimate?: Record<string, string | number | boolean> };
  submitLabel?: string;
  columns?: 1 | 2;
};

type Status = "idle" | "sending" | "success" | "error";

export default function LeadForm({ source = "website", withMessage = false, defaultMessage = "", extra, submitLabel = "Nhận báo giá chi tiết", columns = 2 }: Props) {
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") || "");
    if (!isVnMobile(phone)) { setPhoneError("Số di động chưa đúng (vd. 0901 234 567)"); return; }
    setPhoneError("");
    setStatus("sending");
    setError("");
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form.entries()), source, ...extra }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "");
      setStatus("success");
    } catch (e) {
      setError((e as Error).message || "Chưa gửi được thông tin.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-3xl border border-success/40 bg-success/10 p-6">
        <div className="flex items-center gap-2 text-lg font-black text-fg"><CheckCircleIcon className="h-6 w-6 text-success" />Đã nhận thông tin của bạn!</div>
        <p className="mt-2 text-sm leading-6 text-fg-muted">Kỹ sư sẽ liên hệ trong giờ làm việc để hẹn khảo sát và gửi báo giá chi tiết.</p>
      </div>
    );
  }

  const two = columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <form onSubmit={submit} noValidate className={`grid gap-4 ${two}`} aria-busy={status === "sending"}>
      <label className="t5-label">Họ và tên *<input name="name" required autoComplete="name" className="t5-input" placeholder="Nguyễn Văn A" /></label>
      <label className="t5-label">Số điện thoại di động *
        <input name="phone" required inputMode="tel" autoComplete="tel" className="t5-input" placeholder="09xx xxx xxx"
          aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? `${id}-phone` : undefined} onChange={() => phoneError && setPhoneError("")} />
        {phoneError && <span id={`${id}-phone`} className="mt-1.5 block text-xs font-bold text-danger">{phoneError}</span>}
      </label>
      <label className="t5-label">Zalo <span className="font-medium text-fg-subtle">(tùy chọn)</span><input name="zalo" inputMode="tel" className="t5-input" placeholder="Nếu khác số điện thoại" /></label>
      <label className="t5-label">Địa chỉ lắp đặt <span className="font-medium text-fg-subtle">(tùy chọn)</span><input name="address" autoComplete="street-address" className="t5-input" placeholder="Phường/xã, tỉnh/thành" /></label>
      {withMessage && <label className={`t5-label ${columns === 2 ? "sm:col-span-2" : ""}`}>Nhu cầu<textarea name="message" defaultValue={defaultMessage} rows={3} className="t5-input resize-none" placeholder="Tiền điện/tháng, loại mái, nhu cầu lưu trữ…" /></label>}
      {/* Honeypot chống spam: ẩn với người dùng và trình đọc màn hình */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <button disabled={status === "sending"} className={`t5-button t5-button-primary min-h-12 text-base disabled:opacity-60 ${columns === 2 ? "sm:col-span-2" : ""}`}>
        {status === "sending" ? "Đang gửi…" : submitLabel}
      </button>
      {status === "error" && (
        <p role="alert" className={`text-sm font-bold text-danger ${columns === 2 ? "sm:col-span-2" : ""}`}>
          {error || "Chưa gửi được thông tin."} {SITE_CONFIG.contact.phoneRaw && <>Hoặc gọi <a className="underline" href={`tel:${SITE_CONFIG.contact.phoneRaw}`}>{SITE_CONFIG.contact.phone}</a>.</>}
        </p>
      )}
      <p className={`text-xs leading-5 text-fg-subtle ${columns === 2 ? "sm:col-span-2" : ""}`}>Thông tin chỉ dùng để tư vấn & báo giá, không chia sẻ cho bên thứ ba.</p>
    </form>
  );
}
