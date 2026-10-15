"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
type Turnstile = { render(element: HTMLElement, options: { sitekey: string }): string | undefined; reset(widgetId: string): void };
const noop = () => () => undefined;
// The tenant layout emits <meta name="turnstile-site-key"> only when the platform enables Turnstile.
const readSiteKey = () => document.querySelector<HTMLMetaElement>('meta[name="turnstile-site-key"]')?.content ?? "";

/**
 * Cloudflare Turnstile widget; adds `cf-turnstile-response` to the surrounding form. Renders nothing when disabled.
 * Tokens are single-use: bump `resetKey` after a failed submit so the retry gets a fresh token.
 */
export function TurnstileField({ className, resetKey = 0 }: { className?: string; resetKey?: number }) {
  const siteKey = useSyncExternalStore(noop, readSiteKey, () => "");
  const ref = useRef<HTMLDivElement>(null);
  const widget = useRef<string | undefined>(undefined);
  useEffect(() => {
    const element = ref.current;
    if (!siteKey || !element) return;
    const win = window as Window & { turnstile?: Turnstile };
    const render = () => { widget.current = win.turnstile?.render(element, { sitekey: siteKey }); };
    if (win.turnstile) { render(); return; }
    let script = document.querySelector<HTMLScriptElement>(`script[src^="${SRC}"]`);
    if (!script) {
      script = Object.assign(document.createElement("script"), { src: `${SRC}?render=explicit`, async: true });
      document.head.append(script);
    }
    script.addEventListener("load", render, { once: true });
    return () => script.removeEventListener("load", render);
  }, [siteKey]);
  useEffect(() => {
    if (resetKey && widget.current) (window as Window & { turnstile?: Turnstile }).turnstile?.reset(widget.current);
  }, [resetKey]);
  return siteKey ? <div ref={ref} className={className} /> : null;
}
