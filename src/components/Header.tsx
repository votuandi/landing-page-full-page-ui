"use client";

import { useState } from "react";
import Link from "next/link";
import { NAVIGATION_ITEMS, SITE_CONFIG } from "@/utils/constants";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="bg-primary-700 py-3 text-white">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 md:flex-row">
          <div>
            <p className="font-bold">{SITE_CONFIG.name}</p>
            <p className="text-sm text-green-50">
              Giải pháp năng lượng sạch cho gia đình và doanh nghiệp
            </p>
          </div>
          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="rounded-lg bg-solar-yellow px-4 py-2 font-semibold text-slate-900 transition hover:bg-yellow-300"
          >
            Hotline: {SITE_CONFIG.phone}
          </a>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b border-green-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" aria-label="Trọng Tín Solar - Trang chủ">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 font-bold text-white">
              TT
            </span>
            <span className="text-xl font-bold text-primary-700">Trọng Tín Solar</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Điều hướng chính">
            {NAVIGATION_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-medium text-slate-700 transition hover:text-primary-600"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="rounded-lg border border-green-200 p-2 text-primary-700 lg:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <nav id="mobile-navigation" className="border-t border-green-100 px-4 py-3 lg:hidden" aria-label="Điều hướng di động">
            <div className="flex flex-col gap-1">
              {NAVIGATION_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 font-medium text-slate-700 hover:bg-green-50 hover:text-primary-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
