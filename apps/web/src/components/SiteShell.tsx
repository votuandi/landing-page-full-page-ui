"use client";

import { DragScroll } from "@solar/ui";
import { SiteStateProvider } from "@solar/sections";
import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG } from "@/config/site";
import { QuoteCartProvider } from "@/lib/quoteCartContext";
import { LangProvider } from "@/i18n/LangProvider";

/** Server-rendered preset chrome and widgets, shared with every subpage. */
export default function SiteShell({ children, header, footer, inlineWidgets, overlayWidgets }: {
  children: ReactNode; header: ReactNode; footer: ReactNode; inlineWidgets: ReactNode; overlayWidgets: ReactNode;
}) {
  const pathname = usePathname();
  const isolated = pathname.startsWith("/lab/");
  const ownsWidgets = pathname.startsWith("/lab/presets") || pathname === "/lab/sections/t15-widgets" || pathname === "/lab/legacy-home";
  const home = pathname === "/";
  const [demoVisible, setDemoVisible] = useState(SITE_CONFIG.demo.enabled);
  return <LangProvider><QuoteCartProvider showDrawer={false}><SiteStateProvider calculatorHref="/#du-toan">
    <DragScroll />
    {!isolated && demoVisible && <div className="t15-demo-bar">
      <div className="t15-container flex min-h-11 items-center justify-between gap-3 py-2 text-xs sm:text-sm">
        <div className="font-bold">Đây là website mẫu dành cho doanh nghiệp điện mặt trời.</div>
        <div className="flex items-center gap-3">
          <a href={SITE_CONFIG.demo.templateCtaUrl} className="t15-demo-link">Dùng mẫu này cho công ty tôi</a>
          <a href={SITE_CONFIG.demo.pricingUrl} className="t15-demo-link hidden sm:inline-flex">Xem bảng giá</a>
          <button type="button" onClick={() => setDemoVisible(false)} aria-label="Ẩn thanh website mẫu" className="grid h-8 w-8 place-items-center rounded-full hover:bg-on-media/10"><XMarkIcon className="h-4 w-4" /></button>
        </div>
      </div>
    </div>}
    {!isolated && !home && header}
    {children}
    {!isolated && !home && <>{inlineWidgets}{footer}</>}
    {!ownsWidgets && overlayWidgets}
  </SiteStateProvider></QuoteCartProvider></LangProvider>;
}
