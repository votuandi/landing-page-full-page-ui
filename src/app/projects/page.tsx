import { Metadata } from "next";
import ProjectsPageContent from "@/components/ProjectsPageContent";
import { getCachedCompanyInfo } from "@/lib/cachedCompany";

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCachedCompanyInfo();
  
  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const baseUrl = "https://phanphoisolar.com";
  const title = `Dự án năng lượng mặt trời | ${companyName}`;
  const description = `Khám phá các dự án năng lượng mặt trời đã hoàn thành của ${companyName}. Từ hệ thống công nghiệp đến dân dụng, chúng tôi mang đến giải pháp năng lượng xanh cho mọi nhu cầu.`;
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;
  
  return {
    title,
    description,
    keywords: `dự án năng lượng mặt trời, dự án solar, hệ thống điện mặt trời, dự án hoàn thành, năng lượng xanh, ${companyName}`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/projects",
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/projects`,
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

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectsPageContent />
    </div>
  );
}
