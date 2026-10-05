import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import WarmPageHero from "@/components/WarmPageHero";

export const metadata: Metadata = {
  title: "Về chúng tôi",
  description: "Đội ngũ, năng lực kỹ thuật và hành trình phát triển của Minwy Solar.",
};

const timeline = [
  ["2016","Khởi đầu","Bắt đầu từ nhóm kỹ sư điện tập trung vào giải pháp solar dân dụng."],
  ["2019","Mở rộng EPC","Triển khai các dự án nhà xưởng và xây dựng quy trình khảo sát – nghiệm thu chuẩn hóa."],
  ["2023","50 MW+","Mở rộng mạng lưới thiết bị và năng lực hỗ trợ kỹ thuật trên nhiều tỉnh thành."],
  ["2026","Tối ưu dài hạn","Tập trung hệ hybrid, lưu trữ và quản lý hiệu suất sau lắp đặt."],
];

export default function AboutUsPage() {
  return (
    <main className="bg-[#f7f9f6]">
      <WarmPageHero eyebrow="Về Minwy Solar" title="Một công ty solar được xây theo tư duy kỹ thuật, không chỉ bán thiết bị" description="Chúng tôi kết hợp phân phối thiết bị với tư vấn, thiết kế và thi công để chịu trách nhiệm cho hiệu quả của cả hệ thống." image="/images/our_story.webp" primaryLabel="Trao đổi với kỹ sư" primaryHref="/contact-us" secondaryLabel="Xem dịch vụ" secondaryHref="/service" />
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="grid gap-12 lg:grid-cols-2"><div><div className="text-xs font-black uppercase tracking-[0.18em] text-[#1B5E45]">Câu chuyện</div><h2 className="mt-4 text-4xl font-black tracking-[-0.035em]">Từ bài toán hóa đơn điện đến một hệ thống vận hành nhiều năm</h2><p className="mt-6 leading-8 text-slate-600">Minwy Solar bắt đầu từ niềm tin rằng khách hàng cần một lời giải rõ ràng hơn một danh sách thiết bị. Mỗi dự án được tiếp cận từ phụ tải, điều kiện mái, mục tiêu hoàn vốn và khả năng mở rộng trong tương lai.</p></div><div className="grid grid-cols-2 gap-px bg-emerald-950/10">{[["10+","năm kinh nghiệm"],["1.000+","dự án"],["50 MW+","công suất"],["18","kỹ sư & kỹ thuật viên"]].map(([v,l])=><div key={l} className="bg-white p-6"><div className="text-3xl font-black text-[#12372A]">{v}</div><div className="mt-1 text-sm text-slate-500">{l}</div></div>)}</div></div></section>
      <section className="bg-white py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid gap-5 md:grid-cols-3">{[["Tầm nhìn","Trở thành đơn vị solar đáng tin cậy nhờ năng lực kỹ thuật và dịch vụ sau bán."],["Sứ mệnh","Giúp hộ gia đình và doanh nghiệp tiếp cận năng lượng sạch bằng quyết định đầu tư có cơ sở."],["Giá trị cốt lõi","Minh bạch cấu hình • An toàn thi công • Trách nhiệm dài hạn."]].map(([t,d])=><article key={t} className="border border-emerald-950/10 p-7"><h2 className="text-xl font-black text-[#12372A]">{t}</h2><p className="mt-4 leading-7 text-slate-600">{d}</p></article>)}</div></div></section>
      <section className="py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="text-4xl font-black tracking-[-0.035em]">Đội ngũ kỹ thuật</h2><div className="mt-10 grid gap-5 md:grid-cols-3">{[["Nguyễn Minh Khoa","Giám đốc kỹ thuật","/images/solar-installation-hero.jpg"],["Trần Hoàng Nam","Kỹ sư thiết kế hệ thống","/images/solar-panels-hero.jpg"],["Lê Quốc Bảo","Quản lý thi công & bảo trì","/images/solar-inverter-hero.jpg"]].map(([name,role,image])=><article key={name} className="overflow-hidden border border-emerald-950/10 bg-white"><div className="relative aspect-[4/3]"><Image src={image} alt={name} fill className="object-cover" /></div><div className="p-5"><h3 className="text-lg font-black">{name}</h3><p className="mt-1 text-sm text-slate-500">{role}</p></div></article>)}</div></div></section>
      <section className="bg-[#10271f] py-20 text-white"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><h2 className="text-4xl font-black">Hành trình phát triển</h2><div className="mt-10 grid gap-px bg-white/10 md:grid-cols-4">{timeline.map(([year,title,detail])=><article key={year} className="bg-[#10271f] p-6"><div className="text-2xl font-black text-[#C9E265]">{year}</div><h3 className="mt-5 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-emerald-50/65">{detail}</p></article>)}</div><Link href="/contact-us" className="mt-10 inline-flex rounded-xl bg-[#C9E265] px-6 py-4 font-black text-[#12372A]">Trao đổi về dự án của bạn</Link></div></section>
    </main>
  );
}
