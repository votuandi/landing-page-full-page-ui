import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://phanphoisolar.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/product`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/service`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  try {
    // Fetch all active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch all active services
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch all active news articles
    const newsArticles = await prisma.news.findMany({
      where: { isActive: true },
      select: {
        id: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Fetch all displayed projects
    const projects = await prisma.project.findMany({
      where: { isDisplay: true },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get most recent update dates for listing pages
    const mostRecentProductUpdate = products[0]?.updatedAt;
    const mostRecentServiceUpdate = services[0]?.updatedAt;
    const mostRecentNewsUpdate = newsArticles[0]?.updatedAt || newsArticles[0]?.publishedAt;
    const mostRecentProjectUpdate = projects[0]?.updatedAt;

    // Update static pages with actual modification dates where applicable
    const updatedStaticPages: MetadataRoute.Sitemap = staticPages.map((page) => {
      if (page.url === `${baseUrl}/product` && mostRecentProductUpdate) {
        return { ...page, lastModified: mostRecentProductUpdate };
      }
      if (page.url === `${baseUrl}/service` && mostRecentServiceUpdate) {
        return { ...page, lastModified: mostRecentServiceUpdate };
      }
      if (page.url === `${baseUrl}/news` && mostRecentNewsUpdate) {
        return { ...page, lastModified: mostRecentNewsUpdate };
      }
      if (page.url === `${baseUrl}/projects` && mostRecentProjectUpdate) {
        return { ...page, lastModified: mostRecentProjectUpdate };
      }
      return page;
    });

    // Generate dynamic URLs
    const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const serviceUrls: MetadataRoute.Sitemap = services.map((service) => ({
      url: `${baseUrl}/service/${service.id}`,
      lastModified: service.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    const newsUrls: MetadataRoute.Sitemap = newsArticles.map((article) => ({
      url: `${baseUrl}/news/${article.id}`,
      lastModified: article.updatedAt || article.publishedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const projectUrls: MetadataRoute.Sitemap = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.id}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

    return [
      ...updatedStaticPages,
      ...productUrls,
      ...serviceUrls,
      ...newsUrls,
      ...projectUrls,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Return static pages if database query fails
    return staticPages;
  }
}
