import type { Metadata } from "next";
import { SITE_CONFIG } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { PRODUCTS } from "@/data/solar";

export function formatMoney(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2).replace(".", ",")} tỷ`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)} triệu`;
  return new Intl.NumberFormat("vi-VN").format(Math.round(value)) + " đ";
}

export function makeMetadata(title: string, description: string, path = "/", image = siteConfig.brand.ogImage): Metadata {
  const url = new URL(path, SITE_CONFIG.url).toString();
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_CONFIG.brand.name, locale: "vi_VN", alternateLocale: ["en_US"], type: "website", images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export function productBrands() {
  return Array.from(new Set(PRODUCTS.map((item) => item.brand))).sort();
}
