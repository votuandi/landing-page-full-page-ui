import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { COPY, SITE_CONFIG } from "@/content/site";
const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d3b78",
};
export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${COPY.seo.homeTitle} | ${SITE_CONFIG.brand.name}`,
    template: `%s | ${SITE_CONFIG.brand.name}`,
  },
  description: COPY.seo.homeDescription,
  icons: { icon: SITE_CONFIG.brand.favicon },
  robots: { index: true, follow: true },
};
const schema = {
  "@context": "https://schema.org",
  "@type": COPY.seo.businessType,
  name: SITE_CONFIG.brand.name,
  legalName: SITE_CONFIG.brand.legalName,
  url: SITE_CONFIG.url,
  telephone: SITE_CONFIG.contact.phoneRaw,
  email: SITE_CONFIG.contact.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_CONFIG.contact.address,
    addressCountry: "VN",
  },
  areaServed: COPY.seo.areaServed,
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={inter.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
