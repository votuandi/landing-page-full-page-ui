import { pageMetadata } from "@/utils/seo";
export const metadata = pageMetadata(
  "Sản phẩm điện mặt trời",
  "Tấm pin, biến tần và pin lưu trữ năng lượng tại Minwy Solar.",
  "/product",
);
import BestSellerSection from "@/components/BestSellerSection";
import AllProductsSection from "@/components/AllProductsSection";

export default function ProductPage() {
  return (
    <main className="min-h-screen">
      <div className="bg-gray-50">
        <div className="shell py-10">
          <p className="eyebrow">THIẾT BỊ NĂNG LƯỢNG</p>
          <h1 className="text-3xl md:text-4xl font-bold text-solar-blue">
            Sản phẩm điện mặt trời
          </h1>
          <p className="mt-4 text-gray-600">
            Khám phá thiết bị phù hợp cho hệ thống của bạn.
          </p>
        </div>
        {/* Best Seller Section */}
        <BestSellerSection />

        {/* All Products Section */}
        <AllProductsSection />
      </div>
    </main>
  );
}
