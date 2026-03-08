import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import StoreProvider from "@/lib/StoreProvider";
import { prisma } from "@/lib/prisma";
import StructuredData from "@/components/StructuredData";
import VisitTracker from "@/components/VisitTracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Fetch company info from database for SEO
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
  const ogImage = companyInfo?.logoUrl || "/og-image.jpg";

  return {
    title,
    description,
    authors: [{ name: companyName }],
    creator: companyName,
    publisher: companyName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL("https://phanphoisolar.com"),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title,
      description,
      url: "https://phanphoisolar.com",
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
    verification: {
      google: process.env.GOOGLE_SEARCH_CONSOLE_VERIFICATION || undefined,
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const companyInfo = await getCompanyInfo();

  // Fetch main office for LocalBusiness schema
  let mainOffice = null;
  try {
    const offices = await prisma.office.findMany({
      where: { isMainOffice: true },
      take: 1,
    });
    mainOffice = offices[0] || null;
    if (!mainOffice) {
      // Fallback to first office if no main office
      const firstOffice = await prisma.office.findFirst();
      mainOffice = firstOffice;
    }
  } catch (error) {
    console.error("Error fetching office for LocalBusiness schema:", error);
  }

  return (
    <html lang="vi" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {process.env.BING_WEBMASTER_VERIFICATION && (
          <meta name="msvalidate.01" content={process.env.BING_WEBMASTER_VERIFICATION} />
        )}
        <StructuredData type="Organization" data={{}} companyInfo={companyInfo} />
        {mainOffice && (
          <StructuredData type="LocalBusiness" data={mainOffice} companyInfo={companyInfo} />
        )}
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <StoreProvider>
          <VisitTracker />
          <ConditionalLayout>{children}</ConditionalLayout>
        </StoreProvider>
      </body>
    </html>
  );
}
