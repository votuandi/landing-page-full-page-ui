"use client";

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from "react";
import { SchemaForm, useAutosave, validate, type EditableSection } from "@solar/cms-ui";
import { sectionRegistry } from "@solar/sections";
import type { BuilderEditor, PageSectionResult } from "../../../../../lib/pageSections.ts";

export type BuilderPanelHandle = { flush(): Promise<{ ok: boolean; error?: string }> };
type Form = BuilderEditor["forms"][string];
const messages = { saved: "Đã lưu nháp", pending: "Đang chờ lưu…", saving: "Đang lưu…", invalid: "Có lỗi cần sửa — chưa lưu", error: "Không lưu được nội dung", conflict: "Trang đã thay đổi ở nơi khác" };
export default function BuilderPanel({ ref, section, form, bilingual, disabled, onChange, save, onDirty }: {
  ref: Ref<BuilderPanelHandle>; section: EditableSection; form: Form; bilingual: boolean; disabled: boolean;
  onChange(data: unknown): void; save(data: unknown): Promise<PageSectionResult>; onDirty(dirty: boolean): void;
}) {
  const def = sectionRegistry.getType(section.type)!;
  const [formValid, setFormValid] = useState(true);
  const saved = useRef(JSON.stringify(form.data));
  const failure = useRef<string | undefined>(undefined);
  const latest = useRef({ form, formValid, disabled });
  useLayoutEffect(() => { latest.current = { form, formValid, disabled }; });
  const autosave = useAutosave(form.data, {
    valid: next => !disabled && !form.readOnly && formValid && validate(def.schema, next).success,
    save: async next => {
      const result = await save(next);
      if (!result.ok || result.revision === undefined) {
        failure.current = result.error ?? "Không thể lưu. Vui lòng thử lại.";
        return { ok: false, error: failure.current, conflict: result.status === 409 };
      }
      saved.current = JSON.stringify(next); failure.current = undefined;
      return { ok: true };
    },
  });
  const { flush } = autosave;
  useEffect(() => { onDirty(!formValid || JSON.stringify(form.data) !== saved.current); }, [form.data, formValid, autosave.status, onDirty]);
  useImperativeHandle(ref, () => ({ async flush() {
    const current = latest.current;
    if (!current.formValid || !validate(def.schema, current.form.data).success) return { ok: false, error: "Nội dung có lỗi. Vui lòng sửa trước khi chọn section khác." };
    if (JSON.stringify(current.form.data) === saved.current) return { ok: true };
    await flush();
    return JSON.stringify(latest.current.form.data) === saved.current ? { ok: true } : { ok: false, error: failure.current ?? "Chưa lưu được nội dung. Vui lòng thử lại." };
  } }), [flush, def.schema]);
  return <section aria-label="Thuộc tính section" className="min-w-0 space-y-4">
    <h2 className="text-xl font-semibold text-fg">{def.meta.label.vi}</h2>
    {form.recovered && <p role="alert" className="text-sm text-danger">Dữ liệu cũ không đọc được, đang hiển thị mặc định</p>}
    {form.readOnly && <p role="alert" className="text-sm text-danger">{form.readOnly}</p>}
    <p role="status" className="text-sm text-fg-muted">{disabled ? "Bạn chỉ có quyền xem nội dung." : form.readOnly ? "Nội dung chỉ đọc" : messages[autosave.status]}</p>
    {autosave.error && <p role="alert" className="text-sm text-danger">{autosave.error}</p>}
    {autosave.status === "error" && <button type="button" className="min-h-11 rounded-button px-3 text-primary focus-visible:ring-2 focus-visible:ring-primary" onClick={() => { void autosave.flush(); }}>Thử lưu lại</button>}
    <fieldset disabled={disabled || Boolean(form.readOnly) || autosave.status === "conflict"} className="min-w-0">
      <legend className="sr-only">Nội dung {def.meta.label.vi}</legend>
      <SchemaForm schema={def.schema} value={form.data} onChange={onChange} onValidityChange={setFormValid} bilingual={bilingual} />
    </fieldset>
  </section>;
}
