"use client";

import { useState } from "react";
import type { Localized } from "@solar/sections";
import { issuesUnder } from "../schema/path.ts";
import { useSchemaForm, type FieldProps } from "../context.ts";
import { describedBy, FieldShell, inputClass } from "../ui.tsx";
import { fieldId } from "../fields/Field.tsx";

export type Locale = "vi" | "en";

/** Chọn bản VI/EN đang sửa; EN chỉ hiện khi site có `bilingual` (giá trị EN cũ vẫn được giữ nguyên). */
export function LocaleTabs({ id, locale, onChange }: { id: string; locale: Locale; onChange(locale: Locale): void }) {
  const { bilingual } = useSchemaForm();
  if (!bilingual) return null;
  return (
    <div role="group" aria-label="Ngôn ngữ đang sửa" className="inline-flex rounded-pill border border-line/20 p-0.5 text-xs font-semibold">
      {(["vi", "en"] as const).map((item) => (
        <button key={item} type="button" aria-controls={id} aria-pressed={locale === item}
          aria-label={item === "vi" ? "Tiếng Việt" : "Tiếng Anh"} onClick={() => onChange(item)}
          className={`min-h-7 rounded-pill px-2.5 uppercase ${locale === item ? "bg-primary text-on-primary" : "text-fg-muted hover:text-fg"}`}>
          {item}
        </button>
      ))}
    </div>
  );
}

/** Đọc max của `localized({ max })` từ schema con `vi`. */
function maxOf(schema: unknown): number | undefined {
  const vi = (schema as { shape?: { vi?: { maxLength?: number | null } } }).shape?.vi;
  return vi?.maxLength ?? undefined;
}

export function LocalizedField({ node, path, value, label }: FieldProps<Localized | undefined>) {
  const { idPrefix, issues, update } = useSchemaForm();
  const [locale, setLocale] = useState<Locale>("vi");
  if (node.kind !== "widget") return null;
  const id = fieldId(idPrefix, path);
  const errors = issuesUnder(issues, path);
  const current = value ?? { vi: "" };
  const text = (locale === "en" ? current.en : current.vi) ?? "";
  const max = maxOf(node.schema);
  const multiline = node.widget === "localizedTextarea";
  const set = (next: string) => {
    if (locale === "vi") update(path, { ...current, vi: next });
    else {
      // Xóa trắng bản EN = bỏ khóa `en` để site hiển thị bản VI.
      const { en: _en, ...rest } = current;
      update(path, next === "" ? rest : { ...current, en: next });
    }
  };
  const common = {
    id, value: text, maxLength: max, className: inputClass,
    placeholder: locale === "en" ? current.vi || "English" : undefined,
    "aria-invalid": errors.length ? true : undefined, "aria-describedby": describedBy(id, undefined, errors),
    onChange: (event: { target: { value: string } }) => set(event.target.value),
  };
  return (
    <FieldShell id={id} label={label} errors={errors} aside={
      <span className="flex items-center gap-2">
        {max && <span className="text-xs tabular-nums text-fg-subtle">{text.length}/{max}</span>}
        <LocaleTabs id={id} locale={locale} onChange={setLocale} />
      </span>
    }>
      {multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />}
    </FieldShell>
  );
}
