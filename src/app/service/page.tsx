import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ServicePageClient from "@/components/ServicePageClient";
import { Service } from "@/types";
import { getCachedCompanyInfo } from "@/lib/cachedCompany";
import WarmPageHero from "@/components/WarmPageHero";

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
  const companyInfo = await getCachedCompanyInfo();

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
    getCachedCompanyInfo(),
    getServices(),
  ]);

  return (
    <main className="min-h-screen">
      <div className="bg-[#fffaf0]">
        <WarmPageHero
          eyebrow="Từ khảo sát đến vận hành"
          title="Dịch vụ solar trọn quy trình, rõ trách nhiệm ở từng bước"
          description={`${companyInfo?.companyName || "Chúng tôi"} đồng hành từ tư vấn, thiết kế, lắp đặt đến bảo trì để hệ thống hoạt động ổn định và dễ kiểm soát lâu dài.`}
          image="/images/solar-installation-hero.jpg"
          primaryLabel="Đăng ký khảo sát"
          primaryHref="/contact-us"
          secondaryLabel="Xem sản phẩm"
          secondaryHref="/product"
        />

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["01", "Khảo sát", "Đánh giá hiện trạng, nhu cầu và điều kiện thi công."],
              ["02", "Thiết kế", "Lên cấu hình, phương án kỹ thuật và dự toán phù hợp."],
              ["03", "Lắp đặt", "Thi công gọn, an toàn và kiểm tra vận hành trước bàn giao."],
              ["04", "Bảo hành", "Theo dõi, bảo trì và hỗ trợ kỹ thuật sau khi hệ thống hoạt động."],
            ].map(([step, title, detail]) => (
              <div key={step} className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
                <div className="text-sm font-black tracking-[0.2em] text-orange-600">{step}</div>
                <h2 className="mt-3 text-xl font-bold text-stone-900">{title}</h2>
                <p className="mt-2 leading-7 text-stone-600">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Service Content */}
        <ServicePageClient services={services} />
      </div>
    </main>
  );
}
