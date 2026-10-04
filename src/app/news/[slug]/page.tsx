import { pageMetadata } from "@/utils/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsDetailContent from "@/components/NewsDetailContent";
import { allNewsArticles } from "@/data/news";

// This would typically come from a database or CMS
// For now, using the same data as in NewsPageContent

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = allNewsArticles.find((a) => a.id.toString() === slug);

  if (!article) {
    return {
      title: "Tin tức không tồn tại | Minwy Solar",
    };
  }

  return pageMetadata(
    article.title,
    article.excerpt,
    `/news/${slug}`,
    article.image,
  );
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = allNewsArticles.find((a) => a.id.toString() === slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NewsDetailContent article={article} />
    </div>
  );
}

export function generateStaticParams() {
  return allNewsArticles.map((item) => ({ slug: String(item.id) }));
}
