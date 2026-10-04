import { pageMetadata } from "@/utils/seo";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailContent from "@/components/ProductDetailContent";

import { allProductsData } from "@/data/products";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = allProductsData.find((p) => p.id.toString() === slug);

  if (!product) {
    return {
      title: "Sản phẩm không tồn tại | Minwy Solar",
    };
  }

  return pageMetadata(
    product.name,
    product.description || product.name,
    `/product/${slug}`,
    product.image,
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = allProductsData.find((p) => p.id.toString() === slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetailContent product={product} />
    </div>
  );
}

export function generateStaticParams() {
  return allProductsData.map((item) => ({ slug: String(item.id) }));
}
