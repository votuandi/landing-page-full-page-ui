import { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailContent from "@/components/ProductDetailContent";
import { prisma } from "@/lib/prisma";
import parse from 'html-react-parser';

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
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Sản phẩm không tồn tại | Trọng Tín Solar",
    };
  }

  return {
    title: `${product.title} | Trọng Tín Solar`,
    description:
      product.description?.replace(/<[^>]*>/g, '').substring(0, 160) ||
      `${product.title} - ${product.category.name} - Giá ${product.price || 'Liên hệ'}`,
    keywords: `${product.title}, ${product.category.name}, năng lượng mặt trời`,
    openGraph: {
      title: product.title,
      description:
        product.description?.replace(/<[^>]*>/g, '').substring(0, 160) || 
        `${product.title} - ${product.category.name}`,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <ProductDetailContent product={productData} />
    </div>
  );
}
