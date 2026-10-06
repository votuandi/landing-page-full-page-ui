import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { PRODUCTS } from "@/data/solar";
import { PROJECTS } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/product", "/ve-chung-toi", "/lien-he"];
  const dynamic = [
    ...PRODUCTS.map((p) => `/product/${p.slug}`),
    ...PROJECTS.map((p) => `/cong-trinh/${p.slug}`),
  ];
  return [...paths, ...dynamic].map((path) => ({
    url: `${SITE_CONFIG.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
}
