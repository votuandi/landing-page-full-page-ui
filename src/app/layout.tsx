import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { SITE_CONFIG } from "@/config/site";

const bodyFont = localFont({ src: [{ path: "./fonts/be-400.woff2", weight: "400" }, { path: "./fonts/be-700.woff2", weight: "700" }], variable: "--font-body", display: "swap" });
const headingFont = localFont({ src: "./fonts/manrope-700.woff2", weight: "700", variable: "--font-heading", display: "swap", preload: false });

export const viewport: Viewport = { width:"device-width", initialScale:1, themeColor:"#0d3b78" };

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
  return <html lang="vi" className={`${bodyFont.variable} ${headingFont.variable}`}><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema)}} /><SiteShell>{children}</SiteShell></body></html>;
}