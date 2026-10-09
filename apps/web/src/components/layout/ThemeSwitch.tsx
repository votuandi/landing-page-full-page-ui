"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";

type Theme = "light" | "dark";
const KEY = "t15-theme";

/** Công tắc Sáng/Tối. Mặc định siteConfig.theme.default (light); lựa chọn lưu localStorage, áp trước khi vẽ bằng script trong layout. */
export default function ThemeSwitch({ className = "" }: { className?: string }) {
  const { tr } = useLang();
  const [theme, setTheme] = useState<Theme>(siteConfig.theme.default);

  useEffect(() => { setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light"); }, []);
  if (!siteConfig.theme.switcher) return null;

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch {}
    setTheme(next);
  };
  const dark = theme === "dark";

  return (
    <button type="button" onClick={toggle} aria-pressed={dark} className={`t15-icon-button ${className}`}
      aria-label={dark ? tr("Chuyển sang giao diện sáng", "Switch to light mode") : tr("Chuyển sang giao diện tối", "Switch to dark mode")}>
      {dark ? <SunIcon className="h-5 w-5 text-accent" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
