import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES } from "@/data/solar";
import { PROJECTS } from "@/data/projects";
import { formatMoneyShort, formatNumber } from "@solar/core";
import { SEGMENTS } from "@/config/segments";
import { makeMetadata } from "@/utils/solar";
import LeadForm from "@/components/LeadForm";

export async function generateStaticParams() { return SERVICES.map((s) => ({ slug:s.slug })); }

export async function generateMetadata({ params }: { params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) return {};
  return makeMetadata(service.title, `${service.problem} ${service.solution}`, `/giai-phap/${service.slug}`, service.image);
}

export default async function ServiceDetail({ params }: { params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const service = SERVICES.find((s) => s.slug === slug);
  if (!service) notFound();
  const segment = slug === "solar-gia-dinh" ? "household" : slug === "hybrid-luu-tru" ? "shop" : "factory";
  const caseStudy = PROJECTS.find((p) => p.segment === segment) ?? PROJECTS[0];
  const steps = ["Khảo sát & thu thập dữ liệu","Thiết kế và mô phỏng","Chốt cấu hình & kế hoạch","Thi công / thực hiện","Nghiệm thu & bàn giao"];
  return <main>
    <section className="t15-page-hero"><div className="t15-container grid gap-10 lg:grid-cols-[1fr_.7fr]"><div><Link href="/giai-phap" className="text-sm font-bold text-fg-muted">← Tất cả giải pháp</Link><div className="mt-8 text-xs font-black uppercase tracking-[.18em] text-accent-ink">{service.audience}</div><h1 className="t15-page-title">{service.title}</h1><p className="t15-page-desc">{service.solution}</p></div><div className="relative min-h-72 overflow-hidden rounded-media border-4 border-bg-elevated shadow-xl"><Image src={service.image} alt={service.title} fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 40vw" /></div></div></section>
    <section className="t15-section"><div className="t15-container grid gap-10 lg:grid-cols-2"><div><span className="t15-eyebrow">Vấn đề thường gặp</span><h2 className="t15-heading">{service.problem}</h2></div><div><span className="t15-eyebrow">Cách giải quyết</span><p className="mt-5 text-lg leading-8 text-fg-muted">{service.solution}</p></div></div></section>
    <section className="t15-section bg-bg-elevated"><div className="t15-container"><span className="t15-eyebrow">Quy trình</span><div className="mt-8 grid gap-3 md:grid-cols-5">{steps.map((step,i) => <div key={step} className="t15-card p-5"><div className="text-sm font-black text-accent-ink">0{i+1}</div><div className="mt-8 font-black text-primary">{step}</div></div>)}</div></div></section>
    <section className="t15-section"><div className="t15-container grid gap-10 lg:grid-cols-[1fr_.8fr]"><div><span className="t15-eyebrow">Gói / giá tham khảo</span><div className="t15-card mt-6 overflow-hidden">{service.packages.map(([name,price]) => <div key={name} className="grid grid-cols-2 border-b border-line/12 p-5 last:border-0"><strong>{name}</strong><span className="text-right text-fg-muted">{price}</span></div>)}</div><p className="mt-3 text-xs text-fg-muted">* Giá mẫu, chưa phải báo giá thương mại; phụ thuộc hiện trạng, thiết bị và quy mô.</p></div><div><span className="t15-eyebrow">Case liên quan</span><Link href={`/cong-trinh/${caseStudy.slug}`} className="t15-card t15-card-hover mt-6 block p-6"><div className="text-sm font-black text-fg-subtle">{SEGMENTS[caseStudy.segment].label}</div><h3 className="mt-2 text-2xl font-black text-primary">{caseStudy.title}</h3><div className="mt-4">{formatNumber(caseStudy.kwp)} kWp • ~{formatMoneyShort(caseStudy.savingPerMonth)}/tháng</div></Link></div></div></section>
    <section className="t15-section t15-invert t15-ocean text-fg"><div className="t15-container grid gap-10 lg:grid-cols-[.75fr_1.25fr]"><div><h2 className="text-4xl font-black tracking-[-.04em]">{slug === "om-ve-sinh" ? "Đặt lịch O&M." : "Đặt lịch khảo sát kỹ thuật."}</h2><p className="mt-4 text-fg-muted">Để lại thông tin công trình, đội dự án sẽ liên hệ để chuẩn bị dữ liệu trước buổi làm việc.</p></div><div className="t15-card p-6"><LeadForm source={`service-${slug}`} fields={{ zalo: true, address: true, message: true }} /></div></div></section>
  </main>;
}