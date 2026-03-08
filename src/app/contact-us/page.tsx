import type { Metadata } from "next";
import ContactUsContent from "@/components/ContactUsContent";
import { prisma } from "@/lib/prisma";

async function getContactInfo() {
  try {
    const [companyInfo, mainOffice] = await Promise.all([
      prisma.companyInfo.findUnique({ where: { id: 1 } }),
      prisma.office.findFirst({ where: { isMainOffice: true } }),
    ]);
    return { companyInfo, mainOffice };
  } catch (error) {
    console.error("Error fetching contact info for metadata:", error);
    return { companyInfo: null, mainOffice: null };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { companyInfo, mainOffice } = await getContactInfo();

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const address = mainOffice?.address || "Lấp Vò, Đồng Tháp";
  const phone = mainOffice?.phone || "0909019234";
  const email = mainOffice?.email || "";
  const baseUrl = "https://phanphoisolar.com";

  const description = `Liên hệ với ${companyName} để được tư vấn miễn phí về các giải pháp năng lượng mặt trời. ${address ? `Địa chỉ: ${address}.` : ""} ${phone ? `Hotline: ${phone}` : ""}`.trim();

  const title = `Liên hệ - ${companyName}`;
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords: `liên hệ, ${companyName}, tư vấn năng lượng mặt trời, ${address}, solar consultation, contact form, hỗ trợ khách hàng`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/contact-us",
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/contact-us`,
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

export default function ContactUsPage() {
  return (
    <main className="min-h-screen">
      <ContactUsContent />
    </main>
  );
}
