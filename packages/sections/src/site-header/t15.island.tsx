"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Bars3Icon, ChevronDownIcon, MapPinIcon, PhoneIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Anchor } from "../shared/Anchor";
import type { ClientLink } from "../shared/links";
import type { Locale } from "../site";

type Phone = { phone: string; href: string };
export type HeaderPricing = {
  label: string;
  hint: string;
  categories: { id: string; label: string; hint: string; groups: { title?: string; chips: { popular: boolean; link: ClientLink }[] }[] }[];
};
export type HeaderMenu = { label: string; columns: { title: string; description?: string; link?: ClientLink; links: ClientLink[] }[] };
export type HeaderHotline = { name: string; main: Phone; lines: (Phone & { label: string })[]; mapLink?: ClientLink };

const UI = {
  vi: { home: "Trang chủ", nav: "Điều hướng chính", mobileNav: "Điều hướng di động", open: "Mở menu", close: "Đóng menu", menu: "Danh mục", popular: "Phổ biến", type: "Loại công trình" },
  en: { home: "Home", nav: "Main navigation", mobileNav: "Mobile navigation", open: "Open menu", close: "Close menu", menu: "Menu", popular: "Popular", type: "Project type" },
} as const;

function PricingPanel({ pricing, ui, idPrefix, compact, onDone }: {
  pricing: HeaderPricing; ui: (typeof UI)[Locale]; idPrefix: string; compact?: boolean; onDone: () => void;
}) {
  const [active, setActive] = useState(0);
  const cat = pricing.categories[active];
  const chips = (c: HeaderPricing["categories"][number]) => c.groups.map((g, gi) => (
    <div key={gi} className={gi ? "mt-5" : ""}>
      {g.title && <div className="mb-2.5 text-2xs font-black uppercase tracking-[.16em] text-fg-subtle">{g.title}</div>}
      <div className="flex flex-wrap gap-2">
        {g.chips.map((chip, ci) => (
          <Anchor key={ci} link={chip.link} onNavigate={onDone} className="t15-chip relative !min-h-10 hover:border-primary/60 hover:bg-primary/15">
            {chip.link.label}
            {chip.popular && <span className="rounded-full bg-accent px-2 py-0.5 text-4xs font-black text-on-accent">{ui.popular}</span>}
          </Anchor>
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
              <span>{c.label} <span className="block text-xs font-medium text-fg-subtle">{c.hint}</span></span>
              <ChevronDownIcon aria-hidden className="h-4 w-4 transition group-open/cat:rotate-180" />
            </summary>
            <div className="pb-1 pt-3">{chips(c)}</div>
          </details>
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div role="tablist" aria-orientation="vertical" aria-label={ui.type} className="grid content-start gap-1">
        {pricing.categories.map((c, i) => (
          <button key={c.id} type="button" role="tab" aria-selected={i === active} id={`${idPrefix}-tab-${c.id}`} aria-controls={`${idPrefix}-panel`}
            onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
            className={`rounded-2xl px-4 py-3 text-left transition ${i === active ? "bg-primary/15 ring-1 ring-primary/50" : "hover:bg-glass-tint/[.06]"}`}>
            <span className="block font-black text-fg">{c.label}</span>
            <span className="block text-xs text-fg-muted">{c.hint}</span>
          </button>
        ))}
      </div>
      <div id={`${idPrefix}-panel`} role="tabpanel" aria-labelledby={`${idPrefix}-tab-${cat.id}`} className="rounded-3xl border border-line/12 bg-bg-tint/60 p-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div className="text-lg font-black text-fg">{cat.label}</div>
          <div className="text-xs text-fg-subtle">{pricing.hint}</div>
        </div>
        {chips(cat)}
      </div>
    </div>
  );
}

function MenuPanel({ menu, compact, onDone }: { menu: HeaderMenu; compact?: boolean; onDone: () => void }) {
  return (
    <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2 xl:grid-cols-4"}`}>
      {menu.columns.map((col, i) => (
        <div key={i} className="rounded-3xl border border-line/12 bg-bg-tint/50 p-5">
          {col.link
            ? <Anchor link={col.link} onNavigate={onDone} className="flex items-center justify-between font-black text-fg hover:text-primary">{col.title}<span aria-hidden className="text-sm text-fg-subtle">→</span></Anchor>
            : <div className="font-black text-fg">{col.title}</div>}
          {col.description && <p className="mt-1 text-xs leading-5 text-fg-muted">{col.description}</p>}
          {col.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {col.links.map((l, li) => <Anchor key={li} link={l} onNavigate={onDone} className="t15-chip !min-h-9 !px-3 text-xs" />)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function HotlineList({ hotlines, onDone }: { hotlines: HeaderHotline[]; onDone?: () => void }) {
  return (
    <ul className="grid gap-3">
      {hotlines.map((h) => (
        <li key={h.name} className="rounded-2xl border border-line/12 bg-bg-tint/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-sm font-black text-fg"><MapPinIcon aria-hidden className="h-4 w-4 text-primary" />{h.name}</div>
            <a href={h.main.href} onClick={onDone} className="text-lg font-black tabular-nums text-accent-ink">{h.main.phone}</a>
          </div>
          {h.lines.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {h.lines.map((line) => (
                <a key={line.phone} href={line.href} onClick={onDone} className="rounded-xl bg-glass px-3 py-2 hover:bg-glass-tint/10">
                  <span className="block text-fg-subtle">{line.label}</span><span className="font-black tabular-nums text-fg">{line.phone}</span>
                </a>
              ))}
            </div>
          )}
          {h.mapLink && <Anchor link={h.mapLink} className="mt-2 inline-block text-xs font-bold text-primary hover:underline">{h.mapLink.label} ↗</Anchor>}
        </li>
      ))}
    </ul>
  );
}

type MenuId = "pricing" | "hotline" | `menu-${number}`;

/** Header t15: mega menu (hover/click, Esc, click ngoài để đóng), hotline theo chi nhánh, menu mobile dạng drawer. */
export default function HeaderIsland(props: {
  sectionId: string;
  locale: Locale;
  brand: ReactNode;
  brandName: string;
  pricing?: HeaderPricing;
  menus: HeaderMenu[];
  links: ClientLink[];
  mobileLinks: ClientLink[];
  hotlineLabel: string;
  hotlines: HeaderHotline[];
  cta: ClientLink;
  drawerActions: ClientLink[];
}) {
  const { sectionId, pricing, menus, links, hotlines } = props;
  const ui = UI[props.locale];
  const [open, setOpen] = useState<MenuId | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const closeTimer = useRef(0);
  const hoverOpened = useRef<MenuId | null>(null);
  const triggers = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({});
  const panelId = (id: MenuId) => `${sectionId}-${id}`;

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

  // Menu mở bằng hover: cú click ngay sau đó giữ menu mở thay vì đóng.
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

  const trigger = (id: MenuId, label: string) => (
    <button ref={(el) => { triggers.current[id] = el; }} type="button" aria-expanded={open === id} aria-controls={panelId(id)}
      onClick={() => toggle(id)} onPointerEnter={hoverOpen(id)}
      className={`t15-nav-link inline-flex min-h-11 items-center gap-1 ${open === id ? "!text-primary" : ""}`}>
      {label}<ChevronDownIcon aria-hidden className={`h-4 w-4 transition ${open === id ? "rotate-180" : ""}`} />
    </button>
  );

  const panel = open === "pricing" && pricing
    ? <PricingPanel pricing={pricing} ui={ui} idPrefix={panelId("pricing")} onDone={() => close()} />
    : open?.startsWith("menu-") ? <MenuPanel menu={menus[Number(open.slice(5))]} onDone={() => close()} /> : null;

  return (
    <>
      <header ref={headerRef} className="t15-header" onPointerLeave={hoverClose} onPointerEnter={() => window.clearTimeout(closeTimer.current)}>
        <div className="t15-container flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${props.brandName} – ${ui.home}`}>{props.brand}</Link>

          <nav className="hidden items-center gap-5 xl:flex 2xl:gap-7" aria-label={ui.nav}>
            {pricing && trigger("pricing", pricing.label)}
            {menus.slice(0, 1).map((menu) => <span key={menu.label}>{trigger("menu-0", menu.label)}</span>)}
            {links.map((l) => <span key={l.href} onPointerEnter={hoverClose}><Anchor link={l} className="t15-nav-link" /></span>)}
            {menus.slice(1).map((menu, i) => <span key={menu.label}>{trigger(`menu-${i + 1}`, menu.label)}</span>)}
          </nav>

          <div className="flex items-center gap-2">
            {hotlines.length > 0 && (
              <div className="relative hidden xl:block">
                <button ref={(el) => { triggers.current.hotline = el; }} type="button" aria-expanded={open === "hotline"} aria-controls={panelId("hotline")}
                  onClick={() => setOpen((v) => (v === "hotline" ? null : "hotline"))}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line/12 bg-bg-elevated px-3 text-sm font-black text-fg transition hover:border-primary/40 hover:text-primary">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-on-accent"><PhoneIcon aria-hidden className="h-4 w-4" /></span>
                  <span className="hidden 2xl:inline">Hotline</span>
                  <ChevronDownIcon aria-hidden className={`h-4 w-4 transition ${open === "hotline" ? "rotate-180" : ""}`} />
                </button>
                {open === "hotline" && (
                  <div id={panelId("hotline")} className="absolute right-0 top-[calc(100%+12px)] max-h-[calc(100svh-8rem)] w-[420px] overflow-y-auto rounded-card border border-line/10 bg-bg-elevated p-4 shadow-2xl">
                    <div className="mb-3 px-1 text-xs font-black uppercase tracking-[.16em] text-fg-subtle">{props.hotlineLabel}</div>
                    <HotlineList hotlines={hotlines} onDone={() => close()} />
                  </div>
                )}
              </div>
            )}
            <Anchor link={props.cta} onNavigate={() => close()} className="t15-button t15-button-accent whitespace-nowrap !px-4 sm:!px-6" />
            <button type="button" onClick={() => setDrawerOpen(!drawerOpen)} className="t15-icon-button xl:hidden" aria-expanded={drawerOpen}
              aria-controls={`${sectionId}-drawer`} aria-label={drawerOpen ? ui.close : ui.open}>
              {drawerOpen ? <XMarkIcon aria-hidden className="h-6 w-6" /> : <Bars3Icon aria-hidden className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {panel && (
          <div id={panelId(open!)} className="absolute inset-x-0 top-full hidden xl:block">
            <div className="t15-container pt-3">
              <div className="max-h-[calc(100svh-7rem)] overflow-y-auto rounded-media border border-line/10 bg-bg-elevated p-6 shadow-2xl xl:p-8">{panel}</div>
            </div>
          </div>
        )}
      </header>

      {drawerOpen && <MobileDrawer {...props} ui={ui} onClose={() => setDrawerOpen(false)} />}
    </>
  );
}

function MobileDrawer({ sectionId, pricing, menus, links, mobileLinks, hotlines, drawerActions, ui, onClose }: Parameters<typeof HeaderIsland>[0] & {
  ui: (typeof UI)[Locale]; onClose: () => void;
}) {
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
    <details key={title} open={defaultOpen || undefined} className="group/sec border-b border-line/12 py-1">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-base font-black text-fg">
        {title}<ChevronDownIcon aria-hidden className="h-5 w-5 transition group-open/sec:rotate-180" />
      </summary>
      <div className="pb-4 pt-1">{children}</div>
    </details>
  );

  return (
    <div id={`${sectionId}-drawer`} role="dialog" aria-modal="true" aria-label={ui.menu} className="fixed inset-0 z-[75] flex justify-end bg-scrim/60 backdrop-blur-sm xl:hidden">
      <button type="button" className="absolute inset-0" onClick={onClose} aria-label={ui.close} tabIndex={-1} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-y-auto rounded-l-card bg-bg-elevated px-5 pb-28 pt-4 shadow-2xl">
        <div className="flex justify-end">
          <button ref={closeRef} type="button" onClick={onClose} className="t15-icon-button" aria-label={ui.close}><XMarkIcon aria-hidden className="h-6 w-6" /></button>
        </div>
        <nav className="mt-4" aria-label={ui.mobileNav}>
          {pricing && section(pricing.label, <PricingPanel compact pricing={pricing} ui={ui} idPrefix={`${sectionId}-m-pricing`} onDone={onClose} />, true)}
          {menus.map((menu) => section(menu.label, <MenuPanel compact menu={menu} onDone={onClose} />))}
          {[...links, ...mobileLinks].map((l) => (
            <Anchor key={l.href + l.label} link={l} onNavigate={onClose} className="flex min-h-12 items-center border-b border-line/12 text-base font-black text-fg" />
          ))}
          {hotlines.length > 0 && section("Hotline", <HotlineList hotlines={hotlines} onDone={onClose} />)}
        </nav>
        {drawerActions.length > 0 && (
          <div className="mt-6 grid gap-3">
            {drawerActions.map((action, i) => (
              <Anchor key={i} link={action} onNavigate={onClose} className={`t15-button ${i === 0 ? "t15-button-accent" : "t15-button-secondary"}`} />
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
