"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  ASSET_COPY,
  COPY,
  NAV_ITEMS,
  PRODUCTS,
  SEGMENTS,
  SEGMENT_IDS,
  SITE_CONFIG,
} from "@/content/site";
import {
  SegmentProvider,
  contactUrl,
  useSegment,
} from "./template10/SegmentContext";
import Modal from "./template10/Modal";
type RfqContextValue = {
  items: string[];
  add: (s: string) => void;
  remove: (s: string) => void;
  open: () => void;
};
const RfqContext = createContext<RfqContextValue | null>(null);
export function useRFQ() {
  const v = useContext(RfqContext);
  if (!v) throw new Error("RFQ context unavailable");
  return v;
}
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <SegmentProvider>
      <Shell>{children}</Shell>
    </SegmentProvider>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState(false),
    [quote, setQuote] = useState(false),
    [items, setItems] = useState<string[]>([]),
    [loaded, setLoaded] = useState(false);
  const { segment } = useSegment();
  const pathname = usePathname();
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("solar-rfq") ?? "[]");
      if (Array.isArray(saved))
        setItems(saved.filter((s) => PRODUCTS.some((p) => p.slug === s)));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem("solar-rfq", JSON.stringify(items));
      } catch {}
  }, [items, loaded]);
  useEffect(() => {
    setMenu(false);
    setQuote(false);
  }, [pathname]);
  const ctx = useMemo(
    () => ({
      items,
      add: (s: string) => setItems((a) => (a.includes(s) ? a : [...a, s])),
      remove: (s: string) => setItems((a) => a.filter((i) => i !== s)),
      open: () => setQuote(true),
    }),
    [items],
  );
  const selected = PRODUCTS.filter((p) => items.includes(p.slug));
  const q = new URLSearchParams();
  if (items.length) q.set("rfq", items.join(","));
  return (
    <RfqContext.Provider value={ctx}>
      <a href="#noi-dung" className="skip-link">
        {COPY.shell.skip}
      </a>
      {SITE_CONFIG.demo.enabled && (
        <div className="t5-demo-bar">
          <div className="t5-container py-2 text-center text-[11px] font-bold sm:text-xs">
            {COPY.shell.demoBanner}
          </div>
        </div>
      )}
      <header className="t5-header">
        <div className="t5-container flex min-h-[76px] items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 font-black text-blue-900"
          >
            <Image
              src={SITE_CONFIG.brand.logo}
              alt={SITE_CONFIG.brand.name}
              width={44}
              height={44}
              priority
            />
            <span>{SITE_CONFIG.brand.name}</span>
          </Link>
          <nav
            aria-label={COPY.shell.navigation}
            className="hidden items-center gap-5 xl:flex"
          >
            {NAV_ITEMS.map((n) => (
              <Link
                key={n.href}
                href={n.href === "/contact-us" ? contactUrl(segment) : n.href}
                className="t5-nav-link"
                aria-current={pathname === n.href ? "page" : undefined}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2">
            <button
              className="t5-icon-button"
              aria-label={`${COPY.shell.openQuote} (${items.length})`}
              onClick={() => setQuote(true)}
            >
              <span aria-hidden="true">▤</span>
              {items.length > 0 && (
                <span className="t5-count">{items.length}</span>
              )}
            </button>
            <Link
              href={contactUrl(segment)}
              className="t5-button t5-button-primary hidden sm:inline-flex"
            >
              {COPY.shell.survey}
            </Link>
            <button
              className="t5-icon-button xl:hidden"
              aria-label={COPY.shell.openMenu}
              aria-expanded={menu}
              aria-controls="mobile-menu"
              onClick={() => setMenu(!menu)}
            >
              {menu ? "×" : "☰"}
            </button>
          </div>
        </div>
        {menu && (
          <nav
            id="mobile-menu"
            aria-label={COPY.shell.navigation}
            className="t5-container border-t border-slate-200 pb-4 xl:hidden"
          >
            {NAV_ITEMS.map((n) => (
              <Link
                key={n.href}
                href={n.href === "/contact-us" ? contactUrl(segment) : n.href}
                onClick={() => setMenu(false)}
                className="block min-h-11 py-3 text-sm font-bold"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <div id="noi-dung" tabIndex={-1}>
        {children}
      </div>
      <footer className="bg-[var(--t8-ink)] pb-28 pt-14 text-white md:pb-10">
        <div className="t5-container">
          <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr]">
            <div>
              <p className="text-2xl font-black">{SITE_CONFIG.brand.name}</p>
              <p className="mt-4 max-w-sm text-sm leading-7 text-blue-100">
                {SITE_CONFIG.brand.tagline}
              </p>
              <p className="mt-4 text-xs leading-6 text-blue-100">
                {COPY.shell.footerNote}
              </p>
            </div>
            <nav aria-label={COPY.shell.solutions}>
              <h2 className="t5-footer-title">{COPY.shell.solutions}</h2>
              {SEGMENT_IDS.map((s) => (
                <Link
                  key={s}
                  className="mt-2 block min-h-11 py-2 text-sm text-blue-100"
                  href={`/giai-phap/${SEGMENTS[s].slug}`}
                >
                  {SEGMENTS[s].fullLabel}
                </Link>
              ))}
              <Link
                className="block min-h-11 py-2 text-sm text-blue-100"
                href="/news"
              >
                {COPY.shell.news}
              </Link>
            </nav>
            <div>
              <h2 className="t5-footer-title">{COPY.shell.contact}</h2>
              <a
                className="mt-4 block min-h-11 text-lg font-black"
                href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
              >
                {SITE_CONFIG.contact.phone}
              </a>
              <a
                className="block min-h-11 text-sm text-blue-100"
                href={`mailto:${SITE_CONFIG.contact.email}`}
              >
                {SITE_CONFIG.contact.email}
              </a>
              {SITE_CONFIG.contact.address && (
                <p className="text-sm leading-7 text-blue-100">
                  {SITE_CONFIG.contact.address}
                </p>
              )}
            </div>
          </div>
          <div className="mt-9 border-t border-white/15 pt-6 text-xs text-blue-100">
            © {new Date().getFullYear()} {SITE_CONFIG.brand.name} ·{" "}
            {COPY.shell.copyright}
          </div>
        </div>
      </footer>
      <div className="mobile-contact">
        <a
          className="t5-mobile-cta"
          href={`tel:${SITE_CONFIG.contact.phoneRaw}`}
        >
          {COPY.shell.call}
        </a>
        <a
          className="t5-mobile-cta"
          href={SITE_CONFIG.contact.zalo}
          target="_blank"
          rel="noopener noreferrer"
        >
          {ASSET_COPY.zalo}
        </a>
        <Link
          href={contactUrl(segment)}
          className="t5-mobile-cta !bg-amber-300 !text-blue-950"
        >
          {COPY.shell.survey}
        </Link>
      </div>
      <Modal
        open={quote}
        onClose={() => setQuote(false)}
        title={COPY.shell.quoteTitle}
      >
        {selected.length ? (
          <>
            <ul className="space-y-4">
              {selected.map((p) => (
                <li
                  className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4"
                  key={p.slug}
                >
                  <span className="text-sm font-bold">{p.name}</span>
                  <button
                    className="t5-icon-button shrink-0"
                    aria-label={`${COPY.shell.remove}: ${p.name}`}
                    onClick={() => ctx.remove(p.slug)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <Link
              onClick={() => setQuote(false)}
              href={contactUrl(segment, q)}
              className="t5-button t5-button-primary mt-6 w-full"
            >
              {COPY.shell.continue}
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm leading-7 text-slate-600">
              {COPY.shell.empty}
            </p>
            <Link
              href="/product"
              onClick={() => setQuote(false)}
              className="t5-button t5-button-primary mt-6"
            >
              {COPY.shell.viewProducts}
            </Link>
          </>
        )}
      </Modal>
    </RfqContext.Provider>
  );
}
