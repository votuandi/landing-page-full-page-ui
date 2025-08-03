import { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceDetailContent from "@/components/ServiceDetailContent";
import { SERVICES } from "@/utils/constants";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.id.toString() === slug);

  if (!service) {
    return {
      title: "Dịch vụ không tồn tại | Tâm Huỳnh Solar",
    };
  }

  return {
    title: `${service.title} | Tâm Huỳnh Solar`,
    description: service.description,
    keywords: `${service.title}, ${
      service.category
    }, năng lượng mặt trời, ${service.features.join(", ")}`,
    openGraph: {
      title: service.title,
      description: service.description,
      images: [service.image],
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.id.toString() === slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceDetailContent service={service} />
    </div>
  );
}
