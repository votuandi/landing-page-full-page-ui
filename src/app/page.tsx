import { Metadata } from "next";
import SliderBanner from "@/components/SliderBanner";
import Hero from "@/components/Hero";
import OurPartners from "@/components/OurPartners";
import ProductSection from "@/components/ProductSection";
import ProjectsSection from "@/components/ProjectsSection";
import NewsSection from "@/components/NewsSection";
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
  const slogan = companyInfo?.slogan || "Hệ thống Năng lượng Mặt trời";
  const description = companyInfo?.mission
    ? `${companyInfo.mission} ${companyInfo.slogan || ""}`.trim()
    : "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao. Tấm pin, biến tần inverter, hệ thống lưu trữ năng lượng và giải pháp năng lượng tái tạo.";

  const title = `${companyName} - ${slogan}`;
  const baseUrl = "https://phanphoisolar.com";
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords:
      "năng lượng mặt trời, tấm pin solar, biến tần inverter, pin lưu trữ, solar panel, renewable energy, Trọng Tín Solar",
    authors: [{ name: companyName }],
    creator: companyName,
    publisher: companyName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: baseUrl,
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

export default function Home() {
  return (
    <main className="min-h-screen">
      <SliderBanner />
      <Hero />
      <OurPartners />
      <ProductSection />
      <ProjectsSection />
      <NewsSection />
    </main>
  );
}
