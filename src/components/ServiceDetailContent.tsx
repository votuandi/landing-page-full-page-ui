"use client";

import Image from "next/image";
import Link from "next/link";
import { Service } from "@/types";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchOffices } from "@/lib/features/offices/officesSlice";

interface RelatedService {
  id: number;
  title: string;
  image: string | null;
  category: string;
  price?: string | null;
}

interface ServiceDetailContentProps {
  service: Service;
  relatedServices?: RelatedService[];
}

const categoryNames = {
  household: "Hộ gia đình",
  business: "Doanh nghiệp",
  maintenance: "Bảo trì",
  consultation: "Tư vấn",
};

export default function ServiceDetailContent({
  service,
  relatedServices: propRelatedServices = [],
}: ServiceDetailContentProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "process" | "pricing"
  >("overview");
  const [relatedServices, setRelatedServices] = useState<Service[]>(propRelatedServices as Service[]);

  const dispatch = useAppDispatch();
  const { offices } = useAppSelector((state) => state.offices);

  // Fetch offices on component mount
  useEffect(() => {
    dispatch(fetchOffices({ limit: 100 }));
  }, [dispatch]);

  // Get main office or first office
  const mainOffice = offices.find((office) => office.isMainOffice) || offices[0];

  // Fetch related services only if not provided as prop (for SEO, prefer server-side)
  useEffect(() => {
    if (propRelatedServices.length > 0) {
      return; // Use server-side provided related services
    }

    const fetchRelatedServices = async () => {
      try {
        const response = await fetch(
          `/api/services?category=${service.category}&limit=100`
        );
        if (response.ok) {
          const data = await response.json();
          // Filter out current service and limit to 3
          const filtered = data.services
            .filter((s: Service) => s.id !== service.id)
            .slice(0, 3);
          setRelatedServices(filtered);
        }
      } catch (error) {
        console.error("Error fetching related services:", error);
      }
    };

    fetchRelatedServices();
  }, [service.id, service.category, propRelatedServices.length]);

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
              {service.description && (
                <div
                  className="text-white/90 text-lg prose prose-lg prose-invert max-w-none"
                >Bảo hành: {service.warranty}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 rich-text-content">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Service Image */}
          <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
            {!imageError && service.image ? (
              <Image
                src={service.image}
                alt={`${service.title} - Dịch vụ năng lượng mặt trời`}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                priority
                sizes="(max-width: 768px) 100vw, 66vw"
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
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
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
                  {service.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Mô tả dịch vụ
                      </h3>
                      <div
                        className="text-gray-600 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: service.description }}
                      />
                    </div>
                  )}

                  {service.features && service.features.length > 0 && (
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
                  )}

                  {service.benefits && service.benefits.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Lợi ích
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {service.benefits.map((benefit, index) => (
                          <div key={index} className={`bg-${benefit.color}-100 p-4 rounded-lg`}>
                            <div className="flex items-center space-x-2 mb-2">
                              <svg
                                className={`w-5 h-5 text-${benefit.color}-600`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={benefit.icon}
                                />
                              </svg>
                              <span className={`font-medium text-${benefit.color}-800`}>
                                {benefit.title}
                              </span>
                            </div>
                            <p className={`text-${benefit.color}-700 text-sm`}>
                              {benefit.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "process" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Quy trình thực hiện dịch vụ
                  </h3>
                  <div className="space-y-6">
                    {(service.implementationProcess && service.implementationProcess.length > 0
                      ? service.implementationProcess
                      : []
                    ).map((step, index) => (
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
                        {index < ((service.implementationProcess && service.implementationProcess.length > 0
                          ? service.implementationProcess
                          : []).length - 1) && (
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
                    <div className="bg-orange-50 p-4 rounded-lg">
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
                            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">
                          Giá dịch vụ
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-solar-blue">
                        {service.price || "Liên hệ"}
                      </p>
                    </div>

                    {service.duration && (
                      <div className="bg-blue-50 p-4 rounded-lg">
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
                    )}

                    {service.warranty && (
                      <div className="bg-green-50 p-4 rounded-lg">
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
                    )}
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
              <button
                onClick={() => {
                  router.push(
                    `/contact-us?type=service&serviceId=${service.id}&action=0`
                  );
                }}
                className="w-full bg-solar-blue hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Liên hệ tư vấn miễn phí
              </button>
              <button
                onClick={() => {
                  router.push(
                    `/contact-us?type=service&serviceId=${service.id}&action=1`
                  );
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
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
                  <span>{mainOffice?.phone || ""}</span>
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
                  <span>{mainOffice?.email || ""}</span>
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
                  <span>{mainOffice?.address || ""}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Services */}
          {relatedServices.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dịch vụ liên quan
              </h3>
              <div className="space-y-3 flex flex-col gap-1">
                {relatedServices.map((relatedService) => (
                  <Link
                    key={relatedService.id}
                    href={`/service/${relatedService.id}`}
                  >
                    <div className="p-3 border border-lime-200 rounded-lg bg-lime-50 hover:bg-lime-100 transition-colors">
                      <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                        {relatedService.title}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {relatedService.price || "Liên hệ"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
