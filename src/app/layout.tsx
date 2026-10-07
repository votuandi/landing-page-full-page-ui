import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import SiteFooter from "@/components/SiteFooter";
import { SITE_CONFIG } from "@/config/site";

const inter = Inter({ subsets:["latin","vietnamese"], variable:"--font-inter", display:"swap" });

export const viewport: Viewport = { width:"device-width", initialScale:1, themeColor:SITE_CONFIG.themeColor };

export const metadata: Metadata = {
  metadataBase:new URL(SITE_CONFIG.url),
  title:{ default:`${SITE_CONFIG.brand.name} | Điện mặt trời cho gia đình, cửa hàng & nhà xưởng`, template:`%s | ${SITE_CONFIG.brand.name}` },
  description:SITE_CONFIG.brand.tagline,
  icons:{ icon:"/favicon.svg" },
  robots:{ index:true, follow:true },
};

const organizationSchema = {
  "@context":"https://schema.org",
  "@type":["Organization","LocalBusiness"],
  name:SITE_CONFIG.brand.name,
  legalName:SITE_CONFIG.brand.legalName,
  url:SITE_CONFIG.url,
  telephone:SITE_CONFIG.contact.phoneRaw,
  email:SITE_CONFIG.contact.email,
  address:{ "@type":"PostalAddress", streetAddress:SITE_CONFIG.contact.address, addressCountry:"VN" },
  areaServed:"VN",
};

export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return <html lang="vi" data-theme="light" className={inter.variable}><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema)}} /><SiteShell footer={<SiteFooter />}>{children}</SiteShell></body></html>;
}