import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailContent from "@/components/ProductDetailContent";
import { prisma } from "@/lib/prisma";
import parse from 'html-react-parser';
import StructuredData from "@/components/StructuredData";

// Utility function to parse HTML and convert to plain text
function parseHtml(html: string | null | undefined) {
  if (!html) return <div></div>;

  return <div>{parse(html)}</div>;
}

// Product data structure for ProductDetailContent component
interface ProductData {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  specs: string[];
  discount?: number;
  category: string;
  priceNumber: number;
  description?: string | React.ReactNode;
  features?: string[];
  warranty?: string | React.ReactNode;
  technicalSpecs?: Record<string, string | React.ReactNode>;
  introduction?: string;
}

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const productId = parseInt(slug);
    if (isNaN(productId)) {
      return null;
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        isActive: true // Only show active products
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = "https://phanphoisolar.com";
  const [product, companyInfo] = await Promise.all([
    getProduct(slug),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  const companyName = companyInfo?.companyName || "Trọng Tín Solar";

  if (!product) {
    return {
      title: `Sản phẩm không tồn tại | ${companyName}`,
    };
  }

  const description =
    product.description?.replace(/<[^>]*>/g, '').substring(0, 160) ||
    `${product.title} - ${product.category.name} - Giá ${product.price || 'Liên hệ'}`;
  const ogImage = product.imageUrl
    ? `${baseUrl}${product.imageUrl}`
    : `${baseUrl}/images/placeholder-product.svg`;

  return {
    title: `${product.title} | ${companyName}`,
    description,
    keywords: `${product.title}, ${product.category.name}, năng lượng mặt trời, ${companyName}`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/product/${product.id}`,
    },
    openGraph: {
      title: `${product.title} | ${companyName}`,
      description,
      url: `${baseUrl}/product/${product.id}`,
      siteName: companyName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.title} | ${companyName}`,
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

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const [product, companyInfo] = await Promise.all([
    getProduct(slug),
    prisma.companyInfo.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  if (!product) {
    notFound();
  }

  // Calculate discount if both prices exist
  let discount: number | undefined;
  if (product.original_price && product.price) {
    const origNum = parseFloat(product.original_price.replace(/[^0-9]/g, ''));
    const currNum = parseFloat(product.price.replace(/[^0-9]/g, ''));
    if (origNum && currNum && origNum > currNum) {
      discount = Math.round(((origNum - currNum) / origNum) * 100);
    }
  }

  // Extract price number for sorting/comparison
  const priceNumber = product.price
    ? parseFloat(product.price.replace(/[^0-9]/g, ''))
    : 0;

  // Transform database product to ProductData format expected by ProductDetailContent
  const productData: ProductData = {
    id: product.id,
    name: product.title,
    price: product.price || "Liên hệ",
    originalPrice: product.original_price || undefined,
    image: product.imageUrl || "/images/placeholder-product.svg",
    specs: [], // Can be extracted from description or added as a separate field
    discount,
    category: product.category.name,
    priceNumber,
    // Convert HTML to plain text for rich text editor fields
    description: parseHtml(product.description),
    introduction: product.introduction ?? "",
    features: [], // Can be extracted from description or added as a separate field
    warranty: parseHtml(product.guarantee) || "Bảo hành theo chính sách nhà sản xuất",
    technicalSpecs: product.specifications ? { 'Thông số': parseHtml(product.specifications) } : {},
  };

  // Fetch related products (same category, excluding current product)
  let relatedProducts: any[] = [];
  try {
    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: product.id },
        categoryId: product.categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
    });

    relatedProducts = related.map((p) => ({
      id: p.id,
      title: p.title,
      imageUrl: p.imageUrl,
      price: p.price,
      category: p.category,
    }));
  } catch (error) {
    console.error('Error fetching related products:', error);
  }

  // Breadcrumb data
  const breadcrumbs = [
    { name: "Trang chủ", url: "/" },
    { name: "Sản phẩm", url: "/products" },
    { name: product.title, url: `/product/${product.id}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <StructuredData type="Product" data={product} companyInfo={companyInfo} />
      <StructuredData type="BreadcrumbList" data={breadcrumbs} />
      <ProductDetailContent product={productData} relatedProducts={relatedProducts} />
    </div>
  );
}
