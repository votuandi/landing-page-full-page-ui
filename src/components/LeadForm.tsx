"use client";

import { FormEvent, useState } from "react";

export default function LeadForm({ source = "website", compact = false, defaultMessage = "" }: { source?: string; compact?: boolean; defaultMessage?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source }),
    });
    setStatus(response.ok ? "success" : "error");
  }

  if (status === "success") {
    return <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-6"><div className="text-lg font-black text-emerald-900">Đã nhận thông tin của bạn.</div><p className="mt-2 text-sm leading-6 text-emerald-800">Bộ phận dự án sẽ liên hệ theo thông tin bạn đã cung cấp.</p></div>;
  }

  return (
    <form onSubmit={submit} className={compact ? "grid gap-3" : "grid gap-4 md:grid-cols-2"}>
      <label className="t5-label">Họ và tên<input name="name" required className="t5-input" placeholder="Nguyễn Văn A" /></label>
      <label className="t5-label">Số điện thoại<input name="phone" required inputMode="tel" className="t5-input" placeholder="09xx xxx xxx" /></label>
      {!compact && <label className="t5-label">Email<input name="email" type="email" className="t5-input" placeholder="name@company.vn" /></label>}
      {!compact && <label className="t5-label">Doanh nghiệp / công trình<input name="company" className="t5-input" placeholder="Tên công ty hoặc loại công trình" /></label>}
      <label className={compact ? "t5-label" : "t5-label md:col-span-2"}>Nhu cầu<textarea name="message" defaultValue={defaultMessage} rows={compact ? 3 : 4} className="t5-input resize-none" placeholder="Tiền điện/tháng, diện tích mái, nhu cầu điện dự phòng..." /></label>
      <button disabled={status === "sending"} className={compact ? "t5-button t5-button-primary" : "t5-button t5-button-primary md:col-span-2"}>
        {status === "sending" ? "Đang gửi..." : "Nhận tư vấn & báo giá"}
      </button>
      {status === "error" && <p className="text-sm font-bold text-red-600 md:col-span-2">Chưa gửi được thông tin. Vui lòng thử lại hoặc gọi số điện thoại hỗ trợ.</p>}
    </form>
  );
}