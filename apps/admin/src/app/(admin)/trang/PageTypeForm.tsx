"use client";
import { useActionState, useState } from "react";
import { setPageType } from "./actions.ts";
import { UpgradeRequest } from "../../../components/UpgradeRequest.tsx";

export function PageTypeForm({ siteId, type, label, slug, enabled, expected, reason, upgrade }: {
  siteId: string; type: string; label: string; slug: string; enabled: boolean; expected: readonly string[]; reason?: string; upgrade?: string;
}) {
  const [state, submit, pending] = useActionState(setPageType, {});
  const [showUpgrade, setShowUpgrade] = useState(false);
  const reasonId = `page-type-${type}-reason`;
  return <li className={`rounded-card border p-4 ${enabled ? "border-line/20 bg-bg-elevated" : "border-dashed border-line/30 bg-bg"}`}>
    <form action={submit} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <input type="hidden" name="siteId" value={siteId} /><input type="hidden" name="type" value={type} />
      <input type="hidden" name="enabled" value={String(!enabled)} /><input type="hidden" name="expected" value={JSON.stringify(expected)} />
      <span className="min-w-0 flex-1 basis-32 break-words">
        <span className={`block font-medium ${enabled ? "text-fg" : "text-fg-muted"}`}>{label}</span>
        <span className="block text-sm text-fg-muted">/{slug}</span>
      </span>
      <button type="submit" role="switch" aria-checked={enabled} aria-label={`Bật trang: ${label}`} disabled={pending || Boolean(reason)}
        aria-describedby={reason ? reasonId : undefined}
        className="inline-flex min-h-11 items-center gap-2 rounded-button px-2 text-sm font-medium text-fg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60">
        <span aria-hidden="true" className={`relative inline-block h-6 w-10 shrink-0 rounded-pill ${enabled ? "bg-primary" : "bg-line/30"} transition-colors motion-reduce:transition-none`}>
          <span className={`absolute left-0.5 top-0.5 size-5 rounded-pill bg-bg-elevated shadow-sm transition-transform motion-reduce:transition-none ${enabled ? "translate-x-4" : ""}`} />
        </span>
        {pending ? "Đang lưu…" : enabled ? "Bật" : "Tắt"}
      </button>
    </form>
    {(reason || upgrade) && <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
      {reason && <p id={reasonId} className="text-sm text-fg-muted">{reason}</p>}
      {upgrade && <button type="button" className="inline-flex min-h-11 items-center rounded-button border border-primary/40 px-3 text-sm font-medium text-primary hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40" onClick={() => setShowUpgrade(true)}>Nâng cấp gói</button>}
    </div>}
    {state.error && <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p>}
    {state.message && <p role="status" className="mt-2 text-sm text-fg-muted">{state.message}</p>}
    {showUpgrade && upgrade && <UpgradeRequest feature={upgrade} onClose={() => setShowUpgrade(false)} />}
  </li>;
}
