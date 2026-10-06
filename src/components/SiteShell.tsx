"use client";
import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bars3Icon,
  XMarkIcon,
  ShoppingBagIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { NAV_ITEMS, SITE_CONFIG } from "@/config/site";
import { getBrand, getCopy, getCatalog } from "@/content/solar";
import StickyContact from "./solar/StickyContact";
import SolarLogo from "./solar/SolarLogo";
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
  const brand = getBrand(),
    [menuOpen, setMenuOpen] = useState(false),
    [rfqOpen, setRfqOpen] = useState(false),
    [items, setItems] = useState<string[]>([]),
    [dark, setDark] = useState(false),
    drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    const saved = localStorage.getItem("minwy-rfq");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("minwy-rfq", JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    if (!rfqOpen) return;
    const previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setRfqOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = drawer.current?.querySelectorAll<HTMLElement>(
        'button,a[href],input,select,textarea,[tabindex="0"]',
      );
      if (!nodes?.length) return;
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [rfqOpen]);
  const ctx = useMemo<RfqContextValue>(
    () => ({
      items,
      add: (slug) =>
        setItems((current) =>
          current.includes(slug) ? current : [...current, slug],
        ),
      remove: (slug) =>
        setItems((current) => current.filter((item) => item !== slug)),
      open: () => setRfqOpen(true),
    }),
    [items],
  );
  const selectedProducts = getCatalog().filter((p) => items.includes(p.slug));
  return (
    <RfqContext.Provider value={ctx}>
      <a href="#noi-dung-shell" className="solar-skip-link">
        Đến nội dung chính
      </a>
      {SITE_CONFIG.demo.enabled && (
        <div className="solar-announcement">{getCopy().demoNotice}</div>
      )}
      <header className="solar-site-header">
        <div className="solar-container solar-header-row">
          <Link href="/" aria-label={`${brand.name} — trang chủ`}>
            <SolarLogo name={brand.name} className="solar-shell-logo" />
          </Link>
          <nav className="solar-desktop-nav" aria-label="Điều hướng chính">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="solar-header-actions">
            <button
              type="button"
              className="solar-shell-icon"
              aria-label={dark ? "Bật nền sáng" : "Bật nền tối"}
              aria-pressed={dark}
              onClick={() => {
                setDark(!dark);
                document.documentElement.classList.toggle("t5-dark");
              }}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              className="solar-shell-icon"
              aria-label={`Mở yêu cầu báo giá, ${items.length} thiết bị`}
              onClick={() => setRfqOpen(true)}
            >
              <ShoppingBagIcon />
              {items.length > 0 && (
                <span className="solar-cart-count">{items.length}</span>
              )}
            </button>
            <button
              type="button"
              className="solar-shell-icon solar-menu-button"
              aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={menuOpen}
              aria-controls="solar-mobile-menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <XMarkIcon /> : <Bars3Icon />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="solar-mobile-menu"
            className="solar-mobile-menu"
            aria-label="Điều hướng trên điện thoại"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
      <div id="noi-dung-shell" tabIndex={-1}>
        {children}
      </div>
      <footer className="solar-site-footer">
        <div className="solar-container solar-footer-grid">
          <div>
            <SolarLogo
              name={brand.name}
              variant="white"
              className="solar-shell-logo"
            />
            <p>{brand.slogan}</p>
            <p className="solar-footer-note">
              Bản demo không phải hồ sơ năng lực hay báo giá thương mại.
            </p>
          </div>
          <div>
            <h2>Khám phá</h2>
            <Link href="/service">Giải pháp điện mặt trời</Link>
            <Link href="/product">Thiết bị</Link>
            <Link href="/about-us">Về doanh nghiệp</Link>
          </div>
          <div>
            <h2>Trao đổi với {brand.name}</h2>
            {brand.hotlines.map((h) => (
              <a key={h.id} href={`tel:${h.phone}`}>
                {h.label}: {h.phone}
              </a>
            ))}
            <p>{brand.email}</p>
            <p>{brand.address}</p>
            {brand.socials.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <div className="solar-container solar-footer-bottom">
          © {new Date().getFullYear()} {brand.name} · Thông tin mẫu cần được xác
          nhận trước khi sử dụng.
        </div>
      </footer>
      <StickyContact />
      {rfqOpen && (
        <div
          className="solar-rfq-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rfq-heading"
        >
          <button
            type="button"
            className="solar-rfq-backdrop"
            aria-label="Đóng yêu cầu báo giá"
            onClick={() => setRfqOpen(false)}
            tabIndex={-1}
          />
          <aside ref={drawer} className="solar-rfq-drawer">
            <div className="solar-rfq-heading">
              <h2 id="rfq-heading">Yêu cầu báo giá thiết bị</h2>
              <button
                type="button"
                className="solar-shell-icon"
                aria-label="Đóng yêu cầu"
                onClick={() => setRfqOpen(false)}
              >
                <XMarkIcon />
              </button>
            </div>
            {selectedProducts.length ? (
              <div className="solar-rfq-items">
                {selectedProducts.map((product) => (
                  <div className="solar-card" key={product.slug}>
                    <strong>
                      {product.brand} {product.name}
                    </strong>
                    <button
                      type="button"
                      onClick={() => ctx.remove(product.slug)}
                    >
                      Bỏ khỏi yêu cầu
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="solar-note">
                Chưa có thiết bị. Chọn sản phẩm trong danh mục để tạo yêu cầu
                báo giá chung.
              </p>
            )}
            <Link
              href={
                items.length
                  ? `/contact-us?rfq=${encodeURIComponent(items.join(","))}`
                  : "/product"
              }
              onClick={() => setRfqOpen(false)}
              className="solar-button solar-button-primary"
            >
              {items.length ? "Tiếp tục gửi yêu cầu" : "Xem danh mục thiết bị"}
            </Link>
          </aside>
        </div>
      )}
    </RfqContext.Provider>
  );
}
