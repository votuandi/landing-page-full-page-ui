import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { t15, themeFontCss, themeFontFiles } from "@solar/themes";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { loadTenantSite } from "@/lib/tenant/siteData";
import { tenantMetadata } from "@/lib/tenant/metadata";
import { colorChannelsToHex, themeToCss } from "@solar/tokens";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { loadPreset } from "@solar/presets";
import { PageRenderer, SiteWidgets } from "@solar/sections";
import { siteConfig } from "@/config/site.config";
import { catalogEnabled, phoneDigits } from "@/config/site";
import { pickText } from "@/i18n/text";

const { brand, branches, socials, legal } = siteConfig;
const tagline = pickText(brand.tagline, "vi");
const defaultTitle = `${brand.name} | Phân phối thiết bị & tổng thầu EPC điện mặt trời`;

export async function generateViewport(): Promise<Viewport> {
  const request = await headers();
  const siteId = request.get("x-site-id");
  const site = siteId ? await loadTenantSite(request.get("x-tenant-id") ?? "", siteId) : null;
  const mode = site?.theme.meta.supportsDark && site.profile.theme.default === "dark" ? "dark" : "light";
  return { width: "device-width", initialScale: 1, themeColor: colorChannelsToHex(site?.overrides.colors?.[mode]?.bg ?? site?.theme.colors[mode]?.bg ?? t15.colors.light.bg) };
}

const legacyMetadata: Metadata = {
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
export async function generateMetadata(): Promise<Metadata> {
  const request = await headers();
  const siteId = request.get("x-site-id");
  if (!siteId) return legacyMetadata;
  const site = await loadTenantSite(request.get("x-tenant-id") ?? "", siteId);
  if (!site) notFound();
  return tenantMetadata(site, "/");
}

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
const themeCss = themeToCss(t15) + themeFontCss(t15);

export default async function RootLayout({ children }: Readonly<{children:React.ReactNode}>) {
  const request = await headers();
  const siteId = request.get("x-site-id");
  if (siteId) {
    const site = await loadTenantSite(request.get("x-tenant-id") ?? "", siteId);
    if (!site) notFound();
    const mode = site.theme.meta.supportsDark ? site.profile.theme.default : "light";
    const script = `(function(){try{var t=localStorage.getItem("t15-theme");if(${site.theme.meta.supportsDark && site.profile.theme.switcher ? "t!=='dark'&&t!=='light'" : "true"})t="${mode}";document.documentElement.dataset.theme=t;}catch(e){}})();`;
    for (const file of themeFontFiles(site.theme)) preload(`/fonts/${file}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
    return <html lang={site.locale} data-theme={mode} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head><style dangerouslySetInnerHTML={{ __html: themeToCss(site.theme, site.overrides) + themeFontCss(site.theme) }} /><script dangerouslySetInnerHTML={{ __html: script }} /></head>
      <body>{children}</body>
    </html>;
  }
  const loaded = loadPreset("t15");
  const site = { tenantId: "preset-demo", locale: "vi" as const, themeId: loaded.theme.meta.id };
  const canUse = (feature: string) => feature !== "catalog" || catalogEnabled;
  const chrome = (type: string) => <PageRenderer page={{ sections: loaded.page.sections.filter((section) => section.type === type) }} site={site} canUse={canUse} />;
  for (const file of themeFontFiles(t15)) {
    preload(`/fonts/${file}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  return <html lang={siteConfig.i18n.defaultLang} data-theme={siteConfig.theme.default} data-scroll-behavior="smooth" suppressHydrationWarning><head><style dangerouslySetInnerHTML={{ __html: themeCss }} /><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} /><SiteShell header={chrome("site-header")} footer={chrome("site-footer")} inlineWidgets={<SiteWidgets widgets={loaded.widgets} site={site} slot="inline" canUse={canUse} />} overlayWidgets={<SiteWidgets widgets={loaded.widgets} site={site} slot="overlay" canUse={canUse} />}>{children}</SiteShell></body></html>;
}
