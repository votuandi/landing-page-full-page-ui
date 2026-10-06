import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import SiteFooter from "@/components/SiteFooter";
import { SITE_CONFIG, primaryHotline } from "@/config/site";

export const viewport: Viewport = { width:"device-width", initialScale:1, themeColor:SITE_CONFIG.themeColor };

export const metadata: Metadata = {
  metadataBase:new URL(SITE_CONFIG.url),
  title:{ default:`${SITE_CONFIG.brand.name} | Điện mặt trời cho gia đình, cửa hàng, nhà xưởng & trang trại`, template:`%s | ${SITE_CONFIG.brand.name}` },
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
  telephone:primaryHotline?.phone.replace(/[^\d+]/g, ""),
  email:SITE_CONFIG.contact.email,
  address:{ "@type":"PostalAddress", streetAddress:SITE_CONFIG.contact.address, addressCountry:"VN" },
  areaServed:"VN",
  sameAs:Object.values(SITE_CONFIG.socials).map((s) => s?.url).filter(Boolean),
};

export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return <html lang="vi"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(organizationSchema)}} /><SiteShell footer={<SiteFooter />}>{children}</SiteShell></body></html>;
}
