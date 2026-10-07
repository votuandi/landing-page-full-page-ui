import type { MetadataRoute } from "next";
import { SITE_CONFIG, isDistributor } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { PRODUCTS, SERVICES } from "@/data/solar";
import { PROJECTS } from "@/data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/giai-phap", "/ve-chung-toi", "/lien-he", ...(siteConfig.guide.enabled ? ["/cam-nang"] : []), ...(isDistributor ? ["/san-pham"] : [])];
  const dynamic = [
    ...(isDistributor ? PRODUCTS.map((p) => `/san-pham/${p.slug}`) : []),
    ...SERVICES.map((s) => `/giai-phap/${s.slug}`),
    ...PROJECTS.map((p) => `/cong-trinh/${p.slug}`),
    ...siteConfig.legal.policies.map((p) => `/chinh-sach/${p.slug}`),
  ];
  return [...paths, ...dynamic].map((path) => ({
    url: `${SITE_CONFIG.url}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" as const : "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
}
