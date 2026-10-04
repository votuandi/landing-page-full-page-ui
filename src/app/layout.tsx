import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_CONFIG } from "@/utils/constants";
import { serializeJsonLd } from "@/utils/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} | Giải pháp điện mặt trời`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#14532d" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <a href="#main-content" className="skip-link">
          Đến nội dung chính
        </a>
        <Header />
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: SITE_CONFIG.name,
              url: SITE_CONFIG.url,
              logo: `${SITE_CONFIG.url}/icon.svg`,
              email: SITE_CONFIG.email,
              telephone: SITE_CONFIG.phone,
              contactPoint: {
                "@type": "ContactPoint",
                telephone: SITE_CONFIG.phone,
                contactType: "customer service",
                availableLanguage: "Vietnamese",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
