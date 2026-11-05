"use client";
import { useActionState, useId, useRef, useState } from "react";
import { slugify } from "@solar/db/collections";
import { createLanding } from "../actions.ts";

const field = "min-h-11 w-full min-w-0 rounded-input border border-line/30 bg-bg px-3 py-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const sources = [
  { id: "blank", label: "Trang trắng", hint: "Bắt đầu không có section, tự thêm từ thư viện." },
  { id: "template", label: "Mẫu trang", hint: "Bộ section dựng sẵn cho một chiến dịch." },
  { id: "duplicate", label: "Nhân bản trang có sẵn", hint: "Sao chép bố cục và nội dung nháp của một trang." },
] as const;

export function CreateLandingForm({ templates, pages }: { templates: { id: string; label: string }[]; pages: { id: string; title: string }[] }) {
  const [state, submit, pending] = useActionState(createLanding, {}, "/trang/moi");
  const [slug, setSlug] = useState("");
  const edited = useRef(false);
  const id = useId();
  // Each select sits under its radio and shows via `peer-checked`: CSS only, so the choice also works without JavaScript.
  const extra = (source: (typeof sources)[number]["id"]) => source === "template"
    ? <label className="block space-y-2 text-sm text-fg">Chọn mẫu<select name="templateId" className={field}>{templates.map(template => <option key={template.id} value={template.id}>{template.label}</option>)}</select></label>
    : source === "duplicate"
      ? <label className="block space-y-2 text-sm text-fg">Trang nguồn<select name="sourcePageId" className={field}><option value="">Chọn trang nguồn</option>{pages.map(page => <option key={page.id} value={page.id}>{page.title}</option>)}</select></label>
      : null;
  return <form action={submit} aria-describedby={state.error ? `${id}-error` : undefined} className="min-w-0 space-y-6 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
      <label className="block min-w-0 space-y-2 font-medium text-fg">Tên trang
        <input name="title" required maxLength={200} autoComplete="off" placeholder="Điện mặt trời cho trang trại…" className={`${field} font-normal`}
          onChange={event => { if (!edited.current) setSlug(slugify(event.target.value).slice(0, 120).replace(/-$/, "")); }} />
      </label>
      <div className="min-w-0 space-y-2">
        <label htmlFor={`${id}-slug`} className="block font-medium text-fg">Đường dẫn</label>
        <div className="flex min-w-0 items-stretch rounded-input border border-line/30 bg-bg focus-within:ring-2 focus-within:ring-primary">
          <span aria-hidden="true" className="flex items-center pl-3 text-fg-muted">/</span>
          <input id={`${id}-slug`} name="slug" required maxLength={120} value={slug} onChange={event => { edited.current = true; setSlug(event.target.value); }}
            aria-describedby={`${id}-slug-help`} placeholder="trang-trai…" autoComplete="off" autoCapitalize="none" spellCheck={false}
            className="min-h-11 w-full min-w-0 rounded-input bg-bg py-2 pl-1 pr-3 text-fg focus-visible:outline-none" />
        </div>
        <p id={`${id}-slug-help`} className="text-sm text-fg-muted">Chữ thường, số và dấu gạch ngang; tối đa 3 đoạn ngăn bằng dấu /.</p>
      </div>
    </div>
    <fieldset className="min-w-0 space-y-3">
      <legend className="mb-3 font-medium text-fg">Bắt đầu từ</legend>
      {sources.map(source => <div key={source.id} className="grid min-w-0 grid-cols-[auto_1fr] gap-x-3 rounded-card border border-line/20 bg-bg p-3">
        <input id={`${id}-${source.id}`} type="radio" name="source" value={source.id} defaultChecked={source.id === "blank"} aria-describedby={`${id}-${source.id}-hint`} className="peer mt-3 size-5 accent-primary" />
        <label htmlFor={`${id}-${source.id}`} className="flex min-h-11 min-w-0 cursor-pointer items-center font-medium text-fg">{source.label}</label>
        <p id={`${id}-${source.id}-hint`} className="col-start-2 text-sm text-fg-muted">{source.hint}</p>
        {extra(source.id) && <div className="col-start-2 mt-3 hidden min-w-0 peer-checked:block">{extra(source.id)}</div>}
      </div>)}
    </fieldset>
    {state.error && <p id={`${id}-error`} role="alert" className="text-sm text-danger">{state.error}</p>}
    <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-button bg-primary px-5 py-2 font-medium text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">{pending ? "Đang tạo…" : "Tạo trang"}</button>
  </form>;
}
