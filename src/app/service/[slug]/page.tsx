import { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetailContent from "@/components/ServiceDetailContent";
import { Service } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

// Helper function to strip HTML tags for metadata
function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

// Fetch service from API
async function getService(id: string): Promise<Service | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/services/${id}`, {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const service = await response.json();
    return service;
  } catch (error) {
    console.error("Error fetching service:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    return {
      title: "Dịch vụ không tồn tại | Trọng Tín Solar",
    };
  }

  const description = stripHtml(service.description);

  return {
    title: `${service.title} | Trọng Tín Solar`,
    description: description,
    keywords: `${service.title}, ${
      service.category
    }, năng lượng mặt trời, ${service.features.join(", ")}`,
    openGraph: {
      title: service.title,
      description: description,
      images: service.image ? [service.image] : [],
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = await getService(slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceDetailContent service={service} />
    </div>
  );
}
