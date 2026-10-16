import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import { notFound } from "next/navigation";
import { themeFontCss, themeFontFiles } from "@solar/themes";
import { colorChannelsToHex, themeToCss } from "@solar/tokens";
import "../../../../globals.css";
import { loadDraftPage, loadPublishedPage } from "@/lib/tenant/siteData";
import { tenantMetadata } from "@/lib/tenant/metadata";
import { placeholderParams, tenantRoute } from "@/lib/tenant/route";
import { TenantChrome } from "@/components/tenant/cached";

// Approved blocking route (E5-S06): the tenant comes from the Host at request time and `next build` has no database, so
// there is no valid generateStaticParams. This also covers generateViewport/Metadata's request-time tenant lookup.
// Chrome and page bodies are `"use cache"` + tags; a static shell per tenant is E10.
export const instant = false;
export const generateStaticParams = placeholderParams;

type Params = Promise<{ tenantId: string; siteId: string; ctx: string }>;
const route = async (params: Params) => { const { tenantId, siteId, ctx } = await params; return tenantRoute(tenantId, siteId, ctx); };

export async function generateViewport({ params }: { params: Params }): Promise<Viewport> {
  const { site } = await route(params);
  const mode = site.theme.meta.supportsDark && site.profile.theme.default === "dark" ? "dark" : "light";
  return { width: "device-width", initialScale: 1, themeColor: colorChannelsToHex(site.overrides.colors?.[mode]?.bg ?? site.theme.colors[mode]?.bg ?? site.theme.colors.light.bg) };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return tenantMetadata((await route(params)).site, "/");
}

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Params }) {
  const { site, preview } = await route(params);
  const home = await (preview ? loadDraftPage : loadPublishedPage)(site.tenantId, site.siteId, "", site.locale);
  if (!home) notFound();
  const mode = site.theme.meta.supportsDark ? site.profile.theme.default : "light";
  const script = `(function(){try{var t=localStorage.getItem("t15-theme");if(${site.theme.meta.supportsDark && site.profile.theme.switcher ? "t!=='dark'&&t!=='light'" : "true"})t="${mode}";document.documentElement.dataset.theme=t;}catch(e){}})();`;
  for (const file of themeFontFiles(site.theme)) preload(`/fonts/${file}`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return <html lang={site.locale} data-tenant-site={site.siteId} data-theme={mode} data-scroll-behavior="smooth" suppressHydrationWarning>
    <head><style dangerouslySetInnerHTML={{ __html: themeToCss(site.theme, site.overrides) + themeFontCss(site.theme) }} /><script dangerouslySetInnerHTML={{ __html: script }} /></head>
    <body><TenantChrome tenantId={site.tenantId} siteId={site.siteId} locale={site.locale} preview={preview}>{children}</TenantChrome></body>
  </html>;
}
