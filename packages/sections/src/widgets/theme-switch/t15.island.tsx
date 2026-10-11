"use client";
import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const FLOATING = "t15-icon-button fixed bottom-24 left-3 z-40 h-11 w-11 rounded-pill shadow-float lg:bottom-6 lg:left-6";
/** Dùng làm widget nổi (mặc định) hoặc nút trong header (`className` riêng). */
export default function ThemeSwitch({ lightLabel, darkLabel, className = FLOATING }: { lightLabel: string; darkLabel: string; className?: string }) {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme === "dark", () => false);
  const toggle = () => {
    const next = document.documentElement.dataset.theme !== "dark";
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("t15-theme", next ? "dark" : "light"); } catch { /* Storage may be blocked. */ }
  };
  return <button type="button" onClick={toggle} aria-label={dark ? lightLabel : darkLabel} className={className}>
    {dark ? <SunIcon aria-hidden className="h-5 w-5 text-accent" /> : <MoonIcon aria-hidden className="h-5 w-5" />}
  </button>;
}
