"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { siteConfig, type Text } from "@/config/site.config";
import { pickText, type Lang } from "@/i18n/text";

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
export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(siteConfig.i18n.defaultLang);

  useEffect(() => {
    if (!siteConfig.i18n.enabled) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "vi" || saved === "en") setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  const value = useMemo<LangContextValue>(() => ({ lang, setLang, tr: (text, en) => pickText(text, lang, en) }), [lang, setLang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Dùng trong server component: <Tr vi="…" en="…" /> hoặc <Tr text={textTừConfig} /> */
export function Tr({ vi, en, text }: { vi?: string; en?: string; text?: Text }) {
  const { tr } = useLang();
  return <>{text !== undefined ? tr(text) : tr(vi || "", en)}</>;
}
