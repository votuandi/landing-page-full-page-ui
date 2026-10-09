"use client";

import { FormEvent, useId, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { isVnMobile } from "@solar/core";
import type { Lead } from "@/lib/leads/types";
import { SITE_CONFIG, primaryHotline, telHref } from "@/config/site";
import { useLang } from "@/i18n/LangProvider";

type Extra = Partial<Pick<Lead, "segment" | "estimate" | "items">>;

type Props = {
  /** Nguồn lead: "calculator", "story-cta", "quote-cart", "popup", "contact", "home-bottom"… */
  source: string;
  /** Ô tùy chọn hiển thị thêm (mặc định: Zalo + địa chỉ). */
  fields?: { zalo?: boolean; address?: boolean; message?: boolean };
  messageLabel?: string;
  messagePlaceholder?: string;
  defaultMessage?: string;
  /** Dữ liệu gửi kèm, đọc tại thời điểm bấm gửi (vd. kết quả dự toán, sản phẩm trong giỏ). */
  getExtra?: () => Extra;
  submitLabel?: string;
  columns?: 1 | 2;
  /** Nội dung chèn ngay trên nút gửi (vd. ô "đính kèm kết quả dự toán"). */
  children?: React.ReactNode;
  onSuccess?: () => void;
  successText?: string;
};

type Status = "idle" | "sending" | "success" | "error";

/** Form lead dùng chung: kiểm tra số di động Việt Nam, honeypot chống spam, gửi POST /api/lead. */
export default function LeadForm({
  source, fields = { zalo: true, address: true }, messageLabel, messagePlaceholder, defaultMessage = "",
  getExtra, submitLabel, columns = 2, children, onSuccess, successText,
}: Props) {
  const { tr } = useLang();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") || "");
    if (!isVnMobile(phone)) { setPhoneError(tr("Số di động chưa đúng (vd. 0901 234 567)", "Invalid mobile number (e.g. 0901 234 567)")); return; }
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
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message || tr("Chưa gửi được thông tin.", "Could not send your details."));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-3xl border border-success/40 bg-success/10 p-6">
        <div className="flex items-center gap-2 text-lg font-black text-fg"><CheckCircleIcon className="h-6 w-6 shrink-0 text-success" />{tr("Đã nhận yêu cầu của bạn!", "Request received!")}</div>
        <p className="mt-2 text-sm leading-6 text-fg-muted">{successText || tr(`Kỹ sư sẽ gọi lại trong ${SITE_CONFIG.callbackHours} giờ (trong giờ làm việc).`, `An engineer will call you back within ${SITE_CONFIG.callbackHours} hours (business hours).`)}</p>
      </div>
    );
  }

  const span = columns === 2 ? "sm:col-span-2" : "";
  return (
    <form onSubmit={submit} noValidate className={`relative grid gap-4 ${columns === 2 ? "sm:grid-cols-2" : ""}`} aria-busy={status === "sending"}>
      <label className="t15-label">{tr("Họ và tên", "Full name")} *<input name="name" required autoComplete="name" className="t15-input" placeholder="Nguyễn Văn A" /></label>
      <label className="t15-label">{tr("Số điện thoại di động", "Mobile number")} *
        <input name="phone" required type="tel" inputMode="tel" autoComplete="tel" className="t15-input" placeholder="09xx xxx xxx"
          aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? `${id}-phone` : undefined} onChange={() => phoneError && setPhoneError("")} />
        {phoneError && <span id={`${id}-phone`} role="alert" className="mt-1.5 block text-xs font-bold text-danger">{phoneError}</span>}
      </label>
      {fields.zalo && <label className="t15-label">Zalo <span className="font-medium text-fg-subtle">({tr("tùy chọn", "optional")})</span><input name="zalo" inputMode="tel" className="t15-input" placeholder={tr("Nếu khác số điện thoại", "If different from phone")} /></label>}
      {fields.address && <label className="t15-label">{tr("Địa chỉ lắp đặt", "Installation address")} <span className="font-medium text-fg-subtle">({tr("tùy chọn", "optional")})</span><input name="address" autoComplete="street-address" className="t15-input" placeholder={tr("Phường/xã, tỉnh/thành", "Ward, province")} /></label>}
      {fields.message && <label className={`t15-label ${span}`}>{messageLabel || tr("Nhu cầu", "Your needs")}<textarea name="message" defaultValue={defaultMessage} rows={3} className="t15-input resize-none" placeholder={messagePlaceholder || tr("Tiền điện/tháng, loại mái, nhu cầu lưu trữ…", "Monthly bill, roof type, storage needs…")} /></label>}
      {/* Honeypot chống spam: ẩn với người dùng và trình đọc màn hình */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {children && <div className={span}>{children}</div>}
      <button disabled={status === "sending"} className={`t15-button t15-button-accent min-h-12 text-base disabled:opacity-60 ${span}`}>
        {status === "sending" ? tr("Đang gửi…", "Sending…") : submitLabel || tr("Nhận báo giá chi tiết", "Get a detailed quote")}
      </button>
      {status === "error" && (
        <p role="alert" className={`text-sm font-bold text-danger ${span}`}>
          {error} {tr("Hoặc gọi", "Or call")} <a className="underline" href={telHref(primaryHotline.phone)}>{primaryHotline.phone}</a>.
        </p>
      )}
      <p className={`text-xs leading-5 text-fg-subtle ${span}`}>{tr("Thông tin chỉ dùng để tư vấn & báo giá, không chia sẻ cho bên thứ ba.", "Your details are only used for consultation and quotes, never shared.")}</p>
    </form>
  );
}
