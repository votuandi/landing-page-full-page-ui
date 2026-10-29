import { useId } from "react";

/** Unchecked by default. The label is rendered on the server, including without JavaScript. */
export function LeadConsent({ text, className = "", error }: { text: string; className?: string; error?: string }) {
  const errorId = useId();
  return <div className={className}>
    <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-fg-muted">
      <input type="checkbox" name="consent" required className="mt-1 h-5 w-5 shrink-0 accent-primary focus-visible:ring-2 focus-visible:ring-primary" aria-invalid={!!error} aria-describedby={error ? errorId : undefined} />
      <span>{text}</span>
    </label>
    {error && <p id={errorId} role="alert" className="mt-1 text-sm text-danger">{error}</p>}
  </div>;
}
