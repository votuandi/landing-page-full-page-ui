"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Bars3Icon, XMarkIcon, PhoneIcon, SwatchIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import { NAV_ITEMS, SITE_CONFIG, THEME_PRESETS } from "@/config/site";
import SectionReveal from "@/components/SectionReveal";
import { PRODUCTS } from "@/data/solar";

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

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoVisible, setDemoVisible] = useState(SITE_CONFIG.demo.enabled);
  const [themeOpen, setThemeOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [brandName, setBrandName] = useState<string>(SITE_CONFIG.brand.name);

  useEffect(() => {
    const saved = localStorage.getItem("minwy-rfq");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("minwy-rfq", JSON.stringify(items));
  }, [items]);

  const ctx = useMemo<RfqContextValue>(() => ({
    items,
    add: (slug) => setItems((current) => current.includes(slug) ? current : [...current, slug]),
    remove: (slug) => setItems((current) => current.filter((item) => item !== slug)),
    open: () => setRfqOpen(true),
  }), [items]);

  const applyTheme = (primary: string, accent: string) => {
    document.documentElement.style.setProperty("--t5-primary", primary);
    document.documentElement.style.setProperty("--t5-accent", accent);
  };

  const toggleDark = () => document.documentElement.classList.toggle("t5-dark");

  const selectedProducts = PRODUCTS.filter((p) => items.includes(p.slug));

  return (
    <RfqContext.Provider value={ctx}>
      <SectionReveal />
      {demoVisible && (
        <div className="t5-demo-bar">
          <div className="t5-container flex min-h-11 items-center justify-between gap-3 py-2 text-xs sm:text-sm">
            <div className="font-bold">Đây là trang web mẫu dành cho doanh nghiệp điện mặt trời.</div>
            <div className="flex items-center gap-2">
              <a href={SITE_CONFIG.demo.templateCtaUrl} className="t5-demo-link">Dùng mẫu này cho công ty tôi</a>
              <a href={SITE_CONFIG.demo.pricingUrl} className="hidden t5-demo-link sm:inline-flex">Xem bảng giá</a>
              <button type="button" onClick={() => setDemoVisible(false)} aria-label="Ẩn thanh trang web mẫu"><XMarkIcon className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <header className="t5-header">
        <div className="t5-container flex h-20 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3" aria-label={brandName}>
            <Image src="/logo.svg" alt={brandName} width={184} height={48} className="h-11 w-auto" priority />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} className="t5-nav-link">{item.label}</Link>)}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button type="button" onClick={() => setRfqOpen(true)} className="t5-icon-button" aria-label="Mở yêu cầu báo giá">
              <ShoppingBagIcon className="h-5 w-5" />
              {items.length > 0 && <span className="t5-count">{items.length}</span>}
            </button>
            <a href="/contact-us" className="t5-button t5-button-primary">Đặt lịch khảo sát</a>
          </div>

          <button type="button" onClick={() => setMenuOpen((v) => !v)} className="t5-icon-button lg:hidden" aria-expanded={menuOpen} aria-label="Mở menu">
            {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
            {NAV_ITEMS.map((item) => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block border-b border-slate-100 py-3 font-bold text-slate-700">{item.label}</Link>)}
            <button type="button" onClick={() => { setRfqOpen(true); setMenuOpen(false); }} className="mt-4 w-full t5-button t5-button-secondary">Yêu cầu báo giá ({items.length})</button>
          </nav>
        )}
      </header>

      {children}

      <footer className="bg-gradient-to-br from-[var(--t8-ink)] to-[var(--t5-primary)] text-white">
        <div className="t5-container grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="inline-flex rounded-2xl bg-white px-3 py-2"><Image src="/logo.svg" alt={brandName} width={172} height={45} className="h-10 w-auto" /></div>
            <p className="mt-5 text-sm leading-7 text-white/70">{SITE_CONFIG.brand.tagline}</p>
            <p className="mt-5 text-xs leading-6 text-white/55">{SITE_CONFIG.brand.legalName}<br />MST: {SITE_CONFIG.contact.taxCode}<br />{SITE_CONFIG.contact.license}</p>
          </div>
          <div>
            <h2 className="t5-footer-title">Giải pháp</h2>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <Link className="block hover:text-white" href="/service/solar-nha-xuong">Điện mặt trời nhà xưởng</Link>
              <Link className="block hover:text-white" href="/service/solar-gia-dinh">Điện mặt trời hộ gia đình</Link>
              <Link className="block hover:text-white" href="/service/hybrid-luu-tru">Hệ hybrid & lưu trữ</Link>
              <Link className="block hover:text-white" href="/service/om-ve-sinh">Vận hành, bảo trì (O&M) & vệ sinh</Link>
            </div>
          </div>
          <div>
            <h2 className="t5-footer-title">Công ty</h2>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <Link className="block hover:text-white" href="/about-us">Về chúng tôi</Link>
              <Link className="block hover:text-white" href="/product">Thiết bị</Link>
              <Link className="block hover:text-white" href="/contact-us">Liên hệ</Link>
              <span className="block">{SITE_CONFIG.legal.ministryNoticeLogo}</span>
            </div>
          </div>
          <div>
            <h2 className="t5-footer-title">Liên hệ dự án</h2>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <a className="block text-lg font-black text-white" href={`tel:${SITE_CONFIG.contact.phoneRaw}`}>{SITE_CONFIG.contact.phone}</a>
              <a className="block hover:text-white" href={`mailto:${SITE_CONFIG.contact.email}`}>{SITE_CONFIG.contact.email}</a>
              <p>{SITE_CONFIG.contact.address}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10"><div className="t5-container flex flex-col gap-2 py-5 text-xs text-white/50 md:flex-row md:justify-between"><span>© {new Date().getFullYear()} {brandName}. Trang web mẫu.</span><span>Thông tin pháp lý và thương hiệu mẫu cần thay trước khi xuất bản.</span></div></div>
      </footer>

      {SITE_CONFIG.demo.enabled && (
        <div className="fixed right-4 top-[45%] z-50 hidden lg:block">
          <button type="button" onClick={() => setThemeOpen((v) => !v)} className="t5-theme-trigger" aria-label="Mở tùy chỉnh giao diện"><SwatchIcon className="h-5 w-5" /></button>
          {themeOpen && (
            <div className="absolute right-14 top-0 w-72 rounded-3xl border border-white/70 bg-white/85 p-5 shadow-2xl backdrop-blur-xl">
              <div className="text-sm font-black text-slate-900">Thử nhận diện thương hiệu</div>
              <label className="mt-4 block text-xs font-bold text-slate-500">Tên công ty<input value={brandName} onChange={(e) => setBrandName(e.target.value)} className="t5-input mt-2" /></label>
              <div className="mt-4 text-xs font-bold text-slate-500">Màu chủ đạo</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Object.values(THEME_PRESETS).map((theme) => <button key={theme.label} type="button" onClick={() => applyTheme(theme.primary, theme.accent)} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2 text-left text-xs font-bold"><span className="h-5 w-5 rounded-full" style={{ background: theme.primary }} />{theme.label}</button>)}
              </div>
              <button type="button" onClick={toggleDark} className="mt-4 w-full t5-button t5-button-secondary">Bật / tắt nền tối</button>
            </div>
          )}
        </div>
      )}

      <div className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-2 rounded-full border border-white/70 bg-white/75 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
        <a className="t5-mobile-cta" href={`tel:${SITE_CONFIG.contact.phoneRaw}`}><PhoneIcon className="h-4 w-4" /> Gọi</a>
        <a className="t5-mobile-cta" href={SITE_CONFIG.contact.zalo}>Zalo</a>
        <button type="button" className="t5-mobile-cta" onClick={() => setRfqOpen(true)}>Báo giá {items.length ? `(${items.length})` : ""}</button>
      </div>

      {rfqOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Giỏ yêu cầu báo giá">
          <button type="button" className="absolute inset-0" onClick={() => setRfqOpen(false)} aria-label="Đóng" />
          <aside className="relative h-full w-full max-w-md overflow-y-auto rounded-l-[32px] bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between"><div><div className="text-xs font-black uppercase tracking-[.18em] text-slate-400">Yêu cầu báo giá</div><h2 className="mt-1 text-2xl font-black text-[var(--t5-primary)]">Yêu cầu báo giá thiết bị</h2></div><button type="button" onClick={() => setRfqOpen(false)} className="t5-icon-button"><XMarkIcon className="h-5 w-5" /></button></div>
            {selectedProducts.length ? <div className="mt-6 space-y-3">{selectedProducts.map((product) => <div key={product.slug} className="rounded-2xl border border-slate-200 p-4"><div className="font-black">{product.brand} {product.name}</div><button type="button" onClick={() => ctx.remove(product.slug)} className="mt-2 text-xs font-bold text-red-600">Bỏ khỏi yêu cầu</button></div>)}</div> : <p className="mt-8 text-sm leading-7 text-slate-500">Chưa có thiết bị. Hãy chọn nhiều sản phẩm trong danh mục để gửi một yêu cầu báo giá chung.</p>}
            <Link href={items.length ? `/contact-us?rfq=${encodeURIComponent(items.join(","))}` : "/product"} onClick={() => setRfqOpen(false)} className="mt-6 block text-center t5-button t5-button-primary">{items.length ? "Tiếp tục gửi yêu cầu" : "Xem danh mục thiết bị"}</Link>
          </aside>
        </div>
      )}
    </RfqContext.Provider>
  );
}