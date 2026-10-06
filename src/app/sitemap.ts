import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { PRODUCTS } from "@/data/products";
import { catalogEnabled } from "@/config/site";
import { PROJECTS } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", ...(catalogEnabled ? ["/san-pham"] : []), "/ve-chung-toi", "/lien-he"];
  const dynamic = [
    ...(catalogEnabled ? PRODUCTS.map((p) => `/san-pham/${p.sku}`) : []),
    ...PROJECTS.map((p) => `/cong-trinh/${p.slug}`),
  ];
  return [...paths, ...dynamic].map((path) => ({
    url: `${SITE_CONFIG.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
}
