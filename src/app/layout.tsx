import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { SITE_CONFIG } from "@/config/site";
import { getBrand } from "@/content/solar";
import { getBusinessSchema, getSeoContent, serializeSchema } from "@/lib/solar-seo";

const bodyFont = localFont({ src: [{ path: "./fonts/be-400.woff2", weight: "400" }, { path: "./fonts/be-700.woff2", weight: "700" }], variable: "--font-body", display: "swap" });
const headingFont = localFont({ src: "./fonts/manrope-700.woff2", weight: "700", variable: "--font-heading", display: "swap", preload: false });

export const viewport: Viewport = { width:"device-width", initialScale:1, themeColor:"#15803D" };

const brand = getBrand(), seo = getSeoContent();
export const metadata: Metadata = {
  metadataBase:new URL(SITE_CONFIG.url),
  title:{ default:seo.title, template:`%s | ${brand.name}` },
  description:seo.description,
  icons:{ icon:"/favicon.svg" },
  robots:{ index:true, follow:true },
};

const organizationSchema = getBusinessSchema(SITE_CONFIG.url);

export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return <html lang="vi" className={`${bodyFont.variable} ${headingFont.variable}`}><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeSchema(organizationSchema)}} /><SiteShell>{children}</SiteShell></body></html>;
}