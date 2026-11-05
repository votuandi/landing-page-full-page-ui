"use client";
import { useActionState } from "react";
import type { PageSettings } from "@solar/presets";
import { saveLandingSettings } from "../actions.ts";

const field = "min-h-11 w-full min-w-0 rounded-input border border-line/30 bg-bg px-3 py-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
export function PageSettingsForm({ pageId, title, settings, locales }: { pageId: string; title: { vi: string; en?: string }; settings: PageSettings; locales: string[] }) {
  const [state, submit, pending] = useActionState(saveLandingSettings, {}, `/trang/${pageId}`);
  const english = locales.includes("en");
  return <section aria-labelledby="page-settings" className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4">
    <h2 id="page-settings" className="text-lg font-semibold text-fg">Cài đặt trang</h2>
    <form action={submit} aria-describedby={state.error ? "page-settings-error" : undefined} className="min-w-0 space-y-4">
      <input type="hidden" name="pageId" value={pageId} />
      <label className="block space-y-2 text-fg">Tên trang<input name="title" required maxLength={200} defaultValue={title.vi} className={field} /></label>
      {english ? <label className="block space-y-2 text-fg">Tên trang (EN)<input name="titleEn" maxLength={200} defaultValue={title.en} className={field} /></label> : <input type="hidden" name="titleEn" value={title.en ?? ""} />}
      <label className="block space-y-2 text-fg">Tiêu đề SEO<input name="seoTitle" maxLength={70} defaultValue={settings.seo?.title?.vi} className={field} /></label>
      <label className="block space-y-2 text-fg">Mô tả SEO<textarea name="seoDescription" maxLength={160} defaultValue={settings.seo?.description?.vi} className={field} /></label>
      {english ? <>
        <label className="block space-y-2 text-fg">Tiêu đề SEO (EN)<input name="seoTitleEn" maxLength={70} defaultValue={settings.seo?.title?.en} className={field} /></label>
        <label className="block space-y-2 text-fg">Mô tả SEO (EN)<textarea name="seoDescriptionEn" maxLength={160} defaultValue={settings.seo?.description?.en} className={field} /></label>
      </> : <><input type="hidden" name="seoTitleEn" value={settings.seo?.title?.en ?? ""} /><input type="hidden" name="seoDescriptionEn" value={settings.seo?.description?.en ?? ""} /></>}
      <fieldset className="min-w-0 space-y-2">
        <legend className="font-medium text-fg">Hiển thị</legend>
        {[{ name: "noindex", label: "Ẩn khỏi công cụ tìm kiếm", checked: settings.seo?.noindex }, { name: "hideHeader", label: "Ẩn header", checked: settings.hideHeader }, { name: "hideFooter", label: "Ẩn footer", checked: settings.hideFooter }].map(item => <label key={item.name} className="flex min-h-11 items-center gap-3 text-fg"><input type="checkbox" name={item.name} defaultChecked={item.checked} className="size-5 accent-primary" />{item.label}</label>)}
      </fieldset>
      {state.error && <p id="page-settings-error" role="alert" className="text-sm text-danger">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-fg-muted">{state.message}</p>}
      <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-button bg-primary px-4 py-2 font-medium text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60">{pending ? "Đang lưu…" : "Lưu cài đặt"}</button>
    </form>
  </section>;
}
