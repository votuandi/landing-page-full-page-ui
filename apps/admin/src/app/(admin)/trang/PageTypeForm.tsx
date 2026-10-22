"use client";
import { useActionState, useState } from "react";
import { setPageType } from "./actions.ts";
import { UpgradeRequest } from "../../../components/UpgradeRequest.tsx";

export function PageTypeForm({ siteId, type, label, enabled, expected, reason, upgrade }: {
  siteId: string; type: string; label: string; enabled: boolean; expected: readonly string[]; reason?: string; upgrade?: string;
}) {
  const [state, submit, pending] = useActionState(setPageType, {});
  const [showUpgrade, setShowUpgrade] = useState(false);
  return <li className="rounded-card border border-line/20 bg-bg-elevated p-4">
    <form action={submit} className="flex flex-wrap items-center justify-between gap-3">
      <input type="hidden" name="siteId" value={siteId} /><input type="hidden" name="type" value={type} />
      <input type="hidden" name="enabled" value={String(!enabled)} /><input type="hidden" name="expected" value={JSON.stringify(expected)} />
      <span className="font-medium text-fg">{label}</span>
      <button type="submit" role="switch" aria-checked={enabled} aria-label={`Bật trang: ${label}`} disabled={pending || Boolean(reason)}
        aria-describedby={reason ? `page-type-${type}-reason` : undefined}
        className="min-h-11 rounded-button border border-line/30 px-4 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50">{pending ? "Đang lưu…" : enabled ? "Đang bật" : "Đã tắt"}</button>
    </form>
    {reason && <p id={`page-type-${type}-reason`} className="mt-2 text-sm text-fg-muted">{reason}</p>}
    {upgrade && <button type="button" className="min-h-11 rounded-button px-2 text-sm text-primary focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setShowUpgrade(true)}>Nâng cấp gói</button>}
    {state.error && <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p>}
    {state.message && <p role="status" className="mt-2 text-sm text-fg-muted">{state.message}</p>}
    {showUpgrade && upgrade && <UpgradeRequest feature={upgrade} onClose={() => setShowUpgrade(false)} />}
  </li>;
}
