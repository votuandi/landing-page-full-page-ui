import { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsDetailContent from "@/components/NewsDetailContent";
import { NewsArticle } from "@/types";

// Fetch news article from API
async function getNewsArticle(id: string): Promise<NewsArticle | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/news/${id}`, {
      cache: 'no-store', // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const news = await response.json();

    // Transform data to match component expectations
    return {
      ...news,
      date: news.publishedAt ? new Date(news.publishedAt).toISOString().split('T')[0] : '',
      image: news.imageUrl || '/images/news-placeholder.jpg',
    };
  } catch (error) {
    console.error('Error fetching news article:', error);
    return null;
  }
}


interface Props {
  params: Promise<{ slug: string }>;
}

import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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

  return {
    title: `${article.title} | ${companyName}`,
    description: article.excerpt,
    keywords: article.tags?.join(", ") + `, ${companyName}`,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.image || ''],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  let article = await getNewsArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewsDetailContent article={article} />
    </div>
  );
}
