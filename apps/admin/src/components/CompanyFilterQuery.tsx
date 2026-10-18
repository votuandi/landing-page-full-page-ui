"use client";
import { useState } from "react";
import { useSchemaForm, type FieldProps } from "@solar/cms-ui";

/** SchemaForm's open records are read-only by default; menu filters need editable string values. */
export function CompanyFilterQuery({ path, value, label }: FieldProps<Record<string, string> | undefined>) {
  const { update, idPrefix, issues } = useSchemaForm();
  const [newKey, setNewKey] = useState("");
  const record = value ?? {}, key = newKey.trim(), duplicate = Object.hasOwn(record, key);
  const id = `${idPrefix}-${path.join(".")}`, errors = issues.get(path.join("."));
  const input = "min-h-11 w-full min-w-0 rounded-input border border-line/20 bg-bg px-3 py-2 text-fg";
  return <fieldset className="min-w-0 space-y-3 rounded-card border border-line/20 p-3">
    <legend>{label}</legend>
    {Object.entries(record).map(([name, current]) => <div key={name} className="flex min-w-0 items-end gap-2">
      <label className="min-w-0 flex-1 space-y-1"><span className="block break-words">{name}</span><input className={input} value={current} maxLength={500} onChange={event => update(path, { ...record, [name]: event.target.value })} /></label>
      <button type="button" className="min-h-11 rounded-button px-3 text-danger" aria-label={`Bỏ bộ lọc ${name}`} onClick={() => {
        if (!window.confirm(`Bỏ bộ lọc ${name}?`)) return;
        const next = { ...record }; delete next[name]; update(path, next);
      }}>Bỏ</button>
    </div>)}
    <label htmlFor={`${id}-new`} className="block text-sm">Tên bộ lọc mới</label>
    <div className="flex min-w-0 gap-2"><input id={`${id}-new`} className={input} maxLength={100} value={newKey} onChange={event => setNewKey(event.target.value)} autoComplete="off" aria-describedby={duplicate ? `${id}-duplicate` : undefined} />
      <button type="button" className="min-h-11 shrink-0 rounded-button border border-line/20 px-3 disabled:opacity-50" disabled={!key || duplicate} onClick={() => { update(path, { ...record, [key]: "" }); setNewKey(""); }}>Thêm bộ lọc</button>
    </div>
    {duplicate && <p id={`${id}-duplicate`} role="status" className="text-sm text-danger">Bộ lọc này đã có trong danh sách.</p>}
    {errors?.map(message => <p key={message} role="alert" className="text-sm text-danger">{message}</p>)}
  </fieldset>;
}
