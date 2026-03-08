"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Service } from "@/types";

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  // Strip HTML tags for preview text
  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') {
      // Server-side: use a simple regex to strip HTML tags
      return html.replace(/<[^>]*>/g, '');
    }
    // Client-side: use DOM API
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const getCategoryColor = (category: Service["category"]) => {
    switch (category) {
      case "household":
        return "bg-green-100 text-green-800";
      case "business":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-orange-100 text-orange-800";
      case "consultation":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryLabel = (category: Service["category"]) => {
    switch (category) {
      case "household":
        return "Hộ gia đình";
      case "business":
        return "Doanh nghiệp";
      case "maintenance":
        return "Bảo trì";
      case "consultation":
        return "Tư vấn";
      default:
        return "Khác";
    }
  };

  return (
    <Link href={`/service/${service.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer">
      <div className="relative h-48 w-full">
        <Image
          src={service.image || "/images/solar-installation-hero.jpg"}
          alt={`${service.title} - Dịch vụ năng lượng mặt trời`}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-4 left-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
              service.category
            )}`}
          >
            {getCategoryLabel(service.category)}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {service.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-3">
          {service.description ? stripHtml(service.description) : 'Không có mô tả'}
        </p>

        {service.features && service.features.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Đặc điểm nổi bật:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {service.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
              {service.features.length > 3 && (
                <li className="text-xs text-gray-500 ml-6">
                  +{service.features.length - 3} tính năng khác
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-blue-600">
              {service.price || "Liên hệ"}
            </span>
            {service.duration && (
              <span className="text-sm text-gray-500">
                Thời gian: {service.duration}
              </span>
            )}
          </div>
          {service.warranty && (
            <div className="text-right">
              <span className="text-sm text-gray-500">Bảo hành</span>
              <div className="text-sm font-medium text-green-600">
                {service.warranty}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <span className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors">
            Xem chi tiết →
          </span>
        </div>
      </div>
    </div>
    </Link>
  );
}
