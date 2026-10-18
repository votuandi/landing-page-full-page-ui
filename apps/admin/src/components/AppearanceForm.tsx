"use client";
import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { themes, getTheme } from "@solar/themes";
import { plans, themeAllowed, themeLabels, type ThemeGroup } from "@solar/plans";
import { colorChannelsToHex, type ThemeOverrides } from "@solar/tokens";
import { saveTheme, previewTheme, saveColors, saveLogos } from "../app/(admin)/giao-dien/actions.ts";
import type { AdminAction, ActionResult } from "../lib/action.ts";
import { BrandColorsForm } from "./BrandColorsForm.tsx";

const requiredPlan = (group: ThemeGroup) => Object.values(plans).find(plan => plan.themes.includes(group))!.name;
const subscribeNothing = () => () => {};
export function AppearanceForm({ themeId, planId, overrides, logo, logoDark, updatedAt, canOverride }: {
  themeId: string; planId: string; overrides: ThemeOverrides; logo?: string; logoDark?: string; updatedAt: string; canOverride: boolean;
}) {
  const [selected, setSelected] = useState(themeId), [currentTheme, setCurrentTheme] = useState(themeId), [version, setVersion] = useState(updatedAt);
  const [result, setResult] = useState<ActionResult>({}), [pending, start] = useTransition(), router = useRouter();
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const submit = (action: AdminAction, payload: unknown, done?: (response: ActionResult) => void) => start(async () => {
    setResult({});
    const form = new FormData(); form.set("payload", JSON.stringify(payload)); form.set("updatedAt", version);
    try {
      const response = await action({}, form); setResult(response);
      if (response.updatedAt) setVersion(response.updatedAt);
      done?.(response);
      if (response.ok) router.refresh();
    } catch { const error = { error: "Không thể kết nối. Vui lòng thử lại." }; setResult(error); done?.(error); }
  });
  const openPreview = (id: string) => {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    submit(previewTheme, { themeId: id }, response => {
      if (!response.ok || !response.url) tab?.close();
      else if (tab) tab.location.replace(response.url);
    });
  };
  return <section className="min-w-0 space-y-8">
    <h1>Giao diện</h1>
    <div role="status" aria-live="polite" className={result.error ? "break-words text-danger" : "text-fg"}>{pending ? "Đang xử lý…" : result.error ?? result.message}</div>
    {result.url && <a className="inline-flex min-h-11 items-center" href={result.url} target="_blank" rel="noopener noreferrer">Mở trang xem thử (tab mới)</a>}
    <form onSubmit={event => { event.preventDefault(); submit(saveTheme, { themeId: selected }, response => { if (response.ok) setCurrentTheme(selected); }); }} className="space-y-4">
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4"><legend className="mb-3 text-lg font-semibold">Chọn theme</legend>
        <p className="text-sm text-fg-muted">Đổi theme giữ nguyên nội dung. Dùng Xem thử để kiểm tra trước khi lưu.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{themes.map(theme => {
          const allowed = themeAllowed(planId, theme.meta.group), active = theme.meta.id === currentTheme;
          return <div key={theme.meta.id} className={`min-w-0 rounded-card border p-4 ${selected === theme.meta.id ? "border-primary bg-bg-tint" : "border-line/20 bg-bg-elevated"}`}>
            <label className="flex min-h-11 items-center gap-3 font-semibold"><input type="radio" name="theme" value={theme.meta.id} checked={selected === theme.meta.id} disabled={!allowed} onChange={() => setSelected(theme.meta.id)} />{theme.meta.name}{active && <span className="text-xs text-fg-muted">Đang dùng</span>}</label>
            <p className="text-sm text-fg-muted">{themeLabels[theme.meta.group]}</p>
            <div aria-hidden="true" className="my-3 flex h-12 overflow-hidden rounded-input">{(["primary", "secondary", "accent", "bg"] as const).map(key => <span key={key} className="flex-1" style={{ backgroundColor: colorChannelsToHex(theme.colors.light[key]) }} />)}</div>
            {!allowed ? <p className="min-h-11 text-sm text-fg-muted">Đã khóa · Cần gói {requiredPlan(theme.meta.group)}</p> : <button type="button" className="min-h-11 rounded-button px-2 text-primary" onClick={() => openPreview(theme.meta.id)}>Xem thử {theme.meta.name} (tab mới)</button>}
          </div>;
        })}</div>
        <button disabled={!themeAllowed(planId, getTheme(selected)!.meta.group)} className="min-h-11 rounded-button bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50">Lưu theme</button>
      </fieldset>
    </form>
    {canOverride && <BrandColorsForm key={currentTheme} theme={getTheme(currentTheme)!} initial={overrides} pending={!ready || pending} save={value => submit(saveColors, value)} />}
    <form className="space-y-4" onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); submit(saveLogos, { logo: data.get("logo") || undefined, logoDark: data.get("logoDark") || undefined }); }}>
      <h2>Logo sáng và tối</h2>
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4"><legend className="sr-only">Đường dẫn logo</legend>
        <p className="text-sm text-fg-muted">Nhập đường dẫn ảnh của website hoặc URL HTTPS. Để trống để bỏ logo.</p>
        <label className="block space-y-2"><span>Logo sáng</span><input name="logo" defaultValue={logo ?? ""} className="min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 text-fg" /></label>
        <label className="block space-y-2"><span>Logo tối</span><input name="logoDark" defaultValue={logoDark ?? ""} className="min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 text-fg" /></label>
        <button className="min-h-11 rounded-button bg-primary px-4 py-2 font-semibold text-on-primary">Lưu logo</button>
      </fieldset>
    </form>
  </section>;
}
