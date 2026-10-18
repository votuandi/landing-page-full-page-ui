"use client";
import { useState } from "react";
import { BRAND_COLOR_KEYS, colorChannelsToHex, contrastRatio, hexToChannels, validateBrandOverrides, type ThemeOverrides, type ThemeTokens } from "@solar/tokens";

export function BrandColorsForm({ theme, initial, pending, save }: { theme: ThemeTokens; initial: ThemeOverrides; pending: boolean; save: (overrides: ThemeOverrides) => void }) {
  const [overrides, setOverrides] = useState(initial);
  const issues = validateBrandOverrides(theme, overrides);
  const update = (mode: "light" | "dark", key: typeof BRAND_COLOR_KEYS[number], value?: string) => setOverrides(previous => {
    const next = structuredClone(previous), colors = next.colors ??= {}, set = colors[mode] ??= {};
    if (value === undefined) delete set[key]; else set[key] = value;
    if (!Object.keys(set).length) delete colors[mode];
    if (!Object.keys(colors).length) delete next.colors;
    return next;
  });
  const labels = { primary: "Màu chính", secondary: "Màu phụ", accent: "Màu nhấn" };
  const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
  const ratio = (value: number) => `${value.toFixed(1).replace(".", ",")}:1`;
  return <form className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6" onSubmit={event => { event.preventDefault(); save(overrides); }}>
    <h2 className="text-lg font-semibold text-fg">Màu thương hiệu</h2>
    <p className="text-sm text-fg-muted">Chữ trên màu thương hiệu cần đạt tỷ lệ tương phản tối thiểu 4,5:1 để dễ đọc. Bấm “Dùng màu theme” để bỏ màu tùy chỉnh.</p>
    <fieldset disabled={pending} className="min-w-0 space-y-5"><legend className="sr-only">Chỉnh màu thương hiệu</legend>
      {(["light", ...(theme.meta.supportsDark ? ["dark"] : [])] as ("light" | "dark")[]).map(mode => <div key={mode} className="space-y-3">
        <h3 className="font-semibold text-fg">{mode === "light" ? "Chế độ sáng" : "Chế độ tối"}</h3>
        <div className="grid gap-4 md:grid-cols-3">{BRAND_COLOR_KEYS.map(key => {
          const colors = mode === "light" ? { ...theme.colors.light, ...overrides.colors?.light } : { ...theme.colors.light, ...overrides.colors?.light, ...theme.colors.dark, ...overrides.colors?.dark };
          const issue = issues.find(i => i.mode === mode && i.key === key), id = `brand-${mode}-${key}`;
          return <div key={key} className={`min-w-0 space-y-3 rounded-card border bg-bg p-4 ${issue ? "border-danger" : "border-line/20"}`}>
            <label htmlFor={id} className="block font-medium text-fg">{labels[key]} ({mode === "light" ? "sáng" : "tối"})</label>
            <input id={id} type="color" value={colorChannelsToHex(colors[key])} className={`min-h-11 w-full cursor-pointer rounded-input border border-line/20 bg-bg ${focus}`} aria-invalid={Boolean(issue)} aria-describedby={issue ? `${id}-error` : undefined} onChange={event => update(mode, key, hexToChannels(event.target.value))} />
            <p className="flex items-center justify-between gap-3 rounded-input px-3 py-2 font-semibold" style={{ backgroundColor: colorChannelsToHex(colors[key]), color: colorChannelsToHex(colors[`on-${key}`]) }}><span>Chữ trên nền</span><span className="tabular-nums">{ratio(contrastRatio(colors[key], colors[`on-${key}`]))}</span></p>
            <p className="text-xs text-fg-muted"><span className="font-mono uppercase text-fg">{colorChannelsToHex(colors[key])}</span> · {overrides.colors?.[mode]?.[key] ? "màu tùy chỉnh" : "màu của theme"}</p>
            <button type="button" disabled={!overrides.colors?.[mode]?.[key]} className={`min-h-11 rounded-button px-2 text-sm text-primary disabled:text-fg-muted disabled:opacity-60 ${focus}`} onClick={() => update(mode, key)}>Dùng màu theme</button>
            {issue && <div id={`${id}-error`} role="status" aria-live="polite" className="space-y-2 text-sm text-danger">
              <p>Chỉ đạt <span className="tabular-nums">{ratio(issue.ratio)}</span>; cần ≥ 4,5:1. Gợi ý: <span className="font-mono uppercase">{colorChannelsToHex(issue.suggestion)}</span></p>
              <button type="button" className={`inline-flex min-h-11 items-center gap-2 rounded-button border border-line/20 px-3 text-fg ${focus}`} onClick={() => update(mode, key, issue.suggestion)}><span aria-hidden="true" className="size-4 rounded-pill border border-line/20" style={{ backgroundColor: colorChannelsToHex(issue.suggestion) }} />Dùng màu gợi ý</button>
            </div>}
          </div>;
        })}</div>
      </div>)}
      <button disabled={issues.length > 0} className={`min-h-11 rounded-button bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50 ${focus}`}>Lưu màu thương hiệu</button>
    </fieldset>
  </form>;
}
