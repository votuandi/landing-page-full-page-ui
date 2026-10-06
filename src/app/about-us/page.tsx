import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { TEAM } from "@/data/solar";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Về Minwy Solar | Năng lực EPC & O&M điện mặt trời",
  "Câu chuyện, năng lực dự án, đội ngũ kỹ sư, chứng chỉ mẫu và hành trình phát triển của Minwy Solar.",
  "/about-us",
  "/images/our_story.webp"
);

const timeline = [
  ["2015","Nhóm kỹ sư năng lượng","Bắt đầu từ khảo sát và thiết kế hệ điện mặt trời thương mại quy mô nhỏ."],
  ["2018","Mở rộng EPC C&I","Chuẩn hóa quy trình khảo sát mái, mô phỏng sản lượng và quản lý thi công."],
  ["2022","20 MWp tích lũy","Mở rộng đội O&M và hệ thống theo dõi hiệu suất sau bàn giao."],
  ["2026","38,6 MWp","Tập trung nhà xưởng, kho lạnh, hệ hybrid và các mô hình tài chính linh hoạt."],
];

const certificates = [
  "Chứng chỉ an toàn điện: [DỮ LIỆU MẪU – CẦN XÁC MINH]",
  "Chứng nhận đào tạo Inverter: [DỮ LIỆU MẪU – CẦN XÁC MINH]",
  "Hồ sơ năng lực PCCC/thi công liên quan: [DỮ LIỆU MẪU – CẦN XÁC MINH]",
];

export default function AboutPage() {
  return <main>
    <section className="t5-page-hero"><div className="t5-container grid gap-10 lg:grid-cols-[1fr_.8fr]"><div><span className="t5-eyebrow !text-[var(--t5-accent)]">Về chúng tôi</span><h1 className="t5-page-title">Một công ty điện mặt trời được xây từ năng lực kỹ thuật và trách nhiệm vận hành.</h1><p className="t5-page-desc">Minwy Solar là thương hiệu giả phục vụ trang web mẫu. Câu chuyện, con người và số liệu bên dưới đều được tách thành dữ liệu để thay cho khách hàng thật.</p><Link href="/ho-so-nang-luc-placeholder.pdf" className="mt-8 t5-button bg-[var(--t5-accent)] text-[var(--t5-primary)]">Tải hồ sơ năng lực (PDF mẫu)</Link></div><div className="relative min-h-80 overflow-hidden rounded-[28px]"><Image src="/images/our_story.webp" alt="Đội ngũ kỹ sư khảo sát dự án điện mặt trời" fill className="object-cover" priority /></div></div></section>
    <section className="t5-section"><div className="t5-container grid gap-12 lg:grid-cols-2"><div><span className="t5-eyebrow">Câu chuyện</span><h2 className="t5-heading">Không bắt đầu bằng số tấm pin. Bắt đầu bằng bài toán điện.</h2><p className="t5-subheading">Cách tiếp cận mẫu của Minwy Solar là hiểu phụ tải, kết cấu mái, mục tiêu tài chính và khả năng vận hành trước khi khóa thiết bị. Điều này giúp chủ đầu tư nhìn được cả ROI lẫn trách nhiệm kỹ thuật sau bàn giao.</p></div><div className="grid grid-cols-2 gap-px bg-slate-200">{[[SITE_CONFIG.capabilities.projects+"+","dự án"],[SITE_CONFIG.capabilities.mwp+" MWp","công suất"],[SITE_CONFIG.capabilities.engineers+"","kỹ sư & kỹ thuật"],[SITE_CONFIG.capabilities.provinces+"","tỉnh thành"]].map(([v,l]) => <div key={l} className="bg-slate-50 p-6"><div className="text-3xl font-black text-[var(--t5-primary)]">{v}</div><div className="mt-1 text-sm text-slate-500">{l}</div></div>)}</div></div></section>
    <section className="t5-section bg-slate-50"><div className="t5-container"><span className="t5-eyebrow">Chứng chỉ & giấy phép</span><h2 className="t5-heading">Hồ sơ cần chứng minh bằng tài liệu thật.</h2><div className="mt-8 grid gap-4 md:grid-cols-3">{certificates.map((item) => <div key={item} className="rounded-[28px] overflow-hidden border border-slate-200 bg-white/80 backdrop-blur p-6"><div className="text-sm font-black leading-6 text-[var(--t5-primary)]">{item}</div></div>)}</div></div></section>
    <section className="t5-section"><div className="t5-container"><span className="t5-eyebrow">Đội ngũ</span><h2 className="t5-heading">Người chịu trách nhiệm phải hiện diện rõ.</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{TEAM.map((member) => <article key={member.name} className="rounded-[28px] overflow-hidden border border-slate-200"><div className="relative aspect-[4/3]"><Image src={member.image} alt={member.name} fill className="object-cover" /></div><div className="p-5"><h3 className="text-lg font-black text-[var(--t5-primary)]">{member.name}</h3><p className="mt-1 text-sm text-slate-500">{member.role}</p></div></article>)}</div></div></section>
    <section className="t5-section bg-[var(--t5-primary)] text-white"><div className="t5-container"><span className="t5-eyebrow !text-[var(--t5-accent)]">Hành trình phát triển</span><div className="mt-8 grid gap-px bg-white/15 md:grid-cols-4">{timeline.map(([year,title,desc]) => <article key={year} className="bg-[var(--t5-primary)] p-6"><div className="text-2xl font-black text-[var(--t5-accent)]">{year}</div><h3 className="mt-7 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-white/60">{desc}</p></article>)}</div></div></section>
  </main>;
}