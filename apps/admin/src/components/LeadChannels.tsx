"use client";
import { useRef, useState, useSyncExternalStore, useTransition } from "react";
import type { ChannelKind } from "@solar/leads";
import type { ChannelSummary } from "../lib/leadChannels.ts";
import type { ActionResult, AdminAction } from "../lib/action.ts";
import { saveChannel, toggleChannel, deleteChannel, testChannel } from "../app/(admin)/cai-dat/kenh-nhan-lead/actions.ts";

const names: Record<ChannelKind, string> = { email: "Email", telegram: "Telegram", webhook: "Webhook", google_sheets: "Google Sheets" };
const field = "min-h-11 w-full rounded-input border border-line/20 bg-bg px-3 py-2 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const button = "min-h-11 rounded-button border border-line/20 px-4 py-2 text-sm font-medium text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50";
const subscribeNothing = () => () => {};
export function LeadChannels({ channels, webhookAllowed }: { channels: ChannelSummary[]; webhookAllowed: boolean }) {
  const [editing, setEditing] = useState<ChannelSummary>(), [kind, setKind] = useState<ChannelKind>("email");
  const [result, setResult] = useState<ActionResult>({}), [pending, start] = useTransition();
  const ready = useSyncExternalStore(subscribeNothing, () => true, () => false);
  const formRef = useRef<HTMLFormElement>(null);
  const gated = !webhookAllowed && ["webhook", "google_sheets"].includes(kind);
  function call(action: AdminAction, form: FormData, saved = false) {
    setResult({});
    start(async () => {
      try {
        const response = await action({}, form); setResult(response);
        if (saved && response.ok) { formRef.current?.reset(); setEditing(undefined); setKind("email"); }
      } catch { setResult({ error: "Không thể kết nối. Vui lòng thử lại." }); }
    });
  }
  function rowAction(action: AdminAction, id: string) { const form = new FormData(); form.set("id", id); call(action, form); }
  return <div className="max-w-4xl space-y-6">
    <div role="status" aria-live="polite" className={`break-words text-sm ${result.error ? "text-danger" : "text-fg"}`}>
      {result.error ?? result.message}
      {result.secret && <p className="mt-2">Khóa ký webhook chỉ hiển thị lần này. Hãy sao chép và lưu an toàn: <code className="break-all select-all">{result.secret}</code></p>}
    </div>
    <fieldset disabled={!ready || pending} aria-busy={pending} className="min-w-0 space-y-4">
      <legend className="mb-3 text-lg font-semibold text-fg">Kênh đã kết nối</legend>
      {!channels.length && <p className="text-sm text-fg-muted">Chưa có kênh nhận lead. Thêm một kênh bên dưới để nhận thông báo khách hàng.</p>}
      <ul className="space-y-3">
        {channels.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line/20 bg-bg-elevated p-4">
          <div className="min-w-0 break-words"><h3 className="font-medium text-fg">{row.name}</h3><p className="text-sm text-fg-muted">{names[row.kind]} · {row.enabled ? "Đang bật" : "Đã tắt"} · {row.summary}</p></div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => { setEditing(row); setKind(row.kind); setResult({}); }}>Sửa<span className="sr-only"> {row.name}</span></button>
            <button type="button" className={button} onClick={() => rowAction(testChannel, row.id)}>Gửi thử<span className="sr-only"> {row.name}</span></button>
            <button type="button" className={button} onClick={() => rowAction(toggleChannel, row.id)}>{row.enabled ? "Tắt" : "Bật"}<span className="sr-only"> {row.name}</span></button>
            <button type="button" className={button} onClick={() => { if (window.confirm(`Xóa kênh ${row.name}?`)) rowAction(deleteChannel, row.id); }}>Xóa<span className="sr-only"> {row.name}</span></button>
          </div>
        </li>)}
      </ul>
    </fieldset>
    <form ref={formRef} key={editing?.id ?? "new"} onSubmit={event => {
      event.preventDefault();
      const values = new FormData(event.currentTarget);
      const config: Record<string, unknown> = {};
      for (const key of ["url", "secret", "chatId"]) if (values.get(key)) config[key] = String(values.get(key)).trim();
      if (values.get("to")) config.to = String(values.get("to")).split(",").map(s => s.trim()).filter(Boolean);
      const form = new FormData(); form.set("payload", JSON.stringify({ id: editing?.id, kind, name: values.get("name"), config }));
      call(saveChannel, form, true);
    }}>
      <fieldset disabled={!ready || pending} className="min-w-0 space-y-4 rounded-card border border-line/20 bg-bg-elevated p-4 sm:p-6">
        <legend className="px-1 text-lg font-semibold text-fg">{editing ? `Sửa ${editing.name}` : "Thêm kênh nhận lead"}</legend>
        {editing && <p className="text-sm text-fg-muted">Để trống thông tin kết nối để giữ giá trị đã lưu. Khóa webhook được giữ nguyên.</p>}
        <label className="block space-y-2"><span className="font-medium text-fg">Tên kênh</span><input name="name" autoComplete="off" className={field} required maxLength={120} defaultValue={editing?.name} /></label>
        <label className="block space-y-2"><span className="font-medium text-fg">Loại kênh</span><select className={field} value={kind} disabled={!!editing} onChange={event => setKind(event.target.value as ChannelKind)}>
          {Object.entries(names).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
        {kind === "email" && <label className="block space-y-2"><span className="font-medium text-fg">Email nhận thông báo (tối đa 5, ngăn cách bằng dấu phẩy)</span><input name="to" autoComplete="off" className={field} required={!editing} /></label>}
        {kind === "telegram" && <label className="block space-y-2"><span className="font-medium text-fg">Chat id</span><input name="chatId" autoComplete="off" className={field} required={!editing} /></label>}
        {["webhook", "google_sheets"].includes(kind) && <label className="block space-y-2"><span className="font-medium text-fg">URL HTTPS{kind === "google_sheets" ? " Apps Script (/exec)" : " nhận lead"}</span><input name="url" type="url" autoComplete="off" spellCheck={false} className={field} required={!editing} maxLength={2048} /></label>}
        {kind === "google_sheets" && <label className="block space-y-2"><span className="font-medium text-fg">Khóa bí mật Apps Script</span><input name="secret" type="password" autoComplete="new-password" className={field} required={!editing} maxLength={512} /></label>}
        {gated && <p className="text-sm text-fg-muted">Webhook và Google Sheets cần gói Nâng cao trở lên.</p>}
        <div className="flex gap-3"><button type="submit" disabled={gated} className={`${button} bg-primary text-on-primary`}>{pending ? "Đang xử lý…" : "Lưu kênh"}</button>
          {editing && <button type="button" className={button} onClick={() => { setEditing(undefined); setKind("email"); }}>Hủy sửa</button>}</div>
      </fieldset>
    </form>
  </div>;
}
