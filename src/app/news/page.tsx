import { Metadata } from "next";
import NewsPageContent from "@/components/NewsPageContent";
import { getCachedCompanyInfo } from "@/lib/cachedCompany";

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCachedCompanyInfo();
  
  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const baseUrl = "https://phanphoisolar.com";
  const title = `Tin tức năng lượng mặt trời | ${companyName}`;
  const description = `Cập nhật những tin tức mới nhất về ngành năng lượng mặt trời, chính sách, công nghệ và xu hướng phát triển tại Việt Nam và thế giới từ ${companyName}.`;
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;
  
  return {
    title,
    description,
    keywords: `tin tức năng lượng mặt trời, chính sách điện mặt trời, công nghệ solar, xu hướng năng lượng tái tạo, ${companyName}`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/news",
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/news`,
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

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NewsPageContent />
    </div>
  );
}
