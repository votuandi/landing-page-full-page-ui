"use client";
import { useActionState, useRef, useState } from "react";
import { slugify } from "@solar/db/collections";
import { createLanding } from "../actions.ts";

const field = "min-h-11 w-full min-w-0 rounded-input border border-line/30 bg-bg px-3 py-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
export function CreateLandingForm({ templates, pages }: { templates: { id: string; label: string }[]; pages: { id: string; title: string }[] }) {
  const [state, submit, pending] = useActionState(createLanding, {}, "/trang/moi");
  const [slug, setSlug] = useState("");
  const edited = useRef(false);
  return <form action={submit} aria-describedby={state.error ? "create-landing-error" : undefined} className="min-w-0 space-y-5">
    <label className="block space-y-2 text-fg">Tên trang<input name="title" required maxLength={200} autoComplete="off" className={field} onChange={event => { if (!edited.current) setSlug(slugify(event.target.value).slice(0, 120).replace(/-$/, "")); }} /></label>
    <label className="block space-y-2 text-fg">Đường dẫn<input name="slug" required maxLength={120} value={slug} onChange={event => { edited.current = true; setSlug(event.target.value); }} aria-describedby="landing-slug-help" className={field} autoComplete="off" autoCapitalize="none" spellCheck={false} /></label>
    <p id="landing-slug-help" className="text-sm text-fg-muted">Dùng chữ thường, số và dấu gạch ngang; tối đa 3 đoạn ngăn bằng dấu /.</p>
    <fieldset className="min-w-0 space-y-2">
      <legend className="font-medium text-fg">Bắt đầu từ</legend>
      {[{ id: "blank", label: "Trang trắng" }, { id: "template", label: "Mẫu trang" }, { id: "duplicate", label: "Nhân bản trang có sẵn" }].map(source => <label key={source.id} className="flex min-h-11 items-center gap-3 text-fg"><input type="radio" name="source" value={source.id} defaultChecked={source.id === "blank"} className="size-5 accent-primary" />{source.label}</label>)}
    </fieldset>
    <label className="block space-y-2 text-fg">Chọn mẫu<select name="templateId" className={field}>{templates.map(template => <option key={template.id} value={template.id}>{template.label}</option>)}</select></label>
    <label className="block space-y-2 text-fg">Trang nguồn<select name="sourcePageId" className={field}><option value="">Chọn trang nguồn</option>{pages.map(page => <option key={page.id} value={page.id}>{page.title}</option>)}</select></label>
    {state.error && <p id="create-landing-error" role="alert" className="text-sm text-danger">{state.error}</p>}
    <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-button bg-primary px-4 py-2 font-medium text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">{pending ? "Đang tạo…" : "Tạo trang"}</button>
  </form>;
}
