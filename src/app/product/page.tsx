import { Suspense } from "react";
import BestSellerSection from "@/components/BestSellerSection";
import AllProductsSection from "@/components/AllProductsSection";
import WarmPageHero from "@/components/WarmPageHero";

function CatalogFallback() {
  return (
    <section className="bg-[#f7f9f6] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="h-5 w-36 animate-pulse rounded bg-emerald-950/10" />
        <div className="mt-4 h-10 max-w-xl animate-pulse rounded bg-emerald-950/10" />
        <div className="mt-8 h-14 w-full animate-pulse rounded-xl bg-white" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[250px_1fr]">
          <div className="hidden space-y-4 lg:block">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded bg-white" />
            ))}
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="overflow-hidden border border-emerald-950/10 bg-white">
                <div className="aspect-[4/3] animate-pulse bg-emerald-950/10" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-emerald-950/10" />
                  <div className="h-6 w-4/5 animate-pulse rounded bg-emerald-950/10" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-emerald-950/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ProductPage() {
  return (
    <main className="min-h-screen bg-[#f7f9f6]">
      <WarmPageHero
        eyebrow="Thiết bị solar"
        title="Chọn thiết bị theo cấu hình hệ thống, không chọn từng món rời rạc"
        description="Tấm pin, inverter và pin lưu trữ được đánh giá theo hiệu suất, độ tương thích, khả năng bảo hành và mục tiêu vận hành thực tế."
        image="/images/solar-inverter-hero.jpg"
        primaryLabel="Hỏi giá lắp đặt trọn gói"
        primaryHref="/contact-us"
        secondaryLabel="Xem dịch vụ kỹ thuật"
        secondaryHref="/service"
      />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-px bg-emerald-950/10 md:grid-cols-3">
          {[
            ["01 / Chính hãng", "Nguồn gốc rõ ràng, thông số minh bạch và chính sách bảo hành cụ thể."],
            ["02 / Đồng bộ", "Thiết bị được chọn theo cấu hình tổng thể để tránh lãng phí và lỗi tương thích."],
            ["03 / Đúng nhu cầu", "Cân bằng ngân sách, sản lượng kỳ vọng, dự phòng và khả năng mở rộng."],
          ].map(([title, detail]) => (
            <article key={title} className="bg-white p-7">
              <h2 className="text-lg font-black text-[#12372A]">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{detail}</p>
            </article>
          ))}
        </div>
      </section>
      <BestSellerSection />
      <Suspense fallback={<CatalogFallback />}>
        <AllProductsSection />
      </Suspense>
    </main>
  );
}
