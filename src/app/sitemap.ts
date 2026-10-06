import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { PRODUCTS, PROJECTS } from "@/data/solar";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/product", "/ve-chung-toi", "/lien-he"];
  const dynamic = [
    ...PRODUCTS.map((p) => `/product/${p.slug}`),
    ...PROJECTS.map((p) => `/project/${p.slug}`),
  ];
  return [...paths, ...dynamic].map((path) => ({
    url: `${SITE_CONFIG.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
}
