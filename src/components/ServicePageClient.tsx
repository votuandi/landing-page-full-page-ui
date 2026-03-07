"use client";

import React, { useState } from "react";
import AllServicesSection from "@/components/AllServicesSection";
import WarrantySection from "@/components/WarrantySection";

interface Service {
    id: number;
    title: string;
    description: string | null;
    image: string | null;
    features: string[];
    price: string | null;
    category: string;
    duration: string | null;
    warranty: string | null;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

interface ServicePageClientProps {
    services: Service[];
}

export default function ServicePageClient({ services }: ServicePageClientProps) {
    const [activeTab, setActiveTab] = useState<"services" | "warranty">(
        "services"
    );

    return (
        <main className="min-h-screen">
            <div className="bg-gray-50">
                {/* Page Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                                Dịch Vụ Năng Lượng Mặt Trời
                            </h1>
                            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                                Trọng Tín Solar cung cấp đầy đủ các dịch vụ từ tư vấn, thiết kế,
                                lắp đặt đến bảo trì hệ thống năng lượng mặt trời. Chúng tôi cam
                                kết mang đến giải pháp tối ưu và dịch vụ chất lượng cao nhất.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Service Tabs */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab("services")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === "services"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <span className="flex items-center space-x-2">
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
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>Tất cả dịch vụ</span>
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab("warranty")}
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === "warranty"
                                        ? "border-blue-500 text-blue-600"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                <span className="flex items-center space-x-2">
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
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                        />
                                    </svg>
                                    <span>Bảo hành</span>
                                </span>
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === "services" ? (
                    <AllServicesSection services={services} />
                ) : (
                    <WarrantySection />
                )}
            </div>
        </main>
    );
}
