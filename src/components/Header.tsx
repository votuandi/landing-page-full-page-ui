"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCompanyInfo } from "@/lib/features/companyInfo/companyInfoSlice";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { data: companyInfo } = useAppSelector((state) => state.companyInfo);
  const { offices } = useAppSelector((state) => state.offices);
  const mainOffice = offices.find((office) => office.isMainOffice) || offices[0];

  useEffect(() => {
    dispatch(fetchCompanyInfo());
  }, [dispatch]);

  const menuItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Sản phẩm", href: "/product" },
    { name: "Dịch vụ", href: "/service" },
    { name: "Dự án", href: "/projects" },
    { name: "Tin tức", href: "/news" },
    { name: "Về chúng tôi", href: "/about-us" },
    { name: "Liên hệ", href: "/contact-us" },
  ];

  return (
    <>
      <section className="border-b border-orange-100 bg-[#2f241a] text-stone-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 text-sm sm:px-6 lg:px-8">
          <p className="hidden text-stone-300 md:block">
            {companyInfo?.slogan || "Giải pháp năng lượng mặt trời bền vững"}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-stone-400 sm:inline">Tư vấn hệ thống solar</span>
            <a
              href={mainOffice?.phone ? `tel:${mainOffice.phone}` : "#"}
              className="rounded-full bg-amber-300 px-4 py-2 font-bold text-stone-900 transition hover:bg-amber-200"
            >
              {mainOffice?.phone ? `Hotline: ${mainOffice.phone}` : "Liên hệ tư vấn"}
            </a>
          </div>
        </div>
      </section>

      <header className="sticky top-0 z-50 border-b border-orange-100/80 bg-[#fffaf0]/95 shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[76px] items-center justify-between gap-6">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-orange-100">
                {companyInfo?.logoUrl ? (
                  <Image
                    src={companyInfo.logoUrl}
                    alt={companyInfo?.companyName || "Logo"}
                    fill
                    className="object-contain p-1"
                    sizes="44px"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-amber-300 to-orange-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-lg font-black tracking-tight text-stone-900 md:text-xl">
                  {companyInfo?.companyName || "Solar"}
                </div>
                <div className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-orange-600 sm:block">
                  Solar energy solutions
                </div>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {menuItems.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active
                      ? "bg-orange-600 text-white shadow-sm"
                      : "text-stone-700 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden lg:block">
              <Link
                href="/contact-us"
                className="inline-flex items-center rounded-full border border-orange-200 bg-white px-5 py-2.5 text-sm font-bold text-orange-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
              >
                Nhận tư vấn
              </Link>
            </div>

            <button
              onClick={() => setIsMenuOpen((value) => !value)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-200 bg-white text-stone-700 lg:hidden"
              aria-label="Mở menu"
              aria-expanded={isMenuOpen}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>

          {isMenuOpen && (
            <nav className="grid gap-2 border-t border-orange-100 py-4 lg:hidden">
              {menuItems.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${active
                      ? "bg-orange-600 text-white"
                      : "text-stone-700 hover:bg-orange-50 hover:text-orange-700"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
