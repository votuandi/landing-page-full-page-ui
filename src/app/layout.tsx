import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import StoreProvider from "@/lib/StoreProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Trọng Tín Solar - Hệ thống Năng lượng Mặt trời",
  description:
    "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao. Tấm pin, biến tần inverter, hệ thống lưu trữ năng lượng và giải pháp năng lượng tái tạo.",
  keywords:
    "năng lượng mặt trời, tấm pin solar, biến tần inverter, pin lưu trữ, solar panel, renewable energy",
  authors: [{ name: "Trọng Tín Solar" }],
  creator: "Trọng Tín Solar",
  publisher: "Trọng Tín Solar",
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
    title: "Trọng Tín Solar - Hệ thống Năng lượng Mặt trời",
    description:
      "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao. Tấm pin, biến tần inverter, hệ thống lưu trữ năng lượng và giải pháp năng lượng tái tạo.",
    url: "https://phanphoisolar.com",
    siteName: "Trọng Tín Solar",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Trọng Tín Solar - Hệ thống Năng lượng Mặt trời",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trọng Tín Solar - Hệ thống Năng lượng Mặt trời",
    description:
      "Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao.",
    images: ["/og-image.jpg"],
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
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <StoreProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </StoreProvider>
      </body>
    </html>
  );
}
