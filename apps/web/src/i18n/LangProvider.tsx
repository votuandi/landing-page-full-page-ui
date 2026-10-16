"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { siteConfig, type Text } from "@/config/site.config";
import { pickText, type Lang } from "@/i18n/text";
import { onSetSiteLocale } from "@solar/sections";

export type { Lang };
const STORAGE_KEY = "t15-lang";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** tr("Tiếng Việt", "English") hoặc tr(textTừConfig) */
  tr: (text: Text, en?: string) => string;
};

const LangContext = createContext<LangContextValue>({
  lang: "vi",
  setLang: () => {},
  tr: (text, en) => pickText(text, "vi", en),
});

/**
 * Ngôn ngữ giao diện (VI/EN), lưu trên trình duyệt. SSR luôn render tiếng Việt;
 * nếu người dùng đã chọn EN, chuyển sau khi hydrate. Tắt trong config → luôn là ngôn ngữ mặc định.
 */
const legacyLocales: Lang[] = siteConfig.i18n.enabled ? ["vi", "en"] : [siteConfig.i18n.defaultLang];
export function LangProvider({ children, defaultLocale = siteConfig.i18n.defaultLang, locales = legacyLocales, serverLocale = false }: { children: React.ReactNode; defaultLocale?: Lang; locales?: Lang[]; serverLocale?: boolean }) {
  const [legacyLang, setLangState] = useState<Lang>(defaultLocale);
  const lang = serverLocale ? defaultLocale : legacyLang;

  useEffect(() => {
    if (serverLocale || locales.length < 2) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if ((saved === "vi" || saved === "en") && locales.includes(saved)) setLangState(saved);
    } catch {}
  }, [locales, serverLocale]);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((next: Lang) => {
    if (!locales.includes(next)) return;
    if (!serverLocale) setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    if (serverLocale) {
      document.cookie = `solar-locale=${next}; Path=/; SameSite=Lax; Max-Age=31536000`;
      // The locale is a root param of the tenant tree (E5-S06): changing it swaps the root layout, so reload the document.
      window.location.reload();
    }
  }, [locales, serverLocale]);
  useEffect(() => onSetSiteLocale(setLang), [setLang]);

  const value = useMemo<LangContextValue>(() => ({ lang, setLang, tr: (text, en) => pickText(text, lang, en) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Dùng trong server component: <Tr vi="…" en="…" /> hoặc <Tr text={textTừConfig} /> */
export function Tr({ vi, en, text }: { vi?: string; en?: string; text?: Text }) {
  const { tr } = useLang();
  return <>{text !== undefined ? tr(text) : tr(vi || "", en)}</>;
}
