"use client";

import { FormEvent, useId, useState } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { primaryBranch, telHref } from "@/config/site";
import { PROVINCES } from "@/config/solar";
import { isVnMobile } from "@solar/core";
import { useLang } from "@/i18n/LangProvider";

type Status = "idle" | "sending" | "success" | "error";

/** Form đăng ký đại lý (riêng với form báo giá): tên, SĐT, tỉnh, loại hình kinh doanh → /api/lead (source "dealer"). */
export default function DealerForm() {
  const { tr } = useLang();
  const id = useId();
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries()) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!data.name?.trim()) next.name = tr("Vui lòng nhập họ tên", "Please enter your name");
    if (!isVnMobile(data.phone || "")) next.phone = tr("Số di động chưa đúng (vd. 0901 234 567)", "Invalid mobile number");
    if (!data.province) next.province = tr("Chọn tỉnh/thành", "Choose a province");
    if (!data.businessType) next.businessType = tr("Chọn loại hình kinh doanh", "Choose a business type");
    setErrors(next);
    if (Object.keys(next).length) {
      (e.currentTarget.querySelector(`[name="${Object.keys(next)[0]}"]`) as HTMLElement | null)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "dealer", segment: "Đăng ký đại lý" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "");
      setStatus("success");
    } catch (err) {
      setMessage((err as Error).message);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-3xl border border-success/40 bg-success/10 p-6">
        <div className="flex items-center gap-2 text-lg font-black text-fg"><CheckCircleIcon className="h-6 w-6 text-success" />{tr("Đã nhận đăng ký đại lý!", "Dealer application received!")}</div>
        <p className="mt-2 text-sm leading-6 text-fg-muted">{tr("Phòng kinh doanh khu vực sẽ liên hệ trong 1 ngày làm việc.", "Our regional sales team will contact you within 1 business day.")}</p>
      </div>
    );
  }

  const err = (name: string) => errors[name] && <span id={`${id}-${name}`} className="mt-1.5 block text-xs font-bold text-danger">{errors[name]}</span>;
  const aria = (name: string) => ({ "aria-invalid": Boolean(errors[name]) || undefined, "aria-describedby": errors[name] ? `${id}-${name}` : undefined });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2" aria-busy={status === "sending"}>
      <label className="t15-label">{tr("Họ và tên", "Full name")} *<input name="name" autoComplete="name" className="t15-input" placeholder="Nguyễn Văn A" {...aria("name")} />{err("name")}</label>
      <label className="t15-label">{tr("Số điện thoại", "Phone")} *<input name="phone" inputMode="tel" autoComplete="tel" className="t15-input" placeholder="09xx xxx xxx" {...aria("phone")} />{err("phone")}</label>
      <label className="t15-label">{tr("Tỉnh/thành", "Province")} *
        <select name="province" defaultValue="" className="t15-input min-h-12" {...aria("province")}>
          <option value="" disabled>{tr("Chọn tỉnh/thành", "Choose…")}</option>
          {PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>{err("province")}
      </label>
      <label className="t15-label">{tr("Loại hình kinh doanh", "Business type")} *
        <select name="businessType" defaultValue="" className="t15-input min-h-12" {...aria("businessType")}>
          <option value="" disabled>{tr("Chọn loại hình", "Choose…")}</option>
          {siteConfig.dealer.businessTypes.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>{err("businessType")}
      </label>
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <button disabled={status === "sending"} className="t15-button t15-button-primary min-h-12 text-base disabled:opacity-60 sm:col-span-2">
        {status === "sending" ? tr("Đang gửi…", "Sending…") : tr("Đăng ký làm đại lý", "Apply to become a dealer")}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm font-bold text-danger sm:col-span-2">
          {message || tr("Chưa gửi được thông tin.", "Could not send.")} {tr("Hoặc gọi", "Or call")} <a className="underline" href={telHref(primaryBranch.hotline.project)}>{primaryBranch.hotline.project}</a>.
        </p>
      )}
    </form>
  );
}
