"use client";

import BestSellerSection from "@/components/BestSellerSection";
import AllProductsSection from "@/components/AllProductsSection";
import WarmPageHero from "@/components/WarmPageHero";

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <WarmPageHero
        eyebrow="Thiết bị & giải pháp"
        title="Thiết bị solar được chọn cho hiệu suất ổn định và vòng đời dài"
        description="Từ tấm pin, inverter đến pin lưu trữ, mỗi nhóm sản phẩm được chọn theo tiêu chí hiệu suất, độ bền, khả năng bảo hành và tính tương thích của toàn hệ thống."
        image="/images/solar-inverter-hero.jpg"
        primaryLabel="Tư vấn cấu hình"
        primaryHref="/contact-us"
        secondaryLabel="Xem dịch vụ lắp đặt"
        secondaryHref="/service"
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Chính hãng", "Nguồn gốc rõ ràng, thông số minh bạch và chính sách bảo hành cụ thể."],
            ["Đồng bộ", "Thiết bị được tư vấn theo cấu hình tổng thể, tránh chọn rời rạc gây lãng phí."],
            ["Đúng nhu cầu", "Cân bằng giữa ngân sách, sản lượng kỳ vọng và khả năng mở rộng sau này."],
          ].map(([title, detail]) => (
            <article key={title} className="rounded-[2rem] border border-orange-100 bg-white p-7 shadow-[0_18px_50px_rgba(120,75,20,0.07)]">
              <div className="mb-5 h-2 w-14 rounded-full bg-gradient-to-r from-amber-300 to-orange-500" />
              <h2 className="text-xl font-bold text-stone-900">{title}</h2>
              <p className="mt-3 leading-7 text-stone-600">{detail}</p>
            </article>
          ))}
        </div>
      </section>
      <BestSellerSection />
      <AllProductsSection />
    </main>
  );
}
