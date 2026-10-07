"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Bars3Icon, XMarkIcon, SwatchIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { NAV_ITEMS, SITE_CONFIG, THEME_PRESETS, isDistributor } from "@/config/site";
import { PRODUCTS } from "@/data/solar";
import BrandLogo from "@/components/BrandLogo";
import ContactDock from "@/components/ContactDock";
import DragScroll from "@/components/DragScroll";

type RfqContextValue = {
  items: string[];
  add: (slug: string) => void;
  remove: (slug: string) => void;
  open: () => void;
};

const RfqContext = createContext<RfqContextValue | null>(null);

export function useRFQ() {
  const value = useContext(RfqContext);
  if (!value) throw new Error("useRFQ must be used inside SiteShell");
  return value;
}

export default function SiteShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoVisible, setDemoVisible] = useState(SITE_CONFIG.demo.enabled);
  const [themeOpen, setThemeOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [brandName, setBrandName] = useState<string>(SITE_CONFIG.brand.name);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("minwy-rfq");
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("minwy-rfq", JSON.stringify(items)); } catch {}
  }, [items]);

  const ctx = useMemo<RfqContextValue>(() => ({
    items,
    add: (slug) => setItems((current) => current.includes(slug) ? current : [...current, slug]),
    remove: (slug) => setItems((current) => current.filter((item) => item !== slug)),
    open: () => setRfqOpen(true),
  }), [items]);

  const applyTheme = (primary: string, accent: string) => {
    document.documentElement.style.setProperty("--c-primary", primary);
    document.documentElement.style.setProperty("--c-accent", accent);
  };

  const toggleLight = () => {
    const root = document.documentElement;
    root.style.removeProperty("--c-primary");
    root.style.removeProperty("--c-accent");
    if (root.dataset.theme === "light") delete root.dataset.theme;
    else root.dataset.theme = "light";
  };

  const selectedProducts = PRODUCTS.filter((p) => items.includes(p.slug));

  return (
    <RfqContext.Provider value={ctx}>
      {demoVisible && (
        <div className="t5-demo-bar">
          <div className="t5-container flex min-h-11 items-center justify-between gap-3 py-2 text-xs sm:text-sm">
            <div className="font-bold">Đây là website mẫu dành cho doanh nghiệp solar.</div>
            <div className="flex items-center gap-2">
              <a href={SITE_CONFIG.demo.templateCtaUrl} className="t5-demo-link">Dùng mẫu này cho công ty tôi</a>
              <a href={SITE_CONFIG.demo.pricingUrl} className="hidden t5-demo-link sm:inline-flex">Xem bảng giá</a>
              <button type="button" onClick={() => setDemoVisible(false)} aria-label="Ẩn thanh website mẫu" className="grid h-8 w-8 place-items-center"><XMarkIcon className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <header className="t5-header">
        <div className="t5-container flex h-20 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label={`${brandName} – Trang chủ`}>
            <BrandLogo name={brandName} />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} className="t5-nav-link">{item.label}</Link>)}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {isDistributor && (
              <button type="button" onClick={() => setRfqOpen(true)} className="t5-icon-button" aria-label="Mở yêu cầu báo giá thiết bị">
                <ShoppingBagIcon className="h-5 w-5" />
                {items.length > 0 && <span className="t5-count">{items.length}</span>}
              </button>
            )}
            <Link href="/#du-toan" className="t5-button t5-button-primary">Nhận báo giá</Link>
          </div>

          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="t5-icon-button lg:hidden" aria-expanded={menuOpen} aria-label={menuOpen ? "Đóng menu" : "Mở menu"}>
            {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-line/12 bg-bg-elevated px-4 py-4 lg:hidden" aria-label="Điều hướng di động">
            {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block border-b border-line/12 py-3 font-bold text-fg">{item.label}</Link>)}
            {isDistributor && <button type="button" onClick={() => { setRfqOpen(true); setMenuOpen(false); }} className="mt-4 w-full t5-button t5-button-secondary">Yêu cầu báo giá thiết bị ({items.length})</button>}
          </nav>
        )}
      </header>

      {children}

      {footer}

      {SITE_CONFIG.demo.enabled && (
        <div className="fixed right-4 top-[30%] z-50 hidden lg:block">
          <button type="button" onClick={() => setThemeOpen((v) => !v)} className="t5-theme-trigger" aria-label="Mở tùy chỉnh giao diện" aria-expanded={themeOpen}><SwatchIcon className="h-5 w-5" /></button>
          {themeOpen && (
            <div className="absolute right-14 top-0 w-72 rounded-3xl border border-glass-border bg-bg-elevated/95 p-5 shadow-2xl backdrop-blur-xl">
              <div className="text-sm font-black text-fg">Thử nhận diện thương hiệu</div>
              <label className="mt-4 block text-xs font-bold text-fg-muted">Tên công ty<input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="t5-input mt-2" /></label>
              <div className="mt-4 text-xs font-bold text-fg-muted">Màu chủ đạo</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.values(THEME_PRESETS).map((theme) => <button key={theme.label} type="button" onClick={() => applyTheme(theme.primary, theme.accent)} className="flex items-center gap-2 rounded-xl border border-line/12 p-2 text-left text-xs font-bold text-fg"><span className="h-5 w-5 rounded-full" style={{ background: `rgb(${theme.primary})` }} />{theme.label}</button>)}
              </div>
              <button type="button" onClick={toggleLight} className="mt-4 w-full t5-button t5-button-secondary">Đổi nền sáng / tối</button>
            </div>
          )}
        </div>
      )}

      <DragScroll />
      <ContactDock />

      {isDistributor && rfqOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-scrim/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Giỏ yêu cầu báo giá">
          <button type="button" className="absolute inset-0" onClick={() => setRfqOpen(false)} aria-label="Đóng" />
          <aside className="relative h-full w-full max-w-md overflow-y-auto rounded-l-[32px] bg-bg-elevated/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-[.18em] text-fg-subtle">RFQ</div><h2 className="mt-1 text-2xl font-black text-primary">Yêu cầu báo giá thiết bị</h2></div><button type="button" onClick={() => setRfqOpen(false)} className="t5-icon-button" aria-label="Đóng"><XMarkIcon className="h-5 w-5" /></button></div>
            {selectedProducts.length ? <div className="mt-6 space-y-3">{selectedProducts.map((product) => <div key={product.slug} className="rounded-2xl border border-line/12 p-4"><div className="font-black">{product.brand} {product.name}</div><button type="button" onClick={() => ctx.remove(product.slug)} className="mt-2 text-xs font-bold text-danger">Bỏ khỏi yêu cầu</button></div>)}</div> : <p className="mt-8 text-sm leading-7 text-fg-muted">Chưa có thiết bị. Hãy chọn nhiều sản phẩm trong catalog để gửi một yêu cầu báo giá chung.</p>}
            <Link href={items.length ? `/lien-he?rfq=${encodeURIComponent(items.join(","))}` : "/san-pham"} onClick={() => setRfqOpen(false)} className="mt-6 block text-center t5-button t5-button-primary">{items.length ? "Tiếp tục gửi yêu cầu" : "Xem catalog thiết bị"}</Link>
          </aside>
        </div>
      )}
    </RfqContext.Provider>
  );
}
