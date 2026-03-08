"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { handleShareToFacebook } from "@/utils/shareUtils";

interface Project {
    id: number;
    title: string;
    location: string | null;
    capacity: string | null;
    completedDate: string | null;
    imageUrl: string | null;
    description: string | null;
    detail: string | null;
    category: string;
    client: string | null;
}

interface ProjectDetailContentProps {
    project: Project;
}

export default function ProjectDetailContent({ project }: ProjectDetailContentProps) {
    const [imageError, setImageError] = useState(false);

    const getCategoryColor = (category: string) => {
        const colors = {
            "Công nghiệp": "bg-blue-100 text-blue-800",
            "Dân dụng": "bg-green-100 text-green-800",
            "Thương mại": "bg-orange-100 text-orange-800",
            "Giáo dục": "bg-purple-100 text-purple-800",
            "Du lịch": "bg-pink-100 text-pink-800",
        };
        return (
            colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-600 mb-8">
                <Link href="/" className="hover:text-solar-blue">
                    Trang chủ
                </Link>
                <span className="mx-2">/</span>
                <Link href="/projects" className="hover:text-solar-blue">
                    Dự án
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{project.title}</span>
            </nav>

            <div className="max-w-5xl mx-auto">
                {/* Project Header */}
                <header className="mb-8">
                    {/* Category */}
                    <div className="flex items-center space-x-4 mb-4">
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                                project.category
                            )}`}
                        >
                            {project.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                        {project.title}
                    </h1>

                    {/* Description */}
                    {project.description && (
                        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                            {project.description}
                        </p>
                    )}

                    {/* Project Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-200">
                        {/* Location */}
                        {project.location && (
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-blue-600"
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
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Địa điểm</div>
                                    <div className="text-gray-900 font-semibold">{project.location}</div>
                                </div>
                            </div>
                        )}

                        {/* Capacity */}
                        {project.capacity && (
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-orange-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 10V3L4 14h7v7l9-11h-7z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Công suất</div>
                                    <div className="text-gray-900 font-semibold">{project.capacity}</div>
                                </div>
                            </div>
                        )}

                        {/* Completed Date */}
                        {project.completedDate && (
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Hoàn thành</div>
                                    <div className="text-gray-900 font-semibold">{project.completedDate}</div>
                                </div>
                            </div>
                        )}

                        {/* Client */}
                        {project.client && (
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="w-5 h-5 text-purple-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 font-medium">Khách hàng</div>
                                    <div className="text-gray-900 font-semibold">{project.client}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Featured Image */}
                <div className="relative h-64 md:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden mb-8 shadow-lg">
                    {!imageError ? (
                        <Image
                            src={project.imageUrl || '/images/placeholder.jpg'}
                            alt={project.title}
                            fill
                            className="object-cover"
                            onError={() => setImageError(true)}
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-gray-500">
                                <svg
                                    className="w-16 h-16 mx-auto mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                </svg>
                                <span>Ảnh dự án</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Project Details */}
                {project.detail && (
                    <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 rich-text-content">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Chi tiết dự án</h2>
                        <div
                            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:leading-relaxed prose-img:rounded-lg prose-img:shadow-md"
                            dangerouslySetInnerHTML={{ __html: project.detail || "" }}
                        />
                    </div>
                )}

                {/* Project Highlights */}
                <div className="bg-gradient-to-br from-solar-blue to-primary-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
                    <h2 className="text-2xl font-bold mb-6">Điểm nổi bật của dự án</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start space-x-3">
                            <svg
                                className="w-6 h-6 flex-shrink-0 mt-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <h3 className="font-semibold mb-1">Tiết kiệm chi phí điện</h3>
                                <p className="text-sm opacity-90">
                                    Giảm đáng kể hóa đơn tiền điện hàng tháng
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <svg
                                className="w-6 h-6 flex-shrink-0 mt-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <h3 className="font-semibold mb-1">Thân thiện môi trường</h3>
                                <p className="text-sm opacity-90">
                                    Giảm lượng khí thải CO2, bảo vệ môi trường
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <svg
                                className="w-6 h-6 flex-shrink-0 mt-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <h3 className="font-semibold mb-1">Bảo hành dài hạn</h3>
                                <p className="text-sm opacity-90">
                                    Bảo hành lâu dài cho tấm pin
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <svg
                                className="w-6 h-6 flex-shrink-0 mt-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <div>
                                <h3 className="font-semibold mb-1">Hỗ trợ kỹ thuật 24/7</h3>
                                <p className="text-sm opacity-90">
                                    Đội ngũ kỹ thuật sẵn sàng hỗ trợ mọi lúc
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Share Section */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Chia sẻ dự án
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleShareToFacebook}
                            className="flex items-center space-x-2 bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                            </svg>
                            <span>Chia sẻ lên Facebook</span>
                        </button>
                    </div>
                </div>

                {/* Navigation and CTA */}
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 gap-4">
                    <Link
                        href="/projects"
                        className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors"
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
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        <span>Quay lại dự án</span>
                    </Link>

                    <div className="flex flex-wrap gap-3">
                        <Link href="/contact-us">
                            <button className="bg-solar-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors font-semibold">
                                Liên hệ tư vấn
                            </button>
                        </Link>
                        <Link href="/product">
                            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg transition-colors font-semibold">
                                Xem sản phẩm
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
