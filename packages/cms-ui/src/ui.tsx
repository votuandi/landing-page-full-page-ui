"use client";

import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "block w-full min-h-11 rounded-input border border-line/20 bg-bg px-3 py-2 text-fg placeholder:text-fg-subtle "
  + "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 aria-[invalid=true]:border-danger "
  + "disabled:opacity-60";

export function FieldShell({ id, label, hint, errors, children, aside }: {
  id: string; label: string; hint?: string; errors?: readonly string[]; children: ReactNode; aside?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-fg">{label}</label>
        {aside}
      </div>
      {children}
      {hint && <p id={`${id}-hint`} className="text-xs text-fg-muted">{hint}</p>}
      <Errors id={`${id}-error`} errors={errors} />
    </div>
  );
}

export function Errors({ id, errors }: { id?: string; errors?: readonly string[] }) {
  if (!errors?.length) return null;
  return (
    <ul id={id} role="alert" className="space-y-0.5 text-xs font-medium text-danger">
      {[...new Set(errors)].map((message) => <li key={message}>{message}</li>)}
    </ul>
  );
}

export function SmallButton({ tone = "default", className = "", ...props }: ComponentProps<"button"> & { tone?: "default" | "danger" }) {
  const color = tone === "danger" ? "text-danger hover:bg-danger/10" : "text-fg-muted hover:bg-bg-tint hover:text-fg";
  return (
    <button type="button" {...props}
      className={`inline-flex min-h-9 min-w-9 shrink-0 items-center whitespace-nowrap justify-center gap-1 rounded-button px-2 text-sm font-medium ${color} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-40 ${className}`} />
  );
}

export function describedBy(id: string, hint?: string, errors?: readonly string[]): string | undefined {
  return [hint && `${id}-hint`, errors?.length && `${id}-error`].filter(Boolean).join(" ") || undefined;
}
