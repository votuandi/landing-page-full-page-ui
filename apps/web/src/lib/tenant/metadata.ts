import type { Metadata } from "next";
import { asset, text } from "./contentSchemas";
import { isNoindexHost, siteOrigin } from "./seo";

type MetadataSite = { primaryHost: string; name: string; locale?: "vi" | "en"; profile: { name?: unknown; description?: unknown }; seo: { title?: unknown; description?: unknown; ogImage?: string } };
export function tenantMetadata(site: MetadataSite, path: string, title?: string, description?: string,
  { production = process.env.NODE_ENV === "production", port = process.env.TENANT_PUBLIC_PORT ?? "", image }: { production?: boolean; port?: string; image?: string } = {}): Metadata {
  const origin = siteOrigin(site, { production, port });
  const canonical = new URL(path.split(/[?#]/)[0], origin).toString();
  const brand = text(site.profile.name, site.locale) || site.name;
  const pageTitle = title ? `${title} | ${brand}` : text(site.seo.title, site.locale) || brand;
  const desc = description || text(site.seo.description, site.locale) || text(site.profile.description, site.locale) || brand;
  const cover = asset.safeParse(image).success ? image : site.seo.ogImage;
  const images = cover && asset.safeParse(cover).success ? [{ url: new URL(cover, origin).toString(), alt: brand }] : [];
  return { metadataBase: new URL(origin), title: pageTitle, description: desc, applicationName: brand, icons: { icon: "/favicon.svg" },
    alternates: { canonical }, ...(isNoindexHost(site.primaryHost) ? { robots: { index: false, follow: false } } : {}), openGraph: { type: "website", locale: site.locale === "en" ? "en_US" : "vi_VN", title: pageTitle, description: desc, siteName: brand, url: canonical, images },
    twitter: { card: "summary_large_image", title: pageTitle, description: desc, images: images.map((image) => image.url) } };
}
