"use client";
import { useState } from "react";
import { BRAND_COLOR_KEYS, colorChannelsToHex, hexToChannels, validateBrandOverrides, type ThemeOverrides, type ThemeTokens } from "@solar/tokens";

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
  return <form className="space-y-4" onSubmit={event => { event.preventDefault(); save(overrides); }}>
    <h2>Màu thương hiệu</h2>
    <p className="text-sm text-fg-muted">Dùng màu theme để xóa màu tùy chỉnh. Chữ trên màu thương hiệu cần đạt tỷ lệ tương phản 4,5:1.</p>
    <fieldset disabled={pending} className="min-w-0 space-y-5"><legend className="sr-only">Chỉnh màu thương hiệu</legend>
      {(["light", ...(theme.meta.supportsDark ? ["dark"] : [])] as ("light" | "dark")[]).map(mode => <div key={mode} className="space-y-3">
        <h3 className="font-semibold">{mode === "light" ? "Chế độ sáng" : "Chế độ tối"}</h3>
        <div className="grid gap-4 md:grid-cols-3">{BRAND_COLOR_KEYS.map(key => {
          const colors = mode === "light" ? { ...theme.colors.light, ...overrides.colors?.light } : { ...theme.colors.light, ...overrides.colors?.light, ...theme.colors.dark, ...overrides.colors?.dark };
          const issue = issues.find(i => i.mode === mode && i.key === key), id = `brand-${mode}-${key}`;
          return <div key={key} className="space-y-2 rounded-card border border-line/20 p-4">
            <label htmlFor={id} className="block font-medium">{labels[key]} ({mode === "light" ? "sáng" : "tối"})</label>
            <input id={id} type="color" value={colorChannelsToHex(colors[key])} className="min-h-11 w-full cursor-pointer rounded-input border border-line/20 bg-bg" aria-invalid={Boolean(issue)} aria-describedby={issue ? `${id}-error` : undefined} onChange={event => update(mode, key, hexToChannels(event.target.value))} />
            <p className="rounded-input px-3 py-2" style={{ backgroundColor: colorChannelsToHex(colors[key]), color: colorChannelsToHex(colors[`on-${key}`]) }}>Chữ trên nền</p>
            <p className="text-xs text-fg-muted">{overrides.colors?.[mode]?.[key] ? "Màu tùy chỉnh" : "Màu theme"}</p>
            <button type="button" className="min-h-11 rounded-button px-2 text-primary" onClick={() => update(mode, key)}>Dùng màu theme</button>
            {issue && <div id={`${id}-error`} role="status" aria-live="polite" className="space-y-2 text-sm text-danger">
              <p>Chỉ đạt {issue.ratio.toFixed(1).replace(".", ",")}:1; cần ≥ 4,5:1. Gợi ý: {colorChannelsToHex(issue.suggestion)}</p>
              <button type="button" className="min-h-11 rounded-button border border-line/20 px-3 text-fg" onClick={() => update(mode, key, issue.suggestion)}>Dùng màu gợi ý</button>
            </div>}
          </div>;
        })}</div>
      </div>)}
      <button disabled={issues.length > 0} className="min-h-11 rounded-button bg-primary px-4 py-2 font-semibold text-on-primary disabled:opacity-50">Lưu màu thương hiệu</button>
    </fieldset>
  </form>;
}
