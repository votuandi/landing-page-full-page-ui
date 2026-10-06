import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/config/site";
import { PRODUCTS, PROJECTS, SERVICES } from "@/data/solar";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["","/san-pham","/giai-phap","/ve-chung-toi","/lien-he"];
  const dynamic = [
    ...PRODUCTS.map((p) => `/san-pham/${p.slug}`),
    ...SERVICES.map((s) => `/giai-phap/${s.slug}`),
    ...PROJECTS.map((p) => `/cong-trinh/${p.slug}`),
  ];
  return [...paths,...dynamic].map((path) => ({
    url:`${SITE_CONFIG.url}${path}`,
    lastModified:new Date(),
    changeFrequency:path === "" ? "weekly" as const : "monthly" as const,
    priority:path === "" ? 1 : 0.8
  }));
}