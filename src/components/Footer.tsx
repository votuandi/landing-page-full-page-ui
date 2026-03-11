"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchOffices } from "@/lib/features/offices/officesSlice";
import { fetchCompanyInfo } from "@/lib/features/companyInfo/companyInfoSlice";
import { fetchProductCategories } from "@/lib/features/productCategories/productCategoriesSlice";
import { Service } from "@/types";

export default function Footer() {
  const dispatch = useAppDispatch();
  const { offices } = useAppSelector((state) => state.offices);
  const { data: companyInfo } = useAppSelector((state) => state.companyInfo);
  const { categories: productCategories } = useAppSelector((state) => state.productCategories);
  const [services, setServices] = useState<Service[]>([]);
  // Fetch offices and company info on component mount
  useEffect(() => {
    dispatch(fetchOffices({ limit: 100 }));
    dispatch(fetchCompanyInfo());
    dispatch(fetchProductCategories({ limit: 10, page: 1 }));
  }, [dispatch]);

  // Get main office or first office
  const mainOffice = offices.find((office) => office.isMainOffice) || offices[0];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services?limit=8");

        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }

        const data = await response.json();
        setServices(data.services || []);
      } catch (err) {
        console.error("Error fetching services:", err);
      }
    };

    fetchServices();
  }, []);

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden relative">
                {companyInfo?.logoUrl ?
                  <Image src={companyInfo?.logoUrl || ""} alt={companyInfo?.companyName || "Logo"} width={40} height={40} className="object-contain" />
                  : <div className="w-full h-full bg-gray-200" />
                }
              </div>
              <span className="font-bold text-xl">{companyInfo?.companyName || ""}</span>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {companyInfo?.slogan || ""}
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {/* Facebook */}
              {companyInfo?.facebook && <a
                href={companyInfo?.facebook}
                className="w-10 h-10 bg-gray-800 hover:bg-[#2d63fb] rounded-lg flex items-center justify-center transition-colors"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 2.192v2.296h3.606l-.576 3.47H13.874v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>}

              {/* Youtube */}
              {companyInfo?.youtube && <a
                href={companyInfo?.youtube}
                className="w-10 h-10 bg-gray-800 hover:bg-[#fa0037] rounded-lg flex items-center justify-center transition-colors"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>}

              {/* Instagram */}
              {companyInfo?.instagram && <a
                href={companyInfo?.instagram}
                className="w-10 h-10 bg-gray-800 hover:bg-[#fb266c] rounded-lg flex items-center justify-center transition-colors"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>}

              {/* Zalo */}
              {companyInfo?.zalo && <a
                href={companyInfo?.zalo}
                className="w-10 h-10 bg-gray-800 hover:bg-primary-500 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 460.1 436.6">
                  <path fill="currentColor" className="st0" d="M82.6 380.9c-1.8-.8-3.1-1.7-1-3.5 1.3-1 2.7-1.9 4.1-2.8 13.1-8.5 25.4-17.8 33.5-31.5 6.8-11.4 5.7-18.1-2.8-26.5C69 269.2 48.2 212.5 58.6 145.5 64.5 107.7 81.8 75 107 46.6c15.2-17.2 33.3-31.1 53.1-42.7 1.2-.7 2.9-.9 3.1-2.7-.4-1-1.1-.7-1.7-.7-33.7 0-67.4-.7-101 .2C28.3 1.7.5 26.6.6 62.3c.2 104.3 0 208.6 0 313 0 32.4 24.7 59.5 57 60.7 27.3 1.1 54.6.2 82 .1 2 .1 4 .2 6 .2H290c36 0 72 .2 108 0 33.4 0 60.5-27 60.5-60.3v-.6-58.5c0-1.4.5-2.9-.4-4.4-1.8.1-2.5 1.6-3.5 2.6-19.4 19.5-42.3 35.2-67.4 46.3-61.5 27.1-124.1 29-187.6 7.2-5.5-2-11.5-2.2-17.2-.8-8.4 2.1-16.7 4.6-25 7.1-24.4 7.6-49.3 11-74.8 6zm72.5-168.5c1.7-2.2 2.6-3.5 3.6-4.8 13.1-16.6 26.2-33.2 39.3-49.9 3.8-4.8 7.6-9.7 10-15.5 2.8-6.6-.2-12.8-7-15.2-3-.9-6.2-1.3-9.4-1.1-17.8-.1-35.7-.1-53.5 0-2.5 0-5 .3-7.4.9-5.6 1.4-9 7.1-7.6 12.8 1 3.8 4 6.8 7.8 7.7 2.4.6 4.9.9 7.4.8 10.8.1 21.7 0 32.5.1 1.2 0 2.7-.8 3.6 1-.9 1.2-1.8 2.4-2.7 3.5-15.5 19.6-30.9 39.3-46.4 58.9-3.8 4.9-5.8 10.3-3 16.3s8.5 7.1 14.3 7.5c4.6.3 9.3.1 14 .1 16.2 0 32.3.1 48.5-.1 8.6-.1 13.2-5.3 12.3-13.3-.7-6.3-5-9.6-13-9.7-14.1-.1-28.2 0-43.3 0zm116-52.6c-12.5-10.9-26.3-11.6-39.8-3.6-16.4 9.6-22.4 25.3-20.4 43.5 1.9 17 9.3 30.9 27.1 36.6 11.1 3.6 21.4 2.3 30.5-5.1 2.4-1.9 3.1-1.5 4.8.6 3.3 4.2 9 5.8 14 3.9 5-1.5 8.3-6.1 8.3-11.3.1-20 .2-40 0-60-.1-8-7.6-13.1-15.4-11.5-4.3.9-6.7 3.8-9.1 6.9zm69.3 37.1c-.4 25 20.3 43.9 46.3 41.3 23.9-2.4 39.4-20.3 38.6-45.6-.8-25-19.4-42.1-44.9-41.3-23.9.7-40.8 19.9-40 45.6zm-8.8-19.9c0-15.7.1-31.3 0-47 0-8-5.1-13-12.7-12.9-7.4.1-12.3 5.1-12.4 12.8-.1 4.7 0 9.3 0 14v79.5c0 6.2 3.8 11.6 8.8 12.9 6.9 1.9 14-2.2 15.8-9.1.3-1.2.5-2.4.4-3.7.2-15.5.1-31 .1-46.5z"></path>
                </svg>
              </a>}

              {/* Tiktok */}
              {companyInfo?.tiktok && <a
                href={companyInfo?.tiktok}
                className="w-10 h-10 bg-gray-800 hover:bg-black hover:border-gray-200 hover:border-solid hover:border-[1px] rounded-lg flex items-center justify-center transition-colors"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.61-5.66-.02-.34-.02-.69 0-1.03.18-2.28 1.43-4.36 3.4-5.48 1.34-.78 2.96-1.04 4.51-.78v4.05c-.86-.18-1.77-.07-2.55.33-.8.41-1.38 1.13-1.57 2.01-.16.63-.05 1.32.31 1.86.35.53.89.89 1.52 1.05.86.22 1.8-.02 2.45-.6.55-.47.88-1.14.93-1.87.05-7.79.03-15.58.03-23.37z" />
                </svg>
              </a>}
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Sản phẩm</h3>
            <ul className="space-y-3">
              {productCategories.map((productCategory, index) => (
                <li key={index}>
                  <Link
                    href={`/product?category=${productCategory.id}`}
                    className="text-gray-300 hover:text-[#41b9ff] transition-colors"
                  >
                    {productCategory.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Dịch vụ</h3>
            <ul className="space-y-3">
              {services.map((service, index) => (
                <li key={index}>
                  <Link
                    href={`/service/${service.id}`}
                    className="text-gray-300 hover:text-[#41b9ff] transition-colors"
                  >
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Liên hệ</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-primary-400 mt-1 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-gray-300 text-sm">
                  {mainOffice?.address || ""}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-primary-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <a
                  href={`tel:${mainOffice?.phone || ""}`}
                  className="text-gray-300 hover:text-[#41b9ff] transition-colors"
                >
                  {mainOffice?.phone || "0909 019 234"}
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-primary-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a
                  href={`mailto:${mainOffice?.email || "info@phanphoisolar.com"}`}
                  className="text-gray-300 hover:text-[#41b9ff] transition-colors"
                >
                  {mainOffice?.email || "info@phanphoisolar.com"}
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-primary-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-300 text-sm">
                  {mainOffice?.workingTime || "Thứ 2 - Thứ 6: 8:00 - 17:30\nThứ 7: 8:00 - 12:00"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 {companyInfo?.companyName || ""}. Tất cả quyền được bảo lưu.
            </p>

            <div className="flex space-x-6">
              <span
                className="text-gray-400 hover:text-[#41b9ff] text-sm transition-colors"
              >
                Website này được phát triển bới Võ Tuấn Dĩ
              </span>
              <Link
                href="mailto:divt.it97@gmail.com"
                className="text-gray-400 hover:text-[#41b9ff] text-sm transition-colors"
              >
                divt.it97@gmail.com
              </Link>

            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
