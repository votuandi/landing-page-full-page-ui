import { Metadata } from "next";
import { prisma } from "@/lib/prisma";

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

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCompanyInfo();
  
  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const baseUrl = "https://phanphoisolar.com";
  const title = `Dịch vụ năng lượng mặt trời | ${companyName}`;
  const description = `${companyName} cung cấp đầy đủ các dịch vụ từ tư vấn, thiết kế, lắp đặt đến bảo trì hệ thống năng lượng mặt trời. Chúng tôi cam kết mang đến giải pháp tối ưu và dịch vụ chất lượng cao nhất.`;
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;
  
  return {
    title,
    description,
    keywords: `dịch vụ năng lượng mặt trời, tư vấn solar, lắp đặt điện mặt trời, bảo trì hệ thống, dịch vụ solar, ${companyName}`,
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

export default function ServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
