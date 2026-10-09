"use client";

import { Wordmark, ZaloIcon } from "@solar/ui";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Bars3Icon, BookOpenIcon, ChevronDownIcon, DocumentTextIcon, MapPinIcon, NewspaperIcon, PhoneIcon,
  LightBulbIcon, QuestionMarkCircleIcon, ScaleIcon, ShoppingBagIcon, TableCellsIcon, XMarkIcon, ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { siteConfig, type BrandGroup, type PriceCategory, type PriceChip } from "@/config/site.config";
import { catalogEnabled, directionsUrl, mapsUrl, telHref, zaloHref } from "@/config/site";
import { openCalculator } from "@solar/core";
import { useQuoteCart } from "@/lib/quoteCartContext";
import { openConsult } from "@/components/ConsultPopup";
import { useLang } from "@/i18n/LangProvider";
import { pickText, type Lang } from "@/i18n/text";
import BrandLogo from "@/components/BrandLogo";

import ThemeSwitch from "@/components/layout/ThemeSwitch";

type MenuId = "pricing" | "equipment" | "guide" | "hotline";

const { pricing, equipment, guide, branches, brands, dealer, i18n } = siteConfig;
const GUIDE_ICONS: Record<string, typeof BookOpenIcon> = { "thuat-ngu": BookOpenIcon, "bieu-gia": TableCellsIcon, "van-ban": ScaleIcon, "hoi-dap": QuestionMarkCircleIcon, "tin-tuc": NewspaperIcon, "kinh-nghiem": LightBulbIcon };
const BRAND_ROWS: { group: BrandGroup; vi: string; en: string }[] = [
  { group: "panel", vi: "Tấm pin", en: "Panels" },
  { group: "inverter", vi: "Inverter", en: "Inverters" },
  { group: "lithium", vi: "Lithium", en: "Lithium" },
];

const equipmentHref = (category: string, query: Record<string, string> = {}) =>
  `/san-pham?${new URLSearchParams({ category, ...query })}`;

/** Chip bảng giá → cuộn tới công cụ dự toán, điền sẵn phân khúc + tiền điện + nhu cầu (tiếng Việt, gửi kèm lead). */
function pickPrice(cat: PriceCategory, groupTitle: PriceChip["label"] | undefined, chip: PriceChip) {
  const topic = [cat.label, groupTitle, chip.label].filter(Boolean).map((t) => pickText(t!, "vi")).join(" · ");
  openCalculator({ segment: cat.segment, bill: chip.bill, topic });
}

/* ============================== Mega menu panels ============================== */

function PricingPanel({ onDone, compact = false }: { onDone: () => void; compact?: boolean }) {
  const { tr } = useLang();
  const [active, setActive] = useState(0);
  const cat = pricing.categories[active];

  const chips = (c: PriceCategory) => c.groups.map((g, gi) => (
    <div key={gi} className={gi ? "mt-5" : ""}>
      {g.title && <div className="mb-2.5 text-[11px] font-black uppercase tracking-[.16em] text-fg-subtle">{tr(g.title)}</div>}
      <div className="flex flex-wrap gap-2">
        {g.chips.map((chip, ci) => (
          <button key={ci} type="button" onClick={() => { pickPrice(c, g.title, chip); onDone(); }}
            className="t15-chip relative !min-h-10 hover:border-primary/60 hover:bg-primary/15">
            {tr(chip.label)}
            {chip.popular && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-on-accent">{tr("Phổ biến", "Popular")}</span>}
          </button>
        ))}
      </div>
    </div>
  ));

  if (compact) {
    return (
      <div className="grid gap-2">
        {pricing.categories.map((c) => (
          <details key={c.id} className="group/cat rounded-2xl border border-line/12 bg-glass px-4 py-3">
            <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between font-bold text-fg">
              <span>{tr(c.label)} <span className="block text-xs font-medium text-fg-subtle">{tr(c.hint)}</span></span>
              <ChevronDownIcon className="h-4 w-4 transition group-open/cat:rotate-180" />
            </summary>
            <div className="pb-1 pt-3">{chips(c)}</div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div role="tablist" aria-orientation="vertical" aria-label={tr("Loại công trình", "Project type")} className="grid content-start gap-1">
          {pricing.categories.map((c, i) => (
            <button key={c.id} type="button" role="tab" aria-selected={i === active} id={`price-tab-${c.id}`} aria-controls="price-panel"
              onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
              className={`rounded-2xl px-4 py-3 text-left transition ${i === active ? "bg-primary/15 ring-1 ring-primary/50" : "hover:bg-glass-tint/[.06]"}`}>
              <span className="block font-black text-fg">{tr(c.label)}</span>
              <span className="block text-xs text-fg-muted">{tr(c.hint)}</span>
            </button>
          ))}
        </div>
        <div id="price-panel" role="tabpanel" aria-labelledby={`price-tab-${cat.id}`} className="rounded-3xl border border-line/12 bg-bg-tint/60 p-6">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <div className="text-lg font-black text-fg">{tr(cat.label)}</div>
            <div className="text-xs text-fg-subtle">{tr("Chọn mức → điền sẵn vào dự toán", "Pick a range → prefilled estimate")}</div>
          </div>
          {chips(cat)}
        </div>
      </div>
      {brands.enabled && (
        <div className="mt-6 grid gap-4 border-t border-line/12 pt-5 md:grid-cols-3">
          {BRAND_ROWS.map(({ group, vi, en }) => {
            const list = brands.list.filter((b) => b.group === group);
            if (!list.length) return null;
            return (
              <div key={group}>
                <div className="text-[11px] font-black uppercase tracking-[.16em] text-fg-subtle">{tr(vi, en)}</div>
                <div className="mt-2.5 flex flex-wrap gap-3">
                  {list.map((b) => <Link key={b.name} href={equipmentHref(group === "lithium" ? "battery" : group, { brand: b.name })} onClick={onDone} className="rounded-xl border border-line/12 bg-glass px-2.5 py-1.5 transition hover:border-primary/50"><Wordmark name={b.name} src={b.logo} size="sm" /></Link>)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EquipmentPanel({ onDone, compact = false }: { onDone: () => void; compact?: boolean }) {
  const { tr } = useLang();
  return (
    <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2 xl:grid-cols-3"}`}>
      {equipment.groups.map((g) => (
        <div key={g.id} className="rounded-3xl border border-line/12 bg-bg-tint/50 p-5">
          <Link href={equipmentHref(g.category)} onClick={onDone} className="flex items-center justify-between font-black text-fg hover:text-primary">
            {tr(g.label)}<span aria-hidden className="text-sm text-fg-subtle">→</span>
          </Link>
          <div className="mt-3 flex flex-wrap gap-2">
            {g.filters.map((f, i) => (
              <Link key={i} href={equipmentHref(g.category, f.query)} onClick={onDone} className="t15-chip !min-h-9 !px-3 text-xs">{tr(f.label)}</Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GuidePanel({ onDone, compact = false }: { onDone: () => void; compact?: boolean }) {
  const { tr } = useLang();
  return (
    <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-3 lg:grid-cols-6"}`}>
      {guide.items.map((item) => {
        const Icon = GUIDE_ICONS[item.id] || DocumentTextIcon;
        return (
          <Link key={item.id} href={item.href || `/cam-nang#${item.id}`} onClick={onDone} className="group flex gap-3 rounded-3xl border border-line/12 bg-bg-tint/50 p-4 transition hover:border-primary/50 lg:flex-col">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary transition group-hover:bg-primary group-hover:text-on-primary"><Icon className="h-6 w-6" /></span>
            <span><span className="block font-black text-fg">{tr(item.label)}</span><span className="mt-1 block text-xs leading-5 text-fg-muted">{tr(item.desc)}</span></span>
          </Link>
        );
      })}
    </div>
  );
}

function HotlineList({ onDone }: { onDone?: () => void }) {
  const { tr } = useLang();
  return (
    <ul className="grid gap-3">
      {branches.map((b) => (
        <li key={b.id} className="rounded-2xl border border-line/12 bg-bg-tint/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sm font-black text-fg"><MapPinIcon className="h-4 w-4 text-primary" />{b.name}</div>
            <a href={telHref(b.hotline.main)} onClick={onDone} className="text-lg font-black tabular-nums text-accent-ink">{b.hotline.main}</a>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <a href={telHref(b.hotline.household)} onClick={onDone} className="rounded-xl bg-glass px-3 py-2 hover:bg-glass-tint/10"><span className="block text-fg-subtle">{tr("Hộ gia đình", "Households")}</span><span className="font-black tabular-nums text-fg">{b.hotline.household}</span></a>
            <a href={telHref(b.hotline.project)} onClick={onDone} className="rounded-xl bg-glass px-3 py-2 hover:bg-glass-tint/10"><span className="block text-fg-subtle">{tr("Dự án", "Projects")}</span><span className="font-black tabular-nums text-fg">{b.hotline.project}</span></a>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
            <a href={mapsUrl(b.office)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{tr("Văn phòng trên Google Maps", "Office on Google Maps")} ↗</a>
            {b.warehouse && <a href={mapsUrl(b.warehouse)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{tr("Kho hàng", "Warehouse")} ↗</a>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LangSwitch({ className = "" }: { className?: string }) {
  const { lang, setLang, tr } = useLang();
  if (!i18n.enabled) return null;
  return (
    <div role="group" aria-label={tr("Ngôn ngữ", "Language")} className={`flex rounded-full border border-line/15 bg-glass p-1 text-xs font-black ${className}`}>
      {(["vi", "en"] as Lang[]).map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
          className={`min-h-9 min-w-9 rounded-full px-2.5 uppercase transition ${lang === l ? "bg-primary text-on-primary" : "text-fg-muted hover:text-fg"}`}>{l}</button>
      ))}
    </div>
  );
}

/* ================================== Header ================================== */

type Props = {
  brandName: string;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
};

/** Icon "Giỏ báo giá" trên header, badge = tổng số lượng. */
function CartButton({ className = "" }: { className?: string }) {
  const { tr } = useLang();
  const cart = useQuoteCart();
  return (
    <button type="button" onClick={cart.open} className={`t15-icon-button ${className}`} aria-label={`${tr("Giỏ yêu cầu báo giá", "Quote request cart")} (${cart.count})`}>
      <ShoppingBagIcon className="h-5 w-5" />
      {cart.count > 0 && <span className="t15-count" aria-hidden>{cart.count > 99 ? "99+" : cart.count}</span>}
    </button>
  );
}

export default function SiteHeader({ brandName, drawerOpen, setDrawerOpen }: Props) {
  const { tr } = useLang();
  const [open, setOpen] = useState<MenuId | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number>(0);
  const triggers = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({});

  const close = useCallback((refocus = false) => {
    setOpen((current) => {
      if (refocus && current) triggers.current[current]?.focus();
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(true); };
    const onDown = (e: PointerEvent) => { if (!headerRef.current?.contains(e.target as Node)) close(); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onDown); };
  }, [open, close]);

  // Menu mở bằng hover: cú click ngay sau đó (cùng con trỏ) giữ menu mở thay vì đóng lại
  const hoverOpened = useRef<MenuId | null>(null);
  const hoverOpen = (id: MenuId) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    if (open !== id) hoverOpened.current = id;
    setOpen(id);
  };
  const toggle = (id: MenuId) => {
    if (hoverOpened.current === id) { hoverOpened.current = null; setOpen(id); return; }
    hoverOpened.current = null;
    setOpen((v) => (v === id ? null : id));
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => { hoverOpened.current = null; setOpen((v) => (v === "hotline" ? v : null)); }, 180);
  };

  const trigger = (id: MenuId, children: ReactNode) => (
    <button
      ref={(el) => { triggers.current[id] = el; }}
      type="button"
      aria-expanded={open === id}
      aria-controls={`menu-${id}`}
      onClick={() => toggle(id)}
      onPointerEnter={hoverOpen(id)}
      className={`t15-nav-link inline-flex min-h-11 items-center gap-1 ${open === id ? "!text-primary" : ""}`}
    >
      {children}<ChevronDownIcon aria-hidden className={`h-4 w-4 transition ${open === id ? "rotate-180" : ""}`} />
    </button>
  );

  const panels: Partial<Record<MenuId, ReactNode>> = {
    pricing: pricing.enabled && <PricingPanel onDone={() => close()} />,
    equipment: equipment.enabled && catalogEnabled && <EquipmentPanel onDone={() => close()} />,
    guide: guide.enabled && <GuidePanel onDone={() => close()} />,
  };

  return (
    <>
      <header ref={headerRef} className="t15-header" onPointerLeave={hoverClose} onPointerEnter={() => window.clearTimeout(closeTimer.current)}>
        <div className="t15-container flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${brandName} – ${tr("Trang chủ", "Home")}`}>
            <BrandLogo name={brandName} />
          </Link>

          <nav className="hidden items-center gap-5 xl:flex 2xl:gap-7" aria-label={tr("Điều hướng chính", "Main navigation")}>
            {panels.pricing && trigger("pricing", tr("Bảng giá lắp đặt", "Pricing"))}
            {panels.equipment && trigger("equipment", tr("Thiết bị", "Equipment"))}
            {siteConfig.projects.enabled && <Link href="/#du-an" className="t15-nav-link" onPointerEnter={hoverClose}>{tr("Dự án", "Projects")}</Link>}
            {dealer.enabled && <Link href="/#dai-ly" className="t15-nav-link" onPointerEnter={hoverClose}>{tr("Đại lý", "Dealers")}</Link>}
            <Link href="/tin-tuc" className="t15-nav-link hidden 2xl:inline" onPointerEnter={hoverClose}>{tr("Tin tức", "News")}</Link>
            {panels.guide && trigger("guide", tr("Cẩm nang", "Guides"))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative hidden xl:block">
              <button
                ref={(el) => { triggers.current.hotline = el; }}
                type="button" aria-expanded={open === "hotline"} aria-controls="menu-hotline"
                onClick={() => setOpen((v) => (v === "hotline" ? null : "hotline"))}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line/12 bg-bg-elevated px-3 text-sm font-black text-fg transition hover:border-primary/40 hover:text-primary"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-on-accent"><PhoneIcon className="h-4 w-4" /></span><span className="hidden 2xl:inline">Hotline</span><ChevronDownIcon aria-hidden className={`h-4 w-4 transition ${open === "hotline" ? "rotate-180" : ""}`} />
              </button>
              {open === "hotline" && (
                <div id="menu-hotline" className="absolute right-0 top-[calc(100%+12px)] max-h-[calc(100svh-8rem)] w-[420px] overflow-y-auto rounded-[28px] border border-line/10 bg-bg-elevated p-4 shadow-2xl">
                  <div className="mb-3 px-1 text-xs font-black uppercase tracking-[.16em] text-fg-subtle">{tr("Hotline theo chi nhánh", "Hotlines by branch")}</div>
                  <HotlineList onDone={() => close()} />
                </div>
              )}
            </div>
            <LangSwitch className="hidden sm:flex" />
            <ThemeSwitch className="hidden sm:inline-flex" />
            {catalogEnabled && <CartButton className="hidden sm:inline-flex" />}
            <button type="button" onClick={() => { close(); openCalculator(); }} className="t15-button t15-button-accent whitespace-nowrap !px-4 sm:!px-6">{tr("Báo giá", "Get a quote")}</button>
            <button type="button" onClick={() => setDrawerOpen(!drawerOpen)} className="t15-icon-button xl:hidden" aria-expanded={drawerOpen} aria-controls="mobile-drawer" aria-label={drawerOpen ? tr("Đóng menu", "Close menu") : tr("Mở menu", "Open menu")}>
              {drawerOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && open !== "hotline" && panels[open] && (
          <div id={`menu-${open}`} className="absolute inset-x-0 top-full hidden xl:block">
            <div className="t15-container pt-3">
              <div className="max-h-[calc(100svh-7rem)] overflow-y-auto rounded-[32px] border border-line/10 bg-bg-elevated p-6 shadow-2xl xl:p-8">{panels[open]}</div>
            </div>
          </div>
        )}
      </header>

      {drawerOpen && <MobileDrawer onClose={() => setDrawerOpen(false)} />}
    </>
  );
}

/* ============================== Mobile drawer ============================== */

function MobileDrawer({ onClose }: { onClose: () => void }) {
  const { tr } = useLang();
  const cart = useQuoteCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const section = (title: string, children: ReactNode, defaultOpen = false) => (
    <details open={defaultOpen || undefined} className="group/sec border-b border-line/12 py-1">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-base font-black text-fg">
        {title}<ChevronDownIcon className="h-5 w-5 transition group-open/sec:rotate-180" />
      </summary>
      <div className="pb-4 pt-1">{children}</div>
    </details>
  );

  return (
    <div id="mobile-drawer" role="dialog" aria-modal="true" aria-label={tr("Danh mục", "Menu")} className="fixed inset-0 z-[75] flex justify-end bg-scrim/60 backdrop-blur-sm xl:hidden">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label={tr("Đóng menu", "Close menu")} tabIndex={-1} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto rounded-l-[28px] bg-bg-elevated px-5 pb-28 pt-4 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><LangSwitch /><ThemeSwitch /></div>
          <button ref={closeRef} type="button" onClick={onClose} className="t15-icon-button" aria-label={tr("Đóng menu", "Close menu")}><XMarkIcon className="h-6 w-6" /></button>
        </div>
        <nav className="mt-4" aria-label={tr("Điều hướng di động", "Mobile navigation")}>
          {pricing.enabled && section(tr("Bảng giá lắp đặt", "Pricing"), <PricingPanel compact onDone={onClose} />, true)}
          {equipment.enabled && catalogEnabled && section(tr("Thiết bị", "Equipment"), <EquipmentPanel compact onDone={onClose} />)}
          {guide.enabled && section(tr("Cẩm nang", "Guides"), <GuidePanel compact onDone={onClose} />)}
          {[
            siteConfig.projects.enabled && { href: "/#du-an", label: tr("Dự án tiêu biểu", "Featured projects") },
            dealer.enabled && { href: "/#dai-ly", label: tr("Trở thành đại lý", "Become a dealer") },
            catalogEnabled && { href: "/san-pham", label: tr("Sản phẩm & thiết bị", "Products") },
            { href: "/tin-tuc", label: tr("Tin tức & kinh nghiệm", "News & guides") },
            { href: "/ve-chung-toi", label: tr("Về chúng tôi", "About us") },
            { href: "/lien-he", label: tr("Liên hệ", "Contact") },
          ].filter(Boolean).map((l) => l && (
            <Link key={l.href} href={l.href} onClick={onClose} className="flex min-h-12 items-center border-b border-line/12 text-base font-black text-fg">{l.label}</Link>
          ))}
          {section("Hotline", <HotlineList onDone={onClose} />)}
        </nav>
        <div className="mt-6 grid gap-3">
          <button type="button" onClick={() => { onClose(); openConsult(); }} className="t15-button t15-button-accent"><ChatBubbleLeftRightIcon className="h-5 w-5" />{tr("Nhận tư vấn miễn phí", "Free consultation")}</button>
          {catalogEnabled && <button type="button" onClick={() => { onClose(); cart.open(); }} className="t15-button t15-button-secondary"><ShoppingBagIcon className="h-5 w-5" />{tr("Giỏ yêu cầu báo giá", "Quote request cart")} ({cart.count})</button>}
          <a href={zaloHref(siteConfig.zalo.factory.phone)} target="_blank" rel="noopener noreferrer" className="t15-button t15-button-secondary"><ZaloIcon className="h-5 w-5" />{tr(siteConfig.zalo.factory.label)}</a>
          <a href={directionsUrl(branches[0].office)} target="_blank" rel="noopener noreferrer" className="text-center text-xs font-bold text-fg-muted underline">{tr("Chỉ đường tới trụ sở", "Directions to HQ")}</a>
        </div>
      </aside>
    </div>
  );
}
