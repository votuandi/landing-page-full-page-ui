"use client";
import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { themes, getTheme, FONT_FAMILIES } from "@solar/themes";
import { plans, themeAllowed, themeLabels, type ThemeGroup } from "@solar/plans";
import { colorChannelsToHex, type ThemeOverrides } from "@solar/tokens";
import { saveTheme, previewTheme, saveColors, saveLogos, saveFonts, saveFavicon } from "../app/(admin)/giao-dien/actions.ts";
import type { AdminAction, ActionResult } from "../lib/action.ts";
import { BrandColorsForm } from "./BrandColorsForm.tsx";
import { UpgradeRequest } from "./UpgradeRequest.tsx";

const requiredPlan = (group: ThemeGroup) => Object.values(plans).find(plan => plan.themes.includes(group))!.name;
const subscribeNothing = () => () => {};
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const primaryButton = `min-h-11 rounded-button bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50 ${focus}`;
const panel = "min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6";
export function AppearanceForm({ themeId, planId, overrides, logo, logoDark, favicon, images = [], updatedAt, canOverride, warning }: {
  themeId: string; planId: string; overrides: ThemeOverrides; logo?: string; logoDark?: string; favicon?: string; images?: { id: string; alt: string; mime: string }[]; updatedAt: string; canOverride: boolean; warning?: string;
}) {
  const [selected, setSelected] = useState(themeId), [currentTheme, setCurrentTheme] = useState(themeId), [version, setVersion] = useState(updatedAt);
  const [result, setResult] = useState<ActionResult>({}), [pending, start] = useTransition(), router = useRouter();
  const [upgrade, setUpgrade] = useState<string>();
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
  return <section className="min-w-0 max-w-6xl space-y-6">
    <header className="space-y-1"><h1 className="text-2xl font-semibold text-fg">Giao diện</h1>
      <p className="text-sm text-fg-muted">Chọn theme, màu thương hiệu, font chữ và biểu tượng. Thay đổi áp dụng cho toàn website khi lưu.</p></header>
    {warning && <p role="alert" className="text-sm text-danger">{warning}</p>}
    {upgrade && <UpgradeRequest key={upgrade} feature={upgrade} onClose={() => setUpgrade(undefined)} />}
    <div role="status" aria-live="polite" className={`break-words text-sm ${result.error ? "font-medium text-danger" : "text-fg"}`}>{pending ? "Đang xử lý…" : result.error ?? result.message}</div>
    {result.url && <a className={`inline-flex min-h-11 items-center rounded-button text-sm text-primary underline-offset-4 hover:underline ${focus}`} href={result.url} target="_blank" rel="noopener noreferrer">Mở trang xem thử (tab mới)</a>}
    <form onSubmit={event => { event.preventDefault(); submit(saveTheme, { themeId: selected }, response => { if (response.ok) setCurrentTheme(selected); }); }} className={panel}>
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4"><legend className="text-lg font-semibold text-fg">Chọn theme</legend>
        <p className="text-sm text-fg-muted">Đổi theme giữ nguyên nội dung. Dùng Xem thử để kiểm tra trước khi lưu.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{themes.map(theme => {
          const allowed = themeAllowed(planId, theme.meta.group), active = theme.meta.id === currentTheme;
          return <div key={theme.meta.id} className={`flex min-w-0 flex-col rounded-card border p-4 ${selected === theme.meta.id ? "border-primary bg-bg-tint ring-1 ring-primary" : "border-line/20 bg-bg"} ${allowed ? "" : "border-dashed"}`}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold text-fg"><input type="radio" name="theme" value={theme.meta.id} checked={selected === theme.meta.id} disabled={!allowed} onChange={() => setSelected(theme.meta.id)} className="size-4 accent-primary" /><span className="min-w-0 flex-1 break-words">{theme.meta.name}</span>{active && <span className="shrink-0 rounded-pill bg-primary px-2 py-0.5 text-xs font-medium text-on-primary">{allowed ? "Đang dùng" : "Đã lưu"}</span>}</label>
            <p className="text-sm text-fg-muted">{themeLabels[theme.meta.group]}</p>
            <div aria-hidden="true" className="my-3 flex h-10 overflow-hidden rounded-input border border-line/20">{(["primary", "secondary", "accent", "bg"] as const).map(key => <span key={key} className="flex-1" style={{ backgroundColor: colorChannelsToHex(theme.colors.light[key]) }} />)}</div>
            <div className="mt-auto space-y-2">
              {!allowed && <p className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-fg-muted"><span className="rounded-pill border border-line/20 px-2 py-0.5 text-xs font-medium text-fg">Đã khóa</span>Cần gói {requiredPlan(theme.meta.group)} để dùng theme này</p>}
              <div className="flex flex-wrap gap-2"><button type="button" className={`min-h-11 rounded-button border border-line/20 px-3 text-sm font-medium text-primary hover:bg-bg-tint ${focus}`} onClick={() => openPreview(theme.meta.id)}>Xem thử<span className="sr-only"> {theme.meta.name} (mở tab mới)</span></button>
                {!allowed && <button type="button" aria-label={`Nâng cấp: ${theme.meta.name}`} className={`min-h-11 rounded-button border border-primary/40 px-3 text-sm font-medium text-primary hover:bg-bg-tint ${focus}`} onClick={() => setUpgrade(`theme:${theme.meta.group}`)}>Nâng cấp</button>}</div>
            </div>
          </div>;
        })}</div>
        <div className="flex flex-wrap items-center gap-3"><button disabled={!themeAllowed(planId, getTheme(selected)!.meta.group) || selected === currentTheme} aria-describedby={selected === currentTheme ? "theme-save-hint" : undefined} className={primaryButton}>Lưu theme</button>
          {selected === currentTheme && <p id="theme-save-hint" className="text-sm text-fg-muted">Chọn một theme khác để lưu.</p>}</div>
      </fieldset>
    </form>
    {canOverride && <BrandColorsForm key={currentTheme} theme={getTheme(currentTheme)!} initial={overrides} pending={!ready || pending} save={value => submit(saveColors, value)} />}
    {canOverride && <form key={`fonts:${currentTheme}:${JSON.stringify(overrides.font)}`} className={panel} onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      submit(saveFonts, Object.fromEntries((["sans", "display"] as const).flatMap(role => data.get(role) ? [[role, data.get(role)]] : [])));
    }}>
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4"><legend className="text-lg font-semibold text-fg">Font chữ</legend>
        <p className="text-sm text-fg-muted">Chọn font thương hiệu hoặc dùng font theo theme. Font cần hỗ trợ đầy đủ độ đậm của theme.</p>
        <div className="grid gap-4 md:grid-cols-2">{(["sans", "display"] as const).map(role => <label key={role} className="block space-y-2">
          <span className="font-medium text-fg">{role === "sans" ? "Chữ nội dung" : "Tiêu đề"}</span>
          <select name={role} defaultValue={overrides.font?.[role] ?? ""} className={`min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 text-fg ${focus}`}>
            <option value="">Theo theme ({getTheme(currentTheme)!.font[role]})</option>
            {FONT_FAMILIES.map(family => <option key={family} value={family}>{family}</option>)}
          </select>
        </label>)}</div>
        <button className={primaryButton}>Lưu font</button>
      </fieldset>
    </form>}
    <form key={`favicon:${favicon ?? "default"}`} className={panel} onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); submit(saveFavicon, { favicon: data.get("favicon") || null });
    }}>
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4"><legend className="text-lg font-semibold text-fg">Biểu tượng website</legend>
        <p className="text-sm text-fg-muted">Chọn ảnh từ thư viện. Ảnh sẽ được cắt vuông để dùng trên trình duyệt và thiết bị Apple.</p>
        <label className="flex min-h-11 items-center gap-3 text-fg"><input type="radio" name="favicon" value="" defaultChecked={!favicon} className="size-4 accent-primary" />Biểu tượng mặc định</label>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{images.filter(image => ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"].includes(image.mime)).map(image =>
          <label key={image.id} className="flex min-h-11 min-w-0 items-center gap-3 rounded-input border border-line/20 p-3 text-fg">
            <input type="radio" name="favicon" value={image.id} defaultChecked={favicon === image.id} className="size-4 shrink-0 accent-primary" />
            {/* Admin thumbnails use the authenticated media endpoint. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/media/${image.id}`} alt="" width={40} height={40} loading="lazy" className="size-10 shrink-0 rounded-media object-cover" />
            <span className="min-w-0 break-words text-sm">{image.alt || image.id}</span>
          </label>)}</div>
        {!images.length && <p className="text-sm text-fg-muted">Chưa có ảnh. <a className={`text-primary underline ${focus}`} href="/media">Tải ảnh lên thư viện</a> rồi quay lại để chọn.</p>}
        <button className={primaryButton}>Lưu biểu tượng</button>
      </fieldset>
    </form>
    <form className={panel} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); submit(saveLogos, { logo: data.get("logo") || undefined, logoDark: data.get("logoDark") || undefined }); }}>
      <h2 className="text-lg font-semibold text-fg">Logo sáng và tối</h2>
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4"><legend className="sr-only">Đường dẫn logo</legend>
        <p className="text-sm text-fg-muted">Nhập đường dẫn ảnh trên website (bắt đầu bằng /) hoặc URL HTTPS. Để trống để bỏ logo.</p>
        <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2"><span className="font-medium text-fg">Logo sáng</span><input name="logo" type="text" inputMode="url" autoComplete="off" spellCheck={false} placeholder="/images/logo.svg" defaultValue={logo ?? ""} className={`min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 text-fg ${focus}`} /></label>
        <label className="block space-y-2"><span className="font-medium text-fg">Logo tối</span><input name="logoDark" type="text" inputMode="url" autoComplete="off" spellCheck={false} placeholder="/images/logo-dark.svg" defaultValue={logoDark ?? ""} className={`min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 text-fg ${focus}`} /></label>
        </div>
        <button className={primaryButton}>Lưu logo</button>
      </fieldset>
    </form>
  </section>;
}
