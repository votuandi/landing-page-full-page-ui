import { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetailContent from "@/components/ServiceDetailContent";
import { Service } from "@/types";
import StructuredData from "@/components/StructuredData";

interface Props {
  params: Promise<{ slug: string }>;
}

// Helper function to strip HTML tags for metadata
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

// Fetch service directly from database
async function getService(id: string) {
  try {
    const serviceRaw = await prisma.service.findUnique({
      where: { id: parseInt(id) },
    });

    if (!serviceRaw) {
      return null;
    }

    // Parse JSON fields
    const service = {
      ...serviceRaw,
      benefits: serviceRaw.benefits ? JSON.parse(serviceRaw.benefits) : null,
      implementationProcess: serviceRaw.implementationProcess
        ? JSON.parse(serviceRaw.implementationProcess)
        : null,
      category: serviceRaw.category as "household" | "business" | "maintenance" | "consultation",
      features: serviceRaw.features || [],
      createdAt: serviceRaw.createdAt.toISOString(),
      updatedAt: serviceRaw.updatedAt.toISOString(),
    };

    return service as unknown as Service;
  } catch (error) {
    console.error("Error fetching service:", error);
    return null;
  }
}

import { prisma } from "@/lib/prisma";
import { getCachedCompanyInfo } from "@/lib/cachedCompany";

export const revalidate = 3600; // Revalidate every hour (ISR)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = "https://phanphoisolar.com";
  const [service, companyInfo] = await Promise.all([
    getService(slug),
    getCachedCompanyInfo(),
  ]);

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";

  if (!service) {
    return {
      title: `Dịch vụ không tồn tại | ${companyName}`,
    };
  }

  const description = stripHtml(service.description).substring(0, 160) ||
    `${service.title} - Dịch vụ ${service.category} chuyên nghiệp`;
  const ogImage = service.image
    ? `${baseUrl}${service.image}`
    : `${baseUrl}/images/service-placeholder.jpg`;

  return {
    title: `${service.title} | ${companyName}`,
    description,
    keywords: `${service.title}, ${service.category
      }, năng lượng mặt trời, ${service.features?.join(", ") || ""}, ${companyName}`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/service/${service.id}`,
    },
    openGraph: {
      title: `${service.title} | ${companyName}`,
      description,
      url: `${baseUrl}/service/${service.id}`,
      siteName: companyName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: service.title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${service.title} | ${companyName}`,
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

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const [service, companyInfo] = await Promise.all([
    getService(slug),
    getCachedCompanyInfo(),
  ]);

  if (!service) {
    notFound();
  }

  // Breadcrumb data
  const breadcrumbs = [
    { name: "Trang chủ", url: "/" },
    { name: "Dịch vụ", url: "/services" },
    { name: service.title, url: `/service/${service.id}` },
  ];

  // Fetch related services (same category, excluding current service)
  let relatedServices: any[] = [];
  try {
    const related = await prisma.service.findMany({
      where: {
        isActive: true,
        id: { not: service.id },
        category: service.category,
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
    });

    relatedServices = related.map((s) => ({
      id: s.id,
      title: s.title,
      image: s.image,
      category: s.category,
    }));
  } catch (error) {
    console.error('Error fetching related services:', error);
  }

  // Prepare HowTo schema if implementation process exists
  let howToData = null;
  if (service.implementationProcess && Array.isArray(service.implementationProcess) && service.implementationProcess.length > 0) {
    howToData = {
      name: `Cách thực hiện ${service.title}`,
      description: stripHtml(service.description) || `Quy trình thực hiện dịch vụ ${service.title}`,
      steps: service.implementationProcess.map((step: any) => ({
        name: step.title || `Bước ${step.step}`,
        text: step.description || "",
        image: step.image || undefined,
      })),
      totalTime: service.duration || "PT1H",
      image: service.image || undefined,
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StructuredData type="Service" data={service} companyInfo={companyInfo} />
      <StructuredData type="BreadcrumbList" data={breadcrumbs} />
      {howToData && (
        <StructuredData type="HowTo" data={howToData} companyInfo={companyInfo} />
      )}
      <ServiceDetailContent service={service} relatedServices={relatedServices} />
    </div>
  );
}
