"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionResult, AdminAction } from "../lib/action.ts";

export function ActionForm({ action, label, children, permalink, secondary }: { action: AdminAction; label: string; children?: ReactNode; permalink: string; secondary?: boolean }) {
  const [state, submit, pending] = useActionState<ActionResult, FormData>(action, {}, permalink);
  return <form action={submit} className="space-y-4">
    {children}
    <div aria-live="polite" aria-atomic="true" className="space-y-3">
      {state.error && <p role="alert" className="text-danger">{state.error}</p>}
      {state.message && <p className="text-fg-muted">{state.message}</p>}
      {state.secret && <p className="break-all">Khóa thiết lập: <code>{state.secret}</code></p>}
      {state.uri && <p className="break-all"><span>URI ứng dụng xác thực: </span><code>{state.uri}</code></p>}
      {state.codes && <ul aria-label="Mã dự phòng" className="grid grid-cols-2 gap-2 font-sans">{state.codes.map(value => <li key={value}>{value}</li>)}</ul>}
    </div>
    <button type="submit" disabled={pending} className={`w-full rounded-button px-5 py-3 font-semibold disabled:opacity-60 ${secondary ? "border border-line/25 text-fg hover:bg-bg-tint" : "bg-primary text-on-primary"}`}>{pending ? "Đang xử lý…" : label}</button>
  </form>;
}
