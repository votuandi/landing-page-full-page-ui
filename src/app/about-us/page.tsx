import type { Metadata } from "next";
import CompanyStorySection from "@/components/CompanyStorySection";
import IntroductionVideoSection from "@/components/IntroductionVideoSection";
import CompletedProjectsSection from "@/components/CompletedProjectsSection";
import { getCachedCompanyInfo } from "@/lib/cachedCompany";

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCachedCompanyInfo();

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const storyTitle = companyInfo?.storyTitle || "Câu chuyện công ty";
  const mission = companyInfo?.mission || "";

  const description = mission
    ? `Tìm hiểu về ${storyTitle.toLowerCase()} và sứ mệnh của ${companyName} - đơn vị hàng đầu về năng lượng mặt trời tại Việt Nam. ${mission}`
    : `Tìm hiểu về ${storyTitle.toLowerCase()} và các dự án đã hoàn thành của ${companyName} - đơn vị hàng đầu về năng lượng mặt trời tại Việt Nam.`;

  const title = `Về chúng tôi - ${companyName}`;
  const baseUrl = "https://phanphoisolar.com";
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords:
      `về chúng tôi, ${companyName}, năng lượng mặt trời, dự án hoàn thành, câu chuyện công ty`,
    authors: [{ name: companyName }],
    creator: companyName,
    publisher: companyName,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/about-us",
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/about-us`,
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

export default function AboutUsPage() {
  return (
    <main className="min-h-screen">
      {/* Company Story Section */}
      <CompanyStorySection />

      {/* Introduction Video Section */}
      <IntroductionVideoSection />

      {/* Completed Projects Section */}
      <CompletedProjectsSection />
    </main>
  );
}
