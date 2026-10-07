"use client";

import Link from "next/link";
import { useState } from "react";
import { Bars3Icon, ClockIcon, PhoneIcon, ShoppingBagIcon, SwatchIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { NAV_ITEMS, SITE_CONFIG, THEME_PRESETS, catalogEnabled, telHref } from "@/config/site";
import { QuoteCartProvider, useQuoteCart } from "@/lib/quoteCartContext";
import BrandLogo from "@/components/BrandLogo";
import ContactDock from "@/components/ContactDock";
import DragScroll from "@/components/DragScroll";
import ConsultPopup, { openConsult } from "@/components/ConsultPopup";

/** Icon "Giỏ báo giá" trên header, badge = tổng số lượng. */
function CartButton() {
  const cart = useQuoteCart();
  return (
    <button type="button" onClick={cart.open} className="t5-icon-button" aria-label={`Giỏ báo giá (${cart.count} sản phẩm)`}>
      <ShoppingBagIcon className="h-5 w-5" />
      {cart.count > 0 && <span className="t5-count" aria-hidden>{cart.count > 99 ? "99+" : cart.count}</span>}
    </button>
  );
}

/** Topbar hotline theo mục đích (desktop). */
function HotlineBar() {
  const hotlines = SITE_CONFIG.hotlines.filter((h) => h.phone);
  if (!hotlines.length) return null;
  return (
    <div className="t13-invert hidden border-b border-line/10 bg-bg-tint text-xs lg:block">
      <div className="t5-container flex h-9 items-center justify-between gap-6">
        <span className="flex items-center gap-1.5 text-fg-muted"><ClockIcon className="h-4 w-4" />{SITE_CONFIG.contact.workingHours}</span>
        <ul className="flex items-center gap-5" aria-label="Hotline">
          {hotlines.map((h) => (
            <li key={h.label}>
              <a href={telHref(h.phone)} className="flex items-center gap-1.5 text-fg-muted transition hover:text-fg">
                <PhoneIcon className="h-3.5 w-3.5 text-highlight" />{h.label}: <strong className="font-black text-fg">{h.phone}</strong>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function SiteShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoVisible, setDemoVisible] = useState(SITE_CONFIG.demo.enabled);
  const [themeOpen, setThemeOpen] = useState(false);
  const [brandName, setBrandName] = useState<string>(SITE_CONFIG.brand.name);

  const applyTheme = (primary: string, accent: string) => {
    document.documentElement.style.setProperty("--c-primary", primary);
    document.documentElement.style.setProperty("--c-accent", accent);
  };

  const resetTheme = () => {
    document.documentElement.style.removeProperty("--c-primary");
    document.documentElement.style.removeProperty("--c-accent");
  };

  return (
    <QuoteCartProvider>
      {demoVisible && (
        <div className="t5-demo-bar">
          <div className="t5-container flex min-h-11 items-center justify-between gap-3 py-2 text-xs sm:text-sm">
            <div className="font-bold">Đây là website mẫu dành cho doanh nghiệp điện mặt trời.</div>
            <div className="flex items-center gap-2">
              <a href={SITE_CONFIG.demo.templateCtaUrl} className="t5-demo-link">Dùng mẫu này</a>
              <a href={SITE_CONFIG.demo.pricingUrl} className="hidden t5-demo-link sm:inline-flex">Xem bảng giá</a>
              <button type="button" onClick={() => setDemoVisible(false)} aria-label="Ẩn thanh website mẫu" className="grid h-8 w-8 place-items-center"><XMarkIcon className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <HotlineBar />

      <header className="t5-header">
        <div className="t5-container flex h-20 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label={`${brandName} – Trang chủ`}>
            <BrandLogo name={brandName} />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} className="t5-nav-link">{item.label}</Link>)}
          </nav>

          <div className="flex items-center gap-2">
            {catalogEnabled && <CartButton />}
            <button type="button" onClick={openConsult} className="t5-button t5-button-accent hidden sm:inline-flex">Nhận tư vấn</button>
            <button type="button" onClick={() => setMenuOpen((v) => !v)} className="t5-icon-button lg:hidden" aria-expanded={menuOpen} aria-controls="mobile-nav" aria-label={menuOpen ? "Đóng menu" : "Mở menu"}>
              {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-nav" className="border-t border-line/12 bg-bg-elevated px-4 py-4 lg:hidden" aria-label="Điều hướng di động">
            {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block border-b border-line/12 py-3 font-bold text-fg">{item.label}</Link>)}
            <button type="button" onClick={() => { setMenuOpen(false); openConsult(); }} className="t5-button t5-button-accent mt-4 w-full">Nhận tư vấn</button>
          </nav>
        )}
      </header>

      {children}

      {footer}

      {SITE_CONFIG.demo.enabled && (
        <div className="fixed right-4 top-[30%] z-50 hidden lg:block">
          <button type="button" onClick={() => setThemeOpen((v) => !v)} className="t5-theme-trigger" aria-label="Mở tùy chỉnh giao diện" aria-expanded={themeOpen}><SwatchIcon className="h-5 w-5" /></button>
          {themeOpen && (
            <div className="absolute right-14 top-0 w-72 rounded-3xl border border-on-media/70 bg-bg-elevated/90 p-5 shadow-2xl backdrop-blur-xl">
              <div className="text-sm font-black text-fg">Thử nhận diện thương hiệu</div>
              <label className="mt-4 block text-xs font-bold text-fg-muted">Tên công ty<input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="t5-input mt-2" /></label>
              <div className="mt-4 text-xs font-bold text-fg-muted">Màu chủ đạo</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.values(THEME_PRESETS).map((theme) => <button key={theme.label} type="button" onClick={() => applyTheme(theme.primary, theme.accent)} className="flex items-center gap-2 rounded-xl border border-line/15 p-2 text-left text-xs font-bold text-fg"><span className="h-5 w-5 rounded-full" style={{ background: `rgb(${theme.primary})` }} />{theme.label}</button>)}
              </div>
              <button type="button" onClick={resetTheme} className="mt-4 w-full t5-button t5-button-secondary">Về màu mặc định</button>
            </div>
          )}
        </div>
      )}

      <DragScroll />
      <ContactDock />
      <ConsultPopup />

    </QuoteCartProvider>
  );
}
