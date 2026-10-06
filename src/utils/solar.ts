import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/site";

export function makeMetadata(title: string, description: string, path = "/", image = "/images/solar-installation-hero.jpg"): Metadata {
  const url = new URL(path, SITE_CONFIG.url).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_CONFIG.brand.name, locale: "vi_VN", type: "website", images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
