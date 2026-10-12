import type { Metadata } from "next";
import { text } from "./contentSchemas";

type MetadataSite = { primaryHost: string; name: string; locale?: "vi" | "en"; profile: { name?: unknown; description?: unknown }; seo: { title?: unknown; description?: unknown; ogImage?: string } };
export function tenantMetadata(site: MetadataSite, path: string, title?: string, description?: string,
  { production = process.env.NODE_ENV === "production", port = process.env.TENANT_PUBLIC_PORT ?? "" } = {}): Metadata {
  const origin = `${production ? "https" : "http"}://${site.primaryHost}${!production && /^\d{1,5}$/.test(port) ? `:${port}` : ""}`;
  const canonical = new URL(path.split(/[?#]/)[0], origin).toString();
  const brand = text(site.profile.name, site.locale) || site.name;
  const pageTitle = title ? `${title} | ${brand}` : text(site.seo.title, site.locale) || brand;
  const desc = description || text(site.seo.description, site.locale) || text(site.profile.description, site.locale) || brand;
  const images = site.seo.ogImage ? [{ url: new URL(site.seo.ogImage, origin).toString(), alt: brand }] : [];
  return { metadataBase: new URL(origin), title: pageTitle, description: desc, applicationName: brand, icons: { icon: "/favicon.svg" },
    alternates: { canonical }, openGraph: { type: "website", title: pageTitle, description: desc, siteName: brand, url: canonical, images },
    twitter: { card: "summary_large_image", title: pageTitle, description: desc, images: images.map((image) => image.url) } };
}
