import { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsDetailContent from "@/components/NewsDetailContent";
import { NewsArticle } from "@/types";
import StructuredData from "@/components/StructuredData";

// Fetch news article directly from database
async function getNewsArticle(id: string) {
  try {
    const news = await prisma.news.findUnique({
      where: { id: parseInt(id) },
    });

    if (!news) {
      return null;
    }

    // Transform data to match component expectations
    return {
      ...news,
      date: news.publishedAt ? new Date(news.publishedAt).toISOString().split('T')[0] : '',
      image: news.imageUrl || '/images/news-placeholder.jpg',
      publishedAt: news.publishedAt ? new Date(news.publishedAt).toISOString() : new Date(news.createdAt).toISOString(),
      createdAt: news.createdAt.toISOString(),
      updatedAt: news.updatedAt.toISOString(),
    } as unknown as NewsArticle;
  } catch (error) {
    console.error('Error fetching news article:', error);
    return null;
  }
}


interface Props {
  params: Promise<{ slug: string }>;
}

import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // Revalidate every hour (ISR)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = "https://phanphoisolar.com";
  const [article, companyInfo] = await Promise.all([
    getNewsArticle(slug),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";

  if (!article) {
    return {
      title: `Tin tức không tồn tại | ${companyName}`,
    };
  }

  const description = article.excerpt ||
    (article.content ? article.content.replace(/<[^>]*>/g, '').substring(0, 160) : '');
  const ogImage = article.image
    ? `${baseUrl}${article.image}`
    : `${baseUrl}/images/news-placeholder.jpg`;

  return {
    title: `${article.title} | ${companyName}`,
    description,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/news/${slug}`,
    },
    openGraph: {
      title: `${article.title} | ${companyName}`,
      description,
      url: `${baseUrl}/news/${slug}`,
      siteName: companyName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      locale: "vi_VN",
      type: "article",
      publishedTime: article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
      modifiedTime: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
      authors: [article.author || companyName],
      tags: article.tags || [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | ${companyName}`,
      description: description.substring(0, 200),
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [article, companyInfo] = await Promise.all([
    getNewsArticle(slug),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!article) {
    notFound();
  }

  // Fetch related articles (same category or shared tags, excluding current article)
  let relatedArticles: NewsArticle[] = [];
  try {
    const related = await prisma.news.findMany({
      where: {
        isActive: true,
        id: { not: article.id },
        OR: [
          { category: article.category },
          ...(article.tags && article.tags.length > 0
            ? [{ tags: { hasSome: article.tags } }]
            : []),
        ],
      },
      take: 4,
      orderBy: { publishedAt: "desc" },
    });

    relatedArticles = related.map((news) => ({
      ...news,
      date: news.publishedAt ? new Date(news.publishedAt).toISOString().split('T')[0] : '',
      image: news.imageUrl || '/images/news-placeholder.jpg',
      publishedAt: news.publishedAt ? new Date(news.publishedAt).toISOString() : new Date(news.createdAt).toISOString(),
      createdAt: news.createdAt.toISOString(),
      updatedAt: news.updatedAt.toISOString(),
    })) as NewsArticle[];
  } catch (error) {
    console.error('Error fetching related articles:', error);
  }

  // Use the article we already fetched for structured data
  const fullArticle = article;

  // Breadcrumb data
  const breadcrumbs = [
    { name: "Trang chủ", url: "/" },
    { name: "Tin tức", url: "/news" },
    { name: article.title, url: `/news/${slug}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {fullArticle && (
        <StructuredData type="Article" data={fullArticle} companyInfo={companyInfo} />
      )}
      <StructuredData type="BreadcrumbList" data={breadcrumbs} />
      <NewsDetailContent article={article} relatedArticles={relatedArticles} />
    </div>
  );
}
