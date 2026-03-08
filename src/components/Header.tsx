"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchCompanyInfo } from "@/lib/features/companyInfo/companyInfoSlice";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { data: companyInfo } = useAppSelector((state) => state.companyInfo);
  const { offices } = useAppSelector((state) => state.offices);
  const mainOffice = offices.find((office) => office.isMainOffice) || offices[0];

  // Fetch company info on component mount
  useEffect(() => {
    dispatch(fetchCompanyInfo());
  }, [dispatch]);

  const menuItems = [
    { name: "Trang chủ", href: "/" },
    { name: "Sản phẩm", href: "/product" },
    { name: "Dịch vụ", href: "/service" },
    { name: "Dự án", href: "/projects" },
    { name: "Tin Tức", href: "/news" },
    { name: "Về Chúng tôi", href: "/about-us" },
    { name: "Liên hệ", href: "/contact-us" },
  ];

  return (
    <>
      {/* Top Banner */}
      <section className="hero-gradient text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-2 md:mb-0">
              <div className="text-lg md:text-xl font-bold">{companyInfo?.companyName || "Tên Công ty"}</div>
              <p className="text-sm opacity-90">
                {companyInfo?.slogan || "Slogan của công ty"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  className="px-4 py-2 rounded-lg text-gray-800 w-64"
                />
              </div>
              <a
                href={mainOffice?.phone ? `tel:${mainOffice.phone}` : ""}
                className="bg-solar-orange hover:bg-orange-600 px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Hotline: {mainOffice?.phone || ""}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden relative">
                {companyInfo?.logoUrl ?
                  <Image src={companyInfo?.logoUrl || ""} alt={companyInfo?.companyName || "Logo"} width={40} height={40} className="object-contain" />
                  : <div className="w-full h-full bg-gray-200" />
                }
              </div>
              <span className="font-bold text-xl text-gray-800">
                {companyInfo?.companyName || "Tên Công ty"}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 font-medium transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex items-center px-3 py-2 border rounded text-gray-500 border-gray-300 hover:text-gray-700 hover:border-gray-400"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="lg:hidden py-4 border-t">
              <div className="flex flex-col space-y-2">
                {menuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="text-gray-700 hover:text-primary-600 font-medium py-2 px-4 rounded hover:bg-gray-50 transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
}
