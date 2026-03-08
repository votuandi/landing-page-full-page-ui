import { Metadata } from "next";
import AllServicesSection from "@/components/AllServicesSection";
import WarrantySection from "@/components/WarrantySection";
import { prisma } from "@/lib/prisma";
import ServicePageClient from "@/components/ServicePageClient";
import { Service } from "@/types";

async function getCompanyInfo() {
  try {
    const companyInfo = await prisma.companyInfo.findUnique({
      where: { id: 1 },
    });
    return companyInfo;
  } catch (error) {
    console.error("Error fetching company info for metadata:", error);
    return null;
  }
}

async function getServices() {
  try {
    const servicesRaw = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    // Parse JSON fields
    const services = servicesRaw.map((service) => ({
      ...service,
      benefits: service.benefits ? JSON.parse(service.benefits) : null,
      implementationProcess: service.implementationProcess
        ? JSON.parse(service.implementationProcess)
        : null,
      category: service.category as "household" | "business" | "maintenance" | "consultation",
      features: service.features || [],
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }));

    return services as unknown as Service[];
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCompanyInfo();

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const baseUrl = "https://phanphoisolar.com";
  const title = `Dịch vụ năng lượng mặt trời | ${companyName}`;
  const description = `Khám phá các dịch vụ năng lượng mặt trời chuyên nghiệp từ ${companyName}. Tư vấn, thiết kế, lắp đặt và bảo trì hệ thống solar với đội ngũ kỹ thuật giàu kinh nghiệm.`;
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords: `dịch vụ năng lượng mặt trời, lắp đặt solar, tư vấn năng lượng mặt trời, bảo trì hệ thống solar, thiết kế hệ thống điện mặt trời, ${companyName}`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/service",
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/service`,
      siteName: companyName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description.substring(0, 200),
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function ServicePage() {
  const [companyInfo, services] = await Promise.all([
    getCompanyInfo(),
    getServices(),
  ]);

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
                {companyInfo?.companyName || "Tên Công ty"} cung cấp đầy đủ các
                dịch vụ từ tư vấn, thiết kế, lắp đặt đến bảo trì hệ thống năng
                lượng mặt trời. Chúng tôi cam kết mang đến giải pháp tối ưu và
                dịch vụ chất lượng cao nhất.
              </p>
            </div>
          </div>
        </div>

        {/* Service Content */}
        <ServicePageClient services={services} />
      </div>
    </main>
  );
}
