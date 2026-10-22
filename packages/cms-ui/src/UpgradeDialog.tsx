"use client";
import { useId, useRef, useState, useTransition } from "react";
import { useDialog } from "@solar/ui";
import { FieldShell, inputClass, SmallButton } from "./ui.tsx";

type Result = { ok?: boolean; message?: string; error?: string };
export type UpgradeDialogProps = { open: boolean; label: string; onClose(): void; submit(message: string): Promise<Result> };

export function UpgradeDialog({ open, label, onClose, submit }: UpgradeDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(ref, open, onClose);
  return open ? <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg/90 p-4">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="max-h-full w-full max-w-lg overflow-y-auto overscroll-contain rounded-card border border-line/20 bg-bg-elevated p-4 text-fg shadow-float sm:p-6">
      <UpgradeForm titleId={titleId} label={label} onClose={onClose} submit={submit} />
    </div>
  </div> : null;
}

function UpgradeForm({ titleId, label, onClose, submit }: Omit<UpgradeDialogProps, "open"> & { titleId: string }) {
  const id = useId(), [message, setMessage] = useState(""), [result, setResult] = useState<Result>({}), [pending, start] = useTransition();
  return <div className="space-y-4">
    <div className="flex items-start justify-between gap-3"><h2 id={titleId} className="min-w-0 break-words text-lg font-semibold">Nâng cấp: {label}</h2><SmallButton className="min-h-11" aria-label="Đóng yêu cầu nâng cấp" onClick={onClose}>Đóng</SmallButton></div>
    <p className="text-sm text-fg-muted">Gửi yêu cầu để đội tư vấn liên hệ về gói phù hợp. Nội dung website được giữ nguyên.</p>
    {result.ok ? <p role="status" className="text-sm">{result.message ?? "Đã gửi yêu cầu nâng cấp"}</p> : <form className="space-y-4" onSubmit={event => {
      event.preventDefault(); if (pending) return;
      start(async () => {
        try { setResult(await submit(message)); }
        catch { setResult({ error: "Không thể kết nối. Vui lòng thử lại." }); }
      });
    }}>
      <FieldShell id={id} label="Lời nhắn (không bắt buộc)"><textarea id={id} name="message" autoComplete="off" data-autofocus maxLength={1000} rows={4} className={inputClass} value={message} disabled={pending} onChange={event => setMessage(event.target.value)} /></FieldShell>
      {result.error && <p role="alert" className="text-sm text-danger">{result.error}</p>}
      <button type="submit" disabled={pending} className="min-h-11 rounded-button bg-primary px-4 py-2 font-semibold text-on-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">{pending ? "Đang gửi…" : "Gửi yêu cầu"}</button>
    </form>}
  </div>;
}
