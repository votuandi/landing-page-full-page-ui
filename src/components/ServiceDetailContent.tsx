"use client";

import Image from "next/image";
import Link from "next/link";
import { Service } from "@/types";
import { SERVICES } from "@/utils/constants";
import { useState } from "react";

interface ServiceDetailContentProps {
  service: Service;
}

const categoryNames = {
  household: "Hộ gia đình",
  business: "Doanh nghiệp",
  maintenance: "Bảo trì",
  consultation: "Tư vấn",
};

const processSteps = {
  household: [
    {
      step: 1,
      title: "Liên hệ tư vấn",
      description: "Gọi điện hoặc nhắn tin để được tư vấn miễn phí",
    },
    {
      step: 2,
      title: "Khảo sát thực tế",
      description: "Kỹ thuật viên đến khảo sát và đo đạc thực tế",
    },
    {
      step: 3,
      title: "Thiết kế & báo giá",
      description: "Lập thiết kế chi tiết và báo giá cụ thể",
    },
    {
      step: 4,
      title: "Ký hợp đồng",
      description: "Thỏa thuận các điều khoản và ký hợp đồng",
    },
    {
      step: 5,
      title: "Thi công lắp đặt",
      description: "Tiến hành lắp đặt theo đúng thiết kế",
    },
    {
      step: 6,
      title: "Nghiệm thu & bàn giao",
      description: "Kiểm tra chất lượng và bàn giao hệ thống",
    },
  ],
  business: [
    {
      step: 1,
      title: "Liên hệ & trao đổi",
      description: "Trao đổi nhu cầu và yêu cầu cụ thể",
    },
    {
      step: 2,
      title: "Khảo sát chi tiết",
      description: "Khảo sát toàn diện quy mô và điều kiện",
    },
    {
      step: 3,
      title: "Phân tích & thiết kế",
      description: "Phân tích kỹ thuật và lập thiết kế sơ bộ",
    },
    {
      step: 4,
      title: "Thuyết trình đề xuất",
      description: "Trình bày giải pháp và thương thảo",
    },
    {
      step: 5,
      title: "Hoàn thiện hồ sơ",
      description: "Hoàn thiện thiết kế và hồ sơ kỹ thuật",
    },
    {
      step: 6,
      title: "Triển khai dự án",
      description: "Tiến hành thi công theo kế hoạch",
    },
    {
      step: 7,
      title: "Vận hành & bảo trì",
      description: "Hướng dẫn vận hành và lập kế hoạch bảo trì",
    },
  ],
  maintenance: [
    {
      step: 1,
      title: "Báo cáo sự cố",
      description: "Liên hệ hotline để báo cáo vấn đề",
    },
    {
      step: 2,
      title: "Tiếp nhận & phân loại",
      description: "Tiếp nhận và phân loại mức độ ưu tiên",
    },
    {
      step: 3,
      title: "Cử kỹ thuật viên",
      description: "Cử kỹ thuật viên có chuyên môn phù hợp",
    },
    {
      step: 4,
      title: "Chẩn đoán & báo giá",
      description: "Chẩn đoán nguyên nhân và báo giá sửa chữa",
    },
    {
      step: 5,
      title: "Thực hiện sửa chữa",
      description: "Tiến hành sửa chữa hoặc thay thế",
    },
    {
      step: 6,
      title: "Kiểm tra & bàn giao",
      description: "Kiểm tra hoạt động và bàn giao",
    },
  ],
  consultation: [
    {
      step: 1,
      title: "Đăng ký tư vấn",
      description: "Đăng ký dịch vụ tư vấn qua website hoặc điện thoại",
    },
    {
      step: 2,
      title: "Thu thập thông tin",
      description: "Thu thập thông tin hiện trạng và nhu cầu",
    },
    {
      step: 3,
      title: "Phân tích dữ liệu",
      description: "Phân tích dữ liệu tiêu thụ và đánh giá hiện trạng",
    },
    {
      step: 4,
      title: "Đề xuất giải pháp",
      description: "Đưa ra các phương án tối ưu",
    },
    {
      step: 5,
      title: "Trình bày báo cáo",
      description: "Trình bày báo cáo và khuyến nghị",
    },
    {
      step: 6,
      title: "Hỗ trợ triển khai",
      description: "Hỗ trợ triển khai các giải pháp được chọn",
    },
  ],
};

export default function ServiceDetailContent({
  service,
}: ServiceDetailContentProps) {
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "process" | "pricing"
  >("overview");

  const currentSteps = processSteps[service.category] || processSteps.household;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600 mb-8">
        <Link href="/" className="hover:text-solar-blue">
          Trang chủ
        </Link>
        <span className="mx-2">/</span>
        <Link href="/service" className="hover:text-solar-blue">
          Dịch vụ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{service.title}</span>
      </nav>

      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-solar-blue to-primary-600 rounded-2xl overflow-hidden mb-8">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl">
              <div className="mb-4">
                <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {categoryNames[service.category]}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {service.title}
              </h1>
              <div 
                className="text-white/90 text-lg prose prose-lg prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: service.description }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Service Image */}
          <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
            {!imageError ? (
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
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
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <span>Hình ảnh dịch vụ</span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: "overview", label: "Tổng quan" },
                  { id: "process", label: "Quy trình thực hiện" },
                  { id: "pricing", label: "Giá & thời gian" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-solar-blue text-solar-blue"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Mô tả dịch vụ
                    </h3>
                    <div 
                      className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: service.description }}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Dịch vụ bao gồm
                    </h3>
                    <ul className="space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <svg
                            className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Lợi ích
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
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
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          <span className="font-medium text-green-800">
                            Tiết kiệm chi phí
                          </span>
                        </div>
                        <p className="text-green-700 text-sm">
                          Giảm đáng kể hóa đơn điện hàng tháng
                        </p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium text-blue-800">
                            Chất lượng cao
                          </span>
                        </div>
                        <p className="text-blue-700 text-sm">
                          Sử dụng thiết bị và công nghệ tiên tiến
                        </p>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg
                            className="w-5 h-5 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
                            />
                          </svg>
                          <span className="font-medium text-yellow-800">
                            Thân thiện môi trường
                          </span>
                        </div>
                        <p className="text-yellow-700 text-sm">
                          Sử dụng năng lượng sạch, giảm phát thải CO2
                        </p>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
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
                              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M12 12h.01M12 12h.01"
                            />
                          </svg>
                          <span className="font-medium text-purple-800">
                            Hỗ trợ 24/7
                          </span>
                        </div>
                        <p className="text-purple-700 text-sm">
                          Đội ngũ kỹ thuật hỗ trợ mọi lúc
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "process" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Quy trình thực hiện dịch vụ
                  </h3>
                  <div className="space-y-6">
                    {currentSteps.map((step, index) => (
                      <div
                        key={step.step}
                        className="flex items-start space-x-4"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-solar-blue text-white rounded-full flex items-center justify-center font-semibold">
                            {step.step}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {step.title}
                          </h4>
                          <p className="text-gray-600">{step.description}</p>
                        </div>
                        {index < currentSteps.length - 1 && (
                          <div className="absolute left-5 mt-10 w-0.5 h-8 bg-gray-200"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "pricing" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg
                          className="w-5 h-5 text-solar-blue"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">
                          Giá dịch vụ
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-solar-blue">
                        {service.price}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg
                          className="w-5 h-5 text-solar-blue"
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
                        <span className="font-medium text-gray-900">
                          Thời gian thực hiện
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-700">
                        {service.duration}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg
                          className="w-5 h-5 text-solar-blue"
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
                        <span className="font-medium text-gray-900">
                          Bảo hành
                        </span>
                      </div>
                      <p className="text-lg font-semibold text-gray-700">
                        {service.warranty}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">
                          Lưu ý về giá
                        </h4>
                        <p className="text-yellow-700 text-sm">
                          Giá dịch vụ có thể thay đổi tùy thuộc vào quy mô, độ
                          phức tạp và yêu cầu cụ thể của từng dự án. Vui lòng
                          liên hệ để được báo giá chi tiết và chính xác nhất.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Đăng ký dịch vụ
            </h3>
            <div className="space-y-4">
              <button className="w-full bg-solar-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Liên hệ tư vấn miễn phí
              </button>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Đăng ký khảo sát
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">
                Thông tin liên hệ
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-solar-blue"
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
                  <span>Hotline: 0909019234</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-solar-blue"
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
                  <span>info@phanphoisolar.com</span>
                </div>
                <div className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-solar-blue mt-0.5"
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
                  <span>123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Services */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Dịch vụ liên quan
            </h3>
            <div className="space-y-3">
              {SERVICES.filter(
                (s) => s.id !== service.id && s.category === service.category
              )
                .slice(0, 3)
                .map((relatedService) => (
                  <Link
                    key={relatedService.id}
                    href={`/service/${relatedService.id}`}
                  >
                    <div className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                        {relatedService.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {relatedService.price}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Back to Services */}
      <div className="flex justify-center">
        <Link
          href="/service"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          ← Quay lại danh sách dịch vụ
        </Link>
      </div>
    </div>
  );
}
