"use client";

import { useState } from "react";
import WarmPageHero from "@/components/WarmPageHero";
import AllServicesSection from "@/components/AllServicesSection";
import WarrantySection from "@/components/WarrantySection";

export default function ServicePage() {
  const [activeTab, setActiveTab] = useState<"services" | "warranty">("services");

  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <WarmPageHero
        eyebrow="Dịch vụ trọn quy trình"
        title="Từ khảo sát mái nhà đến vận hành ổn định nhiều năm"
        description="Minwy Solar đồng hành xuyên suốt từ khảo sát, thiết kế, chọn thiết bị, thi công đến bảo hành và bảo trì để hệ thống hoạt động an toàn, hiệu quả."
        image="/images/solar-installation-hero.jpg"
        primaryLabel="Đăng ký khảo sát"
        primaryHref="/contact-us"
        secondaryLabel="Xem sản phẩm"
        secondaryHref="/product"
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["01", "Khảo sát", "Hiện trạng mái, tải điện, hướng nắng và nhu cầu sử dụng."],
            ["02", "Thiết kế", "Cấu hình thiết bị và phương án thi công phù hợp công trình."],
            ["03", "Lắp đặt", "Thi công an toàn, gọn, chú trọng chống thấm và thẩm mỹ."],
            ["04", "Đồng hành", "Bảo hành, bảo trì và hỗ trợ kỹ thuật sau bàn giao."],
          ].map(([step, title, detail]) => (
            <article key={step} className="rounded-[2rem] border border-orange-100 bg-white p-6 shadow-sm">
              <span className="text-sm font-black tracking-[0.22em] text-orange-600">{step}</span>
              <h2 className="mt-4 text-xl font-bold text-stone-900">{title}</h2>
              <p className="mt-2 leading-7 text-stone-600">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-orange-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-center gap-3 py-5" aria-label="Dịch vụ">
            <button onClick={() => setActiveTab("services")} className={`rounded-full px-6 py-3 text-sm font-bold transition ${activeTab === "services" ? "bg-orange-600 text-white shadow-lg shadow-orange-100" : "bg-[#fff8ed] text-stone-700 hover:bg-orange-50"}`}>
              Tất cả dịch vụ
            </button>
            <button onClick={() => setActiveTab("warranty")} className={`rounded-full px-6 py-3 text-sm font-bold transition ${activeTab === "warranty" ? "bg-orange-600 text-white shadow-lg shadow-orange-100" : "bg-[#fff8ed] text-stone-700 hover:bg-orange-50"}`}>
              Bảo hành dài hạn
            </button>
          </nav>
        </div>
      </section>

      {activeTab === "services" ? <AllServicesSection /> : <WarrantySection />}
    </main>
  );
}
