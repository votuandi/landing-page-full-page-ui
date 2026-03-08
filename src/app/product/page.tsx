import { Metadata } from "next";
import BestSellerSection from "@/components/BestSellerSection";
import AllProductsSection from "@/components/AllProductsSection";
import { prisma } from "@/lib/prisma";

async function getCompanyInfo() {
  try {
    const companyInfo = await prisma.companyInfo.findUnique({
      where: { id: 1 },
    });
    return companyInfo;
  } catch (error) {
    console.error("Error fetching company info for metadata:", error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const companyInfo = await getCompanyInfo();
  
  const companyName = companyInfo?.companyName || "Trọng Tín Solar";
  const baseUrl = "https://phanphoisolar.com";
  const title = `Sản phẩm năng lượng mặt trời | ${companyName}`;
  const description = `Khám phá các sản phẩm năng lượng mặt trời chất lượng cao từ ${companyName}. Tấm pin solar, biến tần inverter, pin lưu trữ và phụ kiện chính hãng với giá tốt nhất.`;
  const ogImage = companyInfo?.logoUrl
    ? `${baseUrl}${companyInfo.logoUrl}`
    : `${baseUrl}/og-image.jpg`;
  
  return {
    title,
    description,
    keywords: `sản phẩm năng lượng mặt trời, tấm pin solar, biến tần inverter, pin lưu trữ, thiết bị solar, ${companyName}`,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: "/product",
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/product`,
      siteName: companyName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
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

export default async function ProductPage() {
  const companyInfo = await getCompanyInfo();

  return (
    <main className="min-h-screen">
      <div className="bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Sản Phẩm Năng Lượng Mặt Trời
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Khám phá bộ sưu tập đầy đủ các sản phẩm năng lượng mặt trời chất
                lượng cao từ {companyInfo?.companyName || "chúng tôi"}. Tấm pin
                solar, biến tần inverter, pin lưu trữ và phụ kiện chính hãng.
              </p>
            </div>
          </div>
        </div>

        {/* Best Seller Section */}
        <BestSellerSection />

        {/* All Products Section */}
        <AllProductsSection />
      </div>
    </main>
  );
}
