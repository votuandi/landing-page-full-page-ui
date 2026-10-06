import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { SITE_CONFIG } from "@/config/site";

const inter = Inter({ subsets:["latin","vietnamese"], variable:"--font-inter", display:"swap" });

export const viewport: Viewport = { width:"device-width", initialScale:1, themeColor:SITE_CONFIG.themeColor };

export const metadata: Metadata = {
  metadataBase:new URL(SITE_CONFIG.url),
  title:{ default:"Minwy Solar | Solar cho doanh nghiệp", template:"%s | Minwy Solar" },
  description:"Giải pháp điện mặt trời nhà xưởng, hybrid và O&M tập trung vào ROI và hiệu quả vận hành.",
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
  return <html lang="vi" className={inter.variable}><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema)}} /><SiteShell>{children}</SiteShell></body></html>;
}