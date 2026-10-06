import type { MetadataRoute } from "next";
import {
  SITE_CONFIG,
  PRODUCTS,
  CASE_STUDIES,
  SEGMENT_IDS,
  SEGMENTS,
  ARTICLES,
} from "@/content/site";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/service",
    "/product",
    "/news",
    "/about-us",
    "/contact-us",
    ...SEGMENT_IDS.map((s) => `/giai-phap/${SEGMENTS[s].slug}`),
    ...CASE_STUDIES.map((c) => `/project/${c.slug}`),
    ...PRODUCTS.map((p) => `/product/${p.slug}`),
    ...ARTICLES.map((a) => `/news/${a.id}`),
  ];
  return paths.map((path) => ({
    url: `${SITE_CONFIG.url}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.8,
  }));
}
