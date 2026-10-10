import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { t15 } from "@solar/themes";
import { colorChannelsToHex, themeToCss } from "@solar/tokens";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import SiteFooter from "@/components/SiteFooter";
import { siteConfig } from "@/config/site.config";
import { phoneDigits } from "@/config/site";
import { pickText } from "@/i18n/text";

// Be Vietnam Pro: hỗ trợ đầy đủ dấu tiếng Việt; chỉ tải 3 độ đậm để nhẹ trang (font-black = 800, xem tailwind.config.ts)
const sans = Be_Vietnam_Pro({ subsets:["latin","vietnamese"], weight:["400","600","800"], variable:"--font-sans", display:"swap" });
const { brand, branches, socials, legal } = siteConfig;
const tagline = pickText(brand.tagline, "vi");
const defaultTitle = `${brand.name} | Phân phối thiết bị & tổng thầu EPC điện mặt trời`;

export const viewport: Viewport = { width:"device-width", initialScale:1, themeColor:colorChannelsToHex(t15.colors.light.bg) };

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

/** Áp giao diện đã lưu TRƯỚC khi vẽ trang (tránh nhấp nháy). Mặc định: siteConfig.theme.default. */
const themeScript = `(function(){try{var t=localStorage.getItem("t15-theme");if(${siteConfig.theme.switcher ? "t!=='dark'&&t!=='light'" : "true"})t=${JSON.stringify(siteConfig.theme.default)};document.documentElement.dataset.theme=t;}catch(e){}})();`;
const themeCss = themeToCss(t15);

export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  return <html lang={siteConfig.i18n.defaultLang} data-theme={siteConfig.theme.default} className={sans.variable} data-scroll-behavior="smooth" suppressHydrationWarning><head><style dangerouslySetInnerHTML={{ __html: themeCss }} /><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} /><SiteShell footer={<SiteFooter />}>{children}</SiteShell></body></html>;
}
