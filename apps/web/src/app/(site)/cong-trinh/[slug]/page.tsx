import { SEGMENT_SLUGS, formatMoneyShort, formatNumber } from "@solar/core";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SEGMENTS } from "@/config/segments";
import { PROJECTS, projectBySlug } from "@/data/projects";
import { makeMetadata } from "@/utils/solar";

export async function generateStaticParams() { return PROJECTS.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return {};
  return makeMetadata(`${project.title} – ${formatNumber(project.kwp)} kWp`, `${project.detail} Tiết kiệm khoảng ${formatMoneyShort(project.savingPerMonth)}/tháng.`, `/cong-trinh/${project.slug}`, project.image);
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();
  const related = PROJECTS.filter((p) => p.segment === project.segment && p.slug !== project.slug).slice(0, 3);
  const segmentSlug = SEGMENT_SLUGS[project.segment];
  return <main>
    <section className="t15-page-hero">
      <div className="t15-container grid gap-10 lg:grid-cols-[1fr_.85fr]">
        <div>
          <Link href="/#cong-trinh" className="text-sm font-bold text-fg-muted hover:text-fg">← Tất cả công trình</Link>
          <div className="mt-6 text-xs font-black uppercase tracking-[.18em] text-secondary">{SEGMENTS[project.segment].label} • {project.location}</div>
          <h1 className="t15-page-title">{project.title}</h1>
          <p className="t15-page-desc">{project.detail}</p>
          <Link href={`/?phan-khuc=${segmentSlug}&nhu-cau=${encodeURIComponent(`Công trình tương tự: ${project.title}`)}#du-toan`} className="t15-button t15-button-accent mt-8">Nhận báo giá công trình tương tự</Link>
        </div>
        <div className="relative min-h-80 overflow-hidden rounded-media border-4 border-bg-elevated shadow-xl"><Image src={project.image} alt={project.title} fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 45vw" /></div>
      </div>
    </section>
    <section className="t15-section">
      <div className="t15-container">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {project.metrics.map(([label, value]) => (
            <div key={label} className="t8-card p-6"><div className="text-xs font-black uppercase tracking-[.14em] text-fg-subtle">{label}</div><div className="mt-3 text-2xl font-black text-fg">{value}</div></div>
          ))}
        </div>
        <div className="t8-card mt-6 flex flex-col gap-2 border-l-4 !border-l-primary p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="text-3xl font-black text-primary">~{formatMoneyShort(project.savingPerMonth)}/tháng</div><div className="mt-1 text-sm text-fg-muted">Tiền điện tiết kiệm ước tính · dữ liệu demo, thay bằng số liệu công trình thật.</div></div>
        </div>
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-black text-fg">Công trình cùng loại</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((p) => <Link key={p.slug} href={`/cong-trinh/${p.slug}`} className="t8-card p-5 transition hover:-translate-y-1"><div className="text-xs font-black text-fg-subtle">{p.location}</div><div className="mt-2 font-black text-fg">{p.title}</div><div className="mt-3 text-sm font-bold text-primary">{formatNumber(p.kwp)} kWp · ~{formatMoneyShort(p.savingPerMonth)}/tháng</div></Link>)}
            </div>
          </div>
        )}
      </div>
    </section>
  </main>;
}
