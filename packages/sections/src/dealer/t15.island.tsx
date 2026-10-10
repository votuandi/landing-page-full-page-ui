"use client";
import { useEffect, useState, useId, type FormEvent } from "react";
import { MediaImage, CarouselNav, useSnapCarousel } from "@solar/ui";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import { PROVINCES, isVnMobile } from "@solar/core";
import type { Locale } from "../site";

type FormText = { title: string; description?: string; businessTypes: string[]; submitLabel: string; successTitle: string; successMessage: string };
function DealerForm({ text, locale }: { text: FormText; locale: Locale }) {
  const id = useId();
  const en = locale === "en";
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!data.name?.trim()) next.name = en ? "Please enter your name" : "Vui lòng nhập họ tên";
    if (!isVnMobile(data.phone || "")) next.phone = en ? "Invalid mobile number" : "Số di động chưa đúng";
    if (!PROVINCES.some((p) => p.name === data.province)) next.province = en ? "Choose a province" : "Chọn tỉnh/thành";
    if (!text.businessTypes.includes(data.businessType)) next.businessType = en ? "Choose a business type" : "Chọn loại hình kinh doanh";
    setErrors(next);
    if (Object.keys(next).length) {
      (event.currentTarget.elements.namedItem(Object.keys(next)[0]) as HTMLElement | null)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const response = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, source: "dealer", segment: "Đăng ký đại lý", page: window.location.pathname }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || (en ? "Could not send." : "Chưa gửi được thông tin."));
      setStatus("success");
    } catch (error) { setMessage((error as Error).message); setStatus("error"); }
  }
  if (status === "success") return <div role="status" className="rounded-card border border-success/40 bg-success/10 p-6"><h4 className="text-lg font-black text-fg">{text.successTitle}</h4><p className="mt-2 text-sm text-fg-muted">{text.successMessage}</p></div>;
  const aria = (name: string) => ({ "aria-invalid": Boolean(errors[name]) || undefined, "aria-describedby": errors[name] ? id + "-" + name : undefined });
  const error = (name: string) => errors[name] && <span id={id + "-" + name} className="mt-1 block text-xs font-bold text-danger">{errors[name]}</span>;
  return <form noValidate onSubmit={submit} aria-busy={status === "sending"} className="grid gap-4 sm:grid-cols-2">
    <label className="t15-label">{en ? "Full name" : "Họ và tên"} *<input name="name" autoComplete="name" className="t15-input" {...aria("name")} />{error("name")}</label>
    <label className="t15-label">{en ? "Phone" : "Số điện thoại"} *<input name="phone" inputMode="tel" autoComplete="tel" className="t15-input" {...aria("phone")} />{error("phone")}</label>
    <label className="t15-label">{en ? "Province" : "Tỉnh/thành"} *<select name="province" defaultValue="" className="t15-input min-h-12" {...aria("province")}><option value="" disabled>{en ? "Choose a province" : "Chọn tỉnh/thành"}</option>{PROVINCES.map((p) => <option key={p.name}>{p.name}</option>)}</select>{error("province")}</label>
    <label className="t15-label">{en ? "Business type" : "Loại hình kinh doanh"} *<select name="businessType" defaultValue="" className="t15-input min-h-12" {...aria("businessType")}><option value="" disabled>{en ? "Choose a business type" : "Chọn loại hình"}</option>{text.businessTypes.map((type) => <option key={type}>{type}</option>)}</select>{error("businessType")}</label>
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <button disabled={status === "sending"} className="t15-button t15-button-primary min-h-12 disabled:opacity-60 sm:col-span-2">{status === "sending" ? (en ? "Sending…" : "Đang gửi…") : text.submitLabel}</button>
    {status === "error" && <p role="alert" className="text-sm font-bold text-danger sm:col-span-2">{message}</p>}
  </form>;
}
export default function Dealer({ policies, faqs, gallery, form, policyTab, faqTab, sectionId, locale }: {
  policies: { title: string; body: string }[]; faqs: { question: string; answer: string }[];
  gallery: { title: string; src?: string; alt: string }[]; form: FormText;
  policyTab: string; faqTab: string; sectionId: string; locale: Locale;
}) {
  // SSR exposes both panels; tab selection only hides content after interaction.
  const [tab, setTab] = useState<"policy" | "faq" | null>(null);
  useEffect(() => setTab("policy"), []);
  const c = useSnapCarousel();
  return <>
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <div className="t15-glass-dark rounded-media p-5 sm:p-7">
        <div role="tablist" aria-label={locale === "en" ? "Dealer information" : "Thông tin đại lý"} className="flex gap-2">
          {(["policy", "faq"] as const).map((key, index) => <button key={key} type="button" role="tab" id={sectionId + "-tab-" + key}
            aria-controls={sectionId + "-panel-" + key} aria-selected={(tab ?? "policy") === key} tabIndex={(tab ?? "policy") === key ? 0 : -1}
            onClick={() => setTab(key)} onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const next = event.key === "Home" ? "policy" : event.key === "End" ? "faq" : index === 0 ? "faq" : "policy";
                setTab(next); document.getElementById(sectionId + "-tab-" + next)?.focus();
              }
            }} className="t15-chip">{key === "policy" ? policyTab : faqTab}</button>)}
        </div>
        <div id={sectionId + "-panel-policy"} role="tabpanel" aria-labelledby={sectionId + "-tab-policy"} hidden={tab === "faq"} className="mt-5">
          <ul className="grid gap-4">{policies.map((p, i) => <li key={i} className="flex gap-3"><CheckBadgeIcon aria-hidden className="mt-0.5 h-6 w-6 shrink-0 text-accent-ink" /><div><h3 className="font-black">{p.title}</h3><p className="mt-1 text-sm leading-6 text-fg-muted">{p.body}</p></div></li>)}</ul>
        </div>
        <div id={sectionId + "-panel-faq"} role="tabpanel" aria-labelledby={sectionId + "-tab-faq"} hidden={tab === "policy"} className="mt-5">
          <div className="grid gap-3">{faqs.map((f, i) => <details key={i} className="rounded-card border border-line/12 bg-glass px-5 py-4"><summary className="cursor-pointer font-black">{f.question}</summary><p className="mt-3 text-sm leading-7 text-fg-muted">{f.answer}</p></details>)}</div>
        </div>
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between gap-4"><h3 className="text-lg font-black">{locale === "en" ? "Events" : "Hoạt động & sự kiện"}</h3><CarouselNav prevLabel={locale === "en" ? "Previous" : "Trước"} nextLabel={locale === "en" ? "Next" : "Tiếp"} prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} /></div>
        <div ref={c.ref} className="t15-no-scrollbar mt-4 flex flex-1 snap-x snap-mandatory gap-3 overflow-x-auto">
          {gallery.map((g, i) => <figure key={i} className="relative min-h-[280px] w-[88%] shrink-0 snap-start overflow-hidden rounded-card border border-glass-border sm:w-[70%]">
            <MediaImage src={g.src} alt={g.alt} sizes="(max-width:1024px) 85vw, 35vw" /><div className="absolute inset-0 bg-gradient-to-t from-scrim/85 to-transparent" />
            <figcaption className="absolute inset-x-4 bottom-4 text-lg font-black text-on-media">{g.title}</figcaption>
          </figure>)}
        </div>
      </div>
    </div>
    <div className="mt-8 grid gap-6 rounded-media border border-glass-border bg-bg-elevated p-6 text-fg shadow-xl md:p-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
      <div><h3 className="text-2xl font-black sm:text-3xl">{form.title}</h3>{form.description && <p className="mt-2 text-sm leading-6 text-fg-muted">{form.description}</p>}</div>
      <DealerForm text={form} locale={locale} />
    </div>
  </>;
}
