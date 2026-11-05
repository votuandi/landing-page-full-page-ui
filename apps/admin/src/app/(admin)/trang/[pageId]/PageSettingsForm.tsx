"use client";
import { useActionState, useId } from "react";
import type { PageSettings } from "@solar/presets";
import { saveLandingSettings } from "../actions.ts";

const field = "min-h-11 w-full min-w-0 rounded-input border border-line/30 bg-bg px-3 py-2 font-normal text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const label = "block min-w-0 space-y-2 font-medium text-fg";
export function PageSettingsForm({ pageId, title, settings, locales }: { pageId: string; title: { vi: string; en?: string }; settings: PageSettings; locales: string[] }) {
  const [state, submit, pending] = useActionState(saveLandingSettings, {}, `/trang/${pageId}`);
  const english = locales.includes("en");
  const id = useId();
  const toggles = [
    { name: "noindex", label: "Ẩn khỏi công cụ tìm kiếm", hint: "Không đưa vào sitemap, báo Google không lập chỉ mục.", checked: settings.seo?.noindex },
    { name: "hideHeader", label: "Ẩn header", hint: "Phù hợp trang quảng cáo: khách không rời trang qua menu.", checked: settings.hideHeader },
    { name: "hideFooter", label: "Ẩn footer", hint: "Bỏ chân trang chung của website.", checked: settings.hideFooter },
  ];
  return <section aria-labelledby={`${id}-heading`} className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
    <div className="space-y-1">
      <h2 id={`${id}-heading`} className="text-lg font-semibold text-fg">Cài đặt trang</h2>
      <p className="text-sm text-fg-muted">Áp dụng ngay khi lưu, kể cả trang đã xuất bản.</p>
    </div>
    <form action={submit} aria-describedby={state.error ? `${id}-error` : undefined} className="min-w-0 space-y-5">
      <input type="hidden" name="pageId" value={pageId} />
      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <label className={label}>Tên trang<input name="title" required maxLength={200} autoComplete="off" defaultValue={title.vi} className={field} /></label>
        {english ? <label className={label}>Tên trang (EN)<input name="titleEn" maxLength={200} autoComplete="off" defaultValue={title.en} className={field} /></label> : <input type="hidden" name="titleEn" value={title.en ?? ""} />}
        <label className={`${label} md:col-start-1`}>Tiêu đề SEO<input name="seoTitle" maxLength={70} autoComplete="off" defaultValue={settings.seo?.title?.vi} aria-describedby={`${id}-seo-help`} className={field} /></label>
        <label className={label}>Mô tả SEO<textarea name="seoDescription" rows={3} maxLength={160} defaultValue={settings.seo?.description?.vi} className={field} /></label>
        {english ? <>
          <label className={label}>Tiêu đề SEO (EN)<input name="seoTitleEn" maxLength={70} autoComplete="off" defaultValue={settings.seo?.title?.en} className={field} /></label>
          <label className={label}>Mô tả SEO (EN)<textarea name="seoDescriptionEn" rows={3} maxLength={160} defaultValue={settings.seo?.description?.en} className={field} /></label>
        </> : <><input type="hidden" name="seoTitleEn" value={settings.seo?.title?.en ?? ""} /><input type="hidden" name="seoDescriptionEn" value={settings.seo?.description?.en ?? ""} /></>}
      </div>
      <p id={`${id}-seo-help`} className="-mt-2 text-sm text-fg-muted">Tối đa 70 ký tự; để trống sẽ dùng tên trang. Mô tả tối đa 160 ký tự.</p>
      <fieldset className="min-w-0">
        <legend className="mb-2 font-medium text-fg">Hiển thị</legend>
        <div className="grid min-w-0 gap-2 md:grid-cols-3">
          {toggles.map(item => <div key={item.name} className="grid min-w-0 grid-cols-[auto_1fr] gap-x-3 rounded-card border border-line/20 bg-bg p-3">
            <input id={`${id}-${item.name}-input`} type="checkbox" name={item.name} defaultChecked={item.checked} aria-describedby={`${id}-${item.name}`} className="mt-3 size-5 accent-primary" />
            <label htmlFor={`${id}-${item.name}-input`} className="flex min-h-11 cursor-pointer items-center font-medium text-fg">{item.label}</label>
            <p id={`${id}-${item.name}`} className="col-start-2 text-sm text-fg-muted">{item.hint}</p>
          </div>)}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-button bg-primary px-5 py-2 font-medium text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">{pending ? "Đang lưu…" : "Lưu cài đặt"}</button>
        {state.error && <p id={`${id}-error`} role="alert" className="text-sm text-danger">{state.error}</p>}
        {state.message && <p role="status" className="text-sm text-fg-muted">{state.message}</p>}
      </div>
    </form>
  </section>;
}
