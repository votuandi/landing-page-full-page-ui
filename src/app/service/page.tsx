"use client";

import { useState } from "react";
import WarmPageHero from "@/components/WarmPageHero";
import AllServicesSection from "@/components/AllServicesSection";
import WarrantySection from "@/components/WarrantySection";

export default function ServicePage() {
  const [activeTab, setActiveTab] = useState<"services" | "warranty">("services");
  return (
    <main className="min-h-screen bg-[#f7f9f6]">
      <WarmPageHero eyebrow="Dịch vụ kỹ thuật" title="Một đội ngũ xuyên suốt từ khảo sát đến bảo trì" description="Minwy Solar triển khai theo quy trình kỹ thuật rõ ràng để hệ thống an toàn, dễ kiểm soát sản lượng và thuận tiện bảo trì về sau." image="/images/solar-installation-hero.jpg" primaryLabel="Đăng ký khảo sát" primaryHref="/contact-us" secondaryLabel="Xem thiết bị" secondaryHref="/product" />
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="grid gap-px bg-emerald-950/10 md:grid-cols-4">{[["01","Khảo sát","Mái, tải điện, hướng nắng và điều kiện thi công."],["02","Thiết kế","Cấu hình, sơ đồ và dự toán sản lượng."],["03","Thi công","Lắp đặt gọn, an toàn điện và chống thấm."],["04","Đồng hành","Theo dõi, bảo trì và hỗ trợ sau bàn giao."]].map(([step,title,detail])=><article key={step} className="bg-white p-6"><div className="text-sm font-black text-[#1B5E45]">{step}</div><h2 className="mt-4 text-xl font-black">{title}</h2><p className="mt-2 leading-7 text-slate-600">{detail}</p></article>)}</div></section>
      <section className="border-y border-emerald-950/10 bg-white"><div className="mx-auto flex max-w-7xl gap-2 px-4 py-4 sm:px-6 lg:px-8"><button onClick={()=>setActiveTab("services")} className={`rounded-xl px-5 py-3 text-sm font-black ${activeTab==="services"?"bg-[#12372A] text-white":"bg-[#eef4ef] text-[#12372A]"}`}>Dịch vụ</button><button onClick={()=>setActiveTab("warranty")} className={`rounded-xl px-5 py-3 text-sm font-black ${activeTab==="warranty"?"bg-[#12372A] text-white":"bg-[#eef4ef] text-[#12372A]"}`}>Bảo hành</button></div></section>
      {activeTab === "services" ? <AllServicesSection /> : <WarrantySection />}
      <section className="bg-[#12372A] py-16 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="text-3xl font-black">Hòa lưới, hybrid hay độc lập?</h2><div className="mt-8 overflow-x-auto"><table className="min-w-[720px] w-full border-collapse text-left text-sm"><thead><tr className="border-b border-white/15 text-[#C9E265]"><th className="p-4">Tiêu chí</th><th className="p-4">Hòa lưới</th><th className="p-4">Hybrid</th><th className="p-4">Độc lập</th></tr></thead><tbody className="text-emerald-50/75">{[["Khi mất điện","Dừng hệ thống","Có thể dự phòng","Vẫn hoạt động"],["Pin lưu trữ","Không bắt buộc","Có","Có"],["Chi phí đầu tư","Thấp nhất","Trung bình – cao","Cao"],["Phù hợp","Khu vực lưới ổn định","Cần backup tải quan trọng","Khu vực xa lưới"]].map((row)=><tr key={row[0]} className="border-b border-white/10">{row.map((cell)=><td key={cell} className="p-4">{cell}</td>)}</tr>)}</tbody></table></div></div></section>
    </main>
  );
}
