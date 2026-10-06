import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS, SERVICES } from "@/data/solar";
import { makeMetadata } from "@/utils/solar";
import LeadForm from "@/components/LeadForm";

export async function generateStaticParams() { return SERVICES.map((s) => ({ slug:s.slug })); }

export async function generateMetadata({ params }: { params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return {};
  return makeMetadata(service.title, `${service.problem} ${service.solution}`, `/service/${service.slug}`, service.image);
}

export default async function ServiceDetail({ params }: { params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();
  const caseStudy = slug === "solar-gia-dinh" ? PROJECTS[2] : slug === "hybrid-luu-tru" ? PROJECTS[2] : PROJECTS[0];
  const steps = ["Khảo sát & thu thập dữ liệu","Thiết kế và mô phỏng","Chốt cấu hình & kế hoạch","Thi công / thực hiện","Nghiệm thu & bàn giao"];
  return <main>
    <section className="t5-page-hero"><div className="t5-container grid gap-10 lg:grid-cols-[1fr_.7fr]"><div><Link href="/service" className="text-sm font-bold text-white/60">← Tất cả giải pháp</Link><div className="mt-8 text-xs font-black uppercase tracking-[.18em] text-[var(--t5-accent)]">{service.audience}</div><h1 className="t5-page-title">{service.title}</h1><p className="t5-page-desc">{service.solution}</p></div><div className="relative min-h-72"><Image src={service.image} alt={service.title} fill className="object-cover" priority /></div></div></section>
    <section className="t5-section"><div className="t5-container grid gap-10 lg:grid-cols-2"><div><span className="t5-eyebrow">Vấn đề thường gặp</span><h2 className="t5-heading">{service.problem}</h2></div><div><span className="t5-eyebrow">Cách giải quyết</span><p className="mt-5 text-lg leading-8 text-slate-600">{service.solution}</p></div></div></section>
    <section className="t5-section bg-slate-50"><div className="t5-container"><span className="t5-eyebrow">Quy trình</span><div className="mt-8 grid gap-px bg-slate-200 md:grid-cols-5">{steps.map((step,i) => <div key={step} className="bg-white p-5"><div className="text-sm font-black text-[var(--solar-primary-dark)]">0{i+1}</div><div className="mt-8 font-black text-[var(--t5-primary)]">{step}</div></div>)}</div></div></section>
    <section className="t5-section"><div className="t5-container grid gap-10 lg:grid-cols-[1fr_.8fr]"><div><span className="t5-eyebrow">Gói / giá tham khảo</span><div className="mt-6 border border-slate-200">{service.packages.map(([name,price]) => <div key={name} className="grid grid-cols-2 border-b border-slate-200 p-5 last:border-0"><strong>{name}</strong><span className="text-right text-slate-600">{price}</span></div>)}</div><p className="mt-3 text-xs text-slate-500">* Giá mẫu, chưa phải báo giá thương mại; phụ thuộc hiện trạng, thiết bị và quy mô.</p></div><div><span className="t5-eyebrow">Case liên quan</span><Link href={`/project/${caseStudy.slug}`} className="mt-6 block border border-slate-200 p-6"><div className="text-sm font-black text-slate-400">{caseStudy.type}</div><h3 className="mt-2 text-2xl font-black text-[var(--t5-primary)]">{caseStudy.title}</h3><div className="mt-4">{caseStudy.capacity} • {caseStudy.saving}</div></Link></div></div></section>
    <section className="t5-section bg-[var(--t5-primary)] text-white"><div className="t5-container grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><h2 className="text-4xl font-black tracking-[-.04em]">{slug === "om-ve-sinh" ? "Đặt lịch O&M." : "Đặt lịch khảo sát kỹ thuật."}</h2><p className="mt-4 text-white/60">Để lại thông tin công trình, đội dự án sẽ liên hệ để chuẩn bị dữ liệu trước buổi làm việc.</p></div><div className="bg-white p-6 text-slate-900"><LeadForm source={`service-${slug}`} compact={slug === "om-ve-sinh"} /></div></div></section>
  </main>;
}