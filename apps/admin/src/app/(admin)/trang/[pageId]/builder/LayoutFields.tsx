"use client";

import { useId, useState } from "react";
import type { EditableSection } from "@solar/cms-ui";
import type { SectionLayout } from "@solar/sections";
import { anchorError, layoutOptions } from "../../../../../lib/layoutOptions.ts";

const control = "min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 py-2 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";
const names = { background: "Nền", spacing: "Khoảng cách", align: "Căn chỉnh" };
const labels = { default: "Mặc định", tint: "Nền dịu", sky: "Nền trời", sun: "Nền nắng", deep: "Nền đậm", invert: "Đảo sáng/tối", compact: "Gọn", normal: "Bình thường", loose: "Rộng", start: "Đầu", center: "Giữa" };

export default function LayoutFields({ section, themeSupportsDark, sections, disabled, onChange }: {
  section: EditableSection; themeSupportsDark: boolean; sections: readonly EditableSection[]; disabled: boolean;
  onChange(next: EditableSection): void;
}) {
  const options = layoutOptions(section.type, section.variant, themeSupportsDark);
  const [anchor, setAnchor] = useState(section.anchor ?? "");
  const errorId = useId();
  const error = anchorError(anchor, sections, section.id);
  function change(key: keyof SectionLayout, value: string) {
    if (disabled) return;
    const layout = { ...section.layout };
    if (!value || value === "default" || (key === "spacing" && value === "normal") || (key === "align" && value === "start")) delete layout[key];
    else Object.assign(layout, { [key]: value });
    const next = { ...section };
    if (Object.keys(layout).length) next.layout = layout;
    else delete next.layout;
    onChange(next);
  }
  function saveAnchor() {
    if (disabled || error || anchor === (section.anchor ?? "")) return;
    const next = { ...section };
    if (anchor) next.anchor = anchor;
    else delete next.anchor;
    onChange(next);
  }
  return <fieldset disabled={disabled} className="min-w-0 space-y-3 border-b border-line/20 pb-4">
    <legend className="text-sm font-semibold text-fg">Bố cục</legend>
    {/* select dùng htmlFor, không bọc trong label: label bọc select đưa option đang chọn vào accessible name. */}
    {(["background", "spacing", "align"] as const).map(key => options[key] && <div key={key} className="space-y-1 text-sm text-fg">
      <label htmlFor={`${errorId}-${key}`} className="block">{names[key]}</label>
      <select id={`${errorId}-${key}`} className={control} value={section.layout?.[key] ?? (key === "background" ? "default" : key === "spacing" ? "normal" : "start")} onChange={e => change(key, e.target.value)}>
        {options[key]!.map(value => <option key={value} value={value}>{labels[value]}</option>)}
      </select>
    </div>)}
    <div className="space-y-1 text-sm text-fg"><label htmlFor={`${errorId}-hideOn`} className="block">Ẩn trên</label>
      <select id={`${errorId}-hideOn`} className={control} value={section.layout?.hideOn ?? ""} onChange={e => change("hideOn", e.target.value)}>
        <option value="">Không ẩn</option><option value="mobile">Di động</option><option value="desktop">Máy tính</option>
      </select>
    </div>
    <label className="block space-y-1 text-sm text-fg"><span>Mã neo</span>
      <input className={control} value={anchor} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined}
        onChange={e => setAnchor(e.target.value)} onBlur={saveAnchor} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); saveAnchor(); } }} />
    </label>
    {error && <p id={errorId} role="alert" className="text-sm text-danger">{error}</p>}
  </fieldset>;
}
