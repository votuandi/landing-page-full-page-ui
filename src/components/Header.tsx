"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Brand from "@/components/template/Brand";
import { NAVIGATION_ITEMS, SITE_CONFIG } from "@/utils/constants";
export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    function close(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    }
    if (open) document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="site-header">
      <div className="header-top">
        <div className="shell">
          <span>Giải pháp điện mặt trời · Đồng Tháp</span>
          <a href={`tel:${SITE_CONFIG.phone}`}>
            Hotline: {SITE_CONFIG.phoneDisplay}
          </a>
        </div>
      </div>
      <div className="shell header-main">
        <Link href="/" aria-label={`${SITE_CONFIG.name} - Trang chủ`}>
          <Brand />
        </Link>
        <button
          ref={menuButton}
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="main-navigation"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? "Đóng ✕" : "Menu ☰"}
        </button>
        <nav
          id="main-navigation"
          aria-label="Điều hướng chính"
          className={`main-nav ${open ? "is-open" : ""}`}
        >
          {NAVIGATION_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                (
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href)
                )
                  ? "page"
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <Link href="/contact-us" className="button button-dark header-cta">
          Nhận tư vấn <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
