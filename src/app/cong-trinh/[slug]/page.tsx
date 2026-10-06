import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/data/solar";
import { makeMetadata } from "@/utils/solar";

export async function generateStaticParams() { return PROJECTS.map((p) => ({slug:p.slug})); }

export async function generateMetadata({ params }: { params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return {};
  return makeMetadata(`${project.title} | Case study solar`, `${project.capacity}, tỷ lệ tự dùng ${project.selfUse}, tiết kiệm ${project.saving}. ${project.detail}`, `/cong-trinh/${project.slug}`, project.image);
}

export default async function ProjectPage({ params }: { params:Promise<{slug:string}> }) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();
  return <main>
    <section className="t5-page-hero"><div className="t5-container grid gap-10 lg:grid-cols-[1fr_.85fr]"><div><div className="text-xs font-black uppercase tracking-[.18em] text-accent">{project.type} • {project.location}</div><h1 className="t5-page-title">{project.title}</h1><p className="t5-page-desc">{project.detail}</p><Link href="/lien-he" className="mt-8 t5-button bg-accent text-on-accent">Nhận phương án cho dự án tương tự</Link></div><div className="relative min-h-80"><Image src={project.image} alt={project.title} fill className="object-cover" priority /></div></div></section>
    <section className="t5-section"><div className="t5-container"><div className="grid gap-px bg-line/12 sm:grid-cols-2 lg:grid-cols-4">{project.metrics.map(([label,value]) => <div key={label} className="bg-bg-elevated p-6"><div className="text-xs font-black uppercase tracking-[.14em] text-fg-subtle">{label}</div><div className="mt-3 text-2xl font-black text-primary">{value}</div></div>)}</div><div className="mt-12 grid gap-8 lg:grid-cols-2"><div><span className="t5-eyebrow">Bài toán</span><h2 className="mt-4 text-3xl font-black text-primary">Giảm điện mua từ lưới vào đúng giờ tải cao.</h2><p className="mt-4 leading-8 text-fg-muted">Case study mẫu minh họa cách trình bày dự án riêng biệt thay vì tái sử dụng ảnh tin tức. Khi triển khai cho khách thật, thay ảnh bằng bộ ảnh khảo sát, thi công, nghiệm thu và dashboard sản lượng của chính dự án.</p></div><div><span className="t5-eyebrow">Kết quả mẫu</span><div className="mt-4 border-l-4 border-accent bg-bg-elevated p-6"><div className="text-3xl font-black text-primary">{project.saving}</div><div className="mt-2 text-sm text-fg-muted">Tiết kiệm ước tính • dữ liệu demo, cần thay bằng số liệu dự án thật.</div></div></div></div></div></section>
  </main>;
}