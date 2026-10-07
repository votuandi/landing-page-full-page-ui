import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import SiteFooter from "@/components/SiteFooter";
import { siteConfig } from "@/config/site.config";
import { phoneDigits } from "@/config/site";
import { pickText } from "@/i18n/text";

const inter = Inter({ subsets:["latin","vietnamese"], variable:"--font-inter", display:"swap" });
const { brand, branches, socials, legal } = siteConfig;
const tagline = pickText(brand.tagline, "vi");
const defaultTitle = `${brand.name} | Phân phối thiết bị & tổng thầu EPC điện mặt trời`;

export const viewport: Viewport = { width:"device-width", initialScale:1, themeColor:brand.themeColor };

export const metadata: Metadata = {
  metadataBase:new URL(brand.url),
  title:{ default:defaultTitle, template:`%s | ${brand.name}` },
  description:brand.description,
  applicationName:brand.name,
  icons:{ icon:"/favicon.svg" },
  manifest:"/site.webmanifest",
  robots:{ index:true, follow:true },
  alternates:{ canonical:"/" },
  openGraph:{
    type:"website", locale:"vi_VN", alternateLocale:["en_US"], siteName:brand.name, url:brand.url,
    title:defaultTitle, description:brand.description,
    images:[{ url:brand.ogImage, width:1200, height:630, alt:`${brand.name} — ${tagline}` }],
  },
  twitter:{ card:"summary_large_image", title:defaultTitle, description:brand.description, images:[brand.ogImage] },
  formatDetection:{ telephone:false },
};

const orgId = `${brand.url}/#organization`;
const tel = (p: string) => `+84${phoneDigits(p).replace(/^0/, "")}`;

/** Organization + LocalBusiness cho từng chi nhánh (schema.org, @graph). */
const schema = {
  "@context":"https://schema.org",
  "@graph":[
    {
      "@type":"Organization",
      "@id":orgId,
      name:brand.name,
      legalName:brand.legalName,
      url:brand.url,
      logo:`${brand.url}/favicon.svg`,
      email:brand.email,
      description:brand.description,
      foundingDate:String(brand.foundedYear),
      taxID:legal.businessRegistration.number,
      sameAs:socials.map((s) => s.url).filter(Boolean),
      hasCredential:legal.iso.map((name) => ({ "@type":"EducationalOccupationalCredential", name })),
      contactPoint:branches.flatMap((b) => [
        { "@type":"ContactPoint", telephone:tel(b.hotline.household), contactType:"sales", areaServed:"VN", availableLanguage:["vi","en"], name:`${b.name} – Hộ gia đình` },
        { "@type":"ContactPoint", telephone:tel(b.hotline.project), contactType:"sales", areaServed:"VN", availableLanguage:["vi","en"], name:`${b.name} – Dự án` },
      ]).concat([{ "@type":"ContactPoint", telephone:tel(siteConfig.complaintHotline), contactType:"customer support", areaServed:"VN", availableLanguage:["vi"], name:"Khiếu nại" }]),
      department:branches.map((b) => ({ "@id":`${brand.url}/#branch-${b.id}` })),
    },
    ...branches.map((b) => ({
      "@type":"LocalBusiness",
      "@id":`${brand.url}/#branch-${b.id}`,
      name:`${brand.name} – ${b.name}`,
      parentOrganization:{ "@id":orgId },
      url:`${brand.url}/#chi-nhanh`,
      image:`${brand.url}${brand.ogImage}`,
      telephone:tel(b.hotline.main),
      email:brand.email,
      priceRange:"$$",
      address:{ "@type":"PostalAddress", streetAddress:b.office.address, addressLocality:b.name, addressCountry:"VN" },
      geo:{ "@type":"GeoCoordinates", latitude:b.office.lat, longitude:b.office.lng },
      hasMap:`https://www.google.com/maps/search/?api=1&query=${b.office.lat},${b.office.lng}`,
      openingHours:b.openingHours,
      areaServed:"VN",
    })),
  ],
};

export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return <html lang={siteConfig.i18n.defaultLang} data-theme="light" className={inter.variable}><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} /><SiteShell footer={<SiteFooter />}>{children}</SiteShell></body></html>;
}
