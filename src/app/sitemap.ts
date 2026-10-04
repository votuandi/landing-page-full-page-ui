import type { MetadataRoute } from "next";
import { SITE_CONFIG } from "@/utils/constants";

const routes = [
  { path: "", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/product", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/service", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/news", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/about-us", changeFrequency: "yearly" as const, priority: 0.6 },
  { path: "/contact-us", changeFrequency: "yearly" as const, priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${SITE_CONFIG.url}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
