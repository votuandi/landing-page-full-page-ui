"use client";

import { DragScroll } from "@solar/ui";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SwatchIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG, THEME_PRESETS } from "@/config/site";
import { QuoteCartProvider } from "@/lib/quoteCartContext";
import { LangProvider } from "@/i18n/LangProvider";
import ContactDock from "@/components/ContactDock";
import ConsultPopup from "@/components/ConsultPopup";
import CommitmentsStrip from "@/components/CommitmentsStrip";

import TopBar from "@/components/layout/TopBar";
import SiteHeader from "@/components/layout/SiteHeader";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

/** Khung chung mọi trang: thanh demo, top bar, header + mega menu, dải cam kết, footer, liên hệ nhanh, giỏ báo giá, popup tư vấn. */
export default function SiteShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  // Temporary lab isolation; E4-S01 replaces legacy widgets with SiteWidgets.
  const widgetLab = usePathname().startsWith("/lab/sections/t15-widgets");
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoVisible, setDemoVisible] = useState(SITE_CONFIG.demo.enabled);
  const [themeOpen, setThemeOpen] = useState(false);
  const [brandName, setBrandName] = useState<string>(SITE_CONFIG.brand.name);

  const applyTheme = (theme: { primary: string; secondary: string; accent: string }) => {
    const root = document.documentElement.style;
    root.setProperty("--c-primary", theme.primary);
    root.setProperty("--c-secondary", theme.secondary);
    root.setProperty("--c-accent", theme.accent);
  };
  const resetTheme = () => ["--c-primary", "--c-secondary", "--c-accent"].forEach((p) => document.documentElement.style.removeProperty(p));

  return (
    <LangProvider>
    <QuoteCartProvider showDrawer={!widgetLab}>
      {!widgetLab && <div aria-hidden className="t15-scroll-progress" />}
      <DragScroll />
      {demoVisible && (
        <div className="t15-demo-bar">
          <div className="t15-container flex min-h-11 items-center justify-between gap-3 py-2 text-xs sm:text-sm">
            <div className="font-bold">Đây là website mẫu dành cho doanh nghiệp điện mặt trời.</div>
            <div className="flex items-center gap-3">
              <a href={SITE_CONFIG.demo.templateCtaUrl} className="t15-demo-link">Dùng mẫu này cho công ty tôi</a>
              <a href={SITE_CONFIG.demo.pricingUrl} className="t15-demo-link hidden sm:inline-flex">Xem bảng giá</a>
              <button type="button" onClick={() => setDemoVisible(false)} aria-label="Ẩn thanh website mẫu" className="grid h-8 w-8 place-items-center rounded-full hover:bg-on-media/10"><XMarkIcon className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <TopBar />
      <SiteHeader brandName={brandName} drawerOpen={menuOpen} setDrawerOpen={setMenuOpen} />

      {children}

      {!widgetLab && <CommitmentsStrip />}
      {footer}

      {SITE_CONFIG.demo.enabled && (
        <div className="fixed right-4 top-[30%] z-50 hidden lg:block">
          <button type="button" onClick={() => setThemeOpen((v) => !v)} className="t15-theme-trigger" aria-label="Mở tùy chỉnh giao diện" aria-expanded={themeOpen}><SwatchIcon className="h-5 w-5" /></button>
          {themeOpen && (
            <div className="t15-card absolute right-14 top-0 w-72 p-5 shadow-2xl">
              <div className="text-sm font-black text-fg">Thử nhận diện thương hiệu</div>
              <label className="mt-4 block text-xs font-bold text-fg-muted">Tên công ty<input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="t15-input mt-2" /></label>
              <div className="mt-4 text-xs font-bold text-fg-muted">Bộ màu</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.values(THEME_PRESETS).map((theme) => (
                  <button key={theme.label} type="button" onClick={() => applyTheme(theme)} className="flex items-center gap-2 rounded-xl border border-line/12 p-2 text-left text-xs font-bold text-fg hover:border-primary/40">
                    {/* token-exempt: swatch hiển thị màu lấy từ dữ liệu theme */}
                    <span className="flex -space-x-1.5">{[theme.primary, theme.secondary, theme.accent].map((c) => <span key={c} className="h-4 w-4 rounded-full ring-2 ring-bg-elevated" style={{ background: `rgb(${c})` }} />)}</span>{theme.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={resetTheme} className="t15-button t15-button-secondary mt-4 w-full">Về màu mặc định</button>
            </div>
          )}
        </div>
      )}

      {!widgetLab && <>
        <ContactDock />
        <MobileBottomNav menuOpen={menuOpen} onMenu={() => setMenuOpen((v) => !v)} />
        <ConsultPopup />
      </>}
    </QuoteCartProvider>
    </LangProvider>
  );
}
