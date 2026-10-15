"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
type Turnstile = { render(element: HTMLElement, options: { sitekey: string }): void };
const noop = () => () => undefined;
// The tenant layout emits <meta name="turnstile-site-key"> only when the platform enables Turnstile.
const readSiteKey = () => document.querySelector<HTMLMetaElement>('meta[name="turnstile-site-key"]')?.content ?? "";

/** Cloudflare Turnstile widget; adds `cf-turnstile-response` to the surrounding form. Renders nothing when disabled. */
export function TurnstileField({ className }: { className?: string }) {
  const siteKey = useSyncExternalStore(noop, readSiteKey, () => "");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!siteKey || !element) return;
    const win = window as Window & { turnstile?: Turnstile };
    const render = () => win.turnstile?.render(element, { sitekey: siteKey });
    if (win.turnstile) { render(); return; }
    let script = document.querySelector<HTMLScriptElement>(`script[src^="${SRC}"]`);
    if (!script) {
      script = Object.assign(document.createElement("script"), { src: `${SRC}?render=explicit`, async: true });
      document.head.append(script);
    }
    script.addEventListener("load", render, { once: true });
    return () => script.removeEventListener("load", render);
  }, [siteKey]);
  return siteKey ? <div ref={ref} className={className} /> : null;
}
