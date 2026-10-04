import type { MetadataRoute } from "next";
import { SITE_CONFIG, SERVICES } from "@/utils/constants";
import { allProductsData } from "@/data/products";
import { allNewsArticles } from "@/data/news";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/about-us",
    "/product",
    "/service",
    "/news",
    "/contact-us",
    ...allProductsData.map((item) => `/product/${item.id}`),
    ...SERVICES.map((item) => `/service/${item.id}`),
    ...allNewsArticles.map((item) => `/news/${item.id}`),
  ];
  return paths.map((path) => ({
    url: `${SITE_CONFIG.url}${path}`,
    changeFrequency: "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
