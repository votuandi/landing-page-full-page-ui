"use client";

import type { ReactNode } from "react";
import { DragScroll, SectionReveal } from "@solar/ui";
import { SiteStateProvider } from "@solar/sections";
import { LangProvider } from "@/i18n/LangProvider";
import { QuoteCartProvider } from "@/lib/quoteCartContext";

export default function TenantSiteShell({ children, header, footer, inlineWidgets, overlayWidgets, defaultLocale, locales, validSkus, cartEnabled, calculatorHref }: {
  children: ReactNode; header: ReactNode; footer: ReactNode; inlineWidgets: ReactNode; overlayWidgets: ReactNode;
  defaultLocale: "vi" | "en"; locales: ("vi" | "en")[]; validSkus: string[]; cartEnabled: boolean; calculatorHref: string | null;
}) {
  return <LangProvider defaultLocale={defaultLocale} locales={locales} serverLocale>
    <QuoteCartProvider showDrawer={false} validSkus={validSkus} enabled={cartEnabled}>
      <SiteStateProvider calculatorHref={calculatorHref}>
        <DragScroll /><SectionReveal />{header}{children}{inlineWidgets}{footer}{overlayWidgets}
      </SiteStateProvider>
    </QuoteCartProvider>
  </LangProvider>;
}
