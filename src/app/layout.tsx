import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollRevealObserver from "@/components/ScrollRevealObserver";
import { SITE_CONFIG } from "@/utils/constants";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15803d",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: "Minwy Solar | Giải pháp năng lượng mặt trời",
    template: "%s | Minwy Solar",
  },
  description:
    "Minwy Solar cung cấp thiết bị, tư vấn, thiết kế và thi công hệ thống điện mặt trời cho gia đình và doanh nghiệp.",
  keywords: [
    "năng lượng mặt trời",
    "điện mặt trời",
    "tấm pin solar",
    "biến tần inverter",
    "pin lưu trữ",
    "thi công điện mặt trời",
  ],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  alternates: { canonical: "/" },
  category: "renewable energy",
  openGraph: {
    title: "Minwy Solar | Giải pháp năng lượng mặt trời",
    description:
      "Thiết bị và giải pháp điện mặt trời chất lượng cao cho gia đình và doanh nghiệp.",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: "/images/solar-panels-hero.jpg",
        width: 1200,
        height: 630,
        alt: "Hệ thống năng lượng mặt trời Minwy Solar",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Minwy Solar | Giải pháp năng lượng mặt trời",
    description:
      "Thiết bị và giải pháp điện mặt trời chất lượng cao cho gia đình và doanh nghiệp.",
    images: ["/images/solar-panels-hero.jpg"],
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
  icons: {
    icon: "/favicon.ico",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
  telephone: SITE_CONFIG.phone,
  email: SITE_CONFIG.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_CONFIG.address,
    addressCountry: "VN",
  },
  areaServed: "VN",
  description: SITE_CONFIG.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="bg-white font-sans text-slate-900 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <ScrollRevealObserver />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
