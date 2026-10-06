import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PROJECTS } from "@/data/projects";
import { SEGMENTS } from "@/config/solar";
import { formatMoneyShort, formatNumber } from "@/lib/solarCalculator";
import { makeMetadata } from "@/utils/solar";

export async function generateStaticParams() { return PROJECTS.map((p) => ({ slug: p.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) return {};
  return makeMetadata(`${project.title} | Công trình điện mặt trời`, `${formatNumber(project.kwp)} kWp tại ${project.location}, tiết kiệm ~${formatMoneyShort(project.savingPerMonth)}/tháng. ${project.detail}`, `/cong-trinh/${project.slug}`, project.image);
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.slug === slug);
  if (!project) notFound();
  const related = PROJECTS.filter((p) => p.segment === project.segment && p.slug !== project.slug).slice(0, 2);
  return <main>
    <section className="t5-page-hero t12-invert">
      <div className="t5-container grid gap-10 lg:grid-cols-[1fr_.85fr]">
        <div>
          <Link href="/#cong-trinh" className="text-sm font-bold text-fg-muted hover:text-fg">← Tất cả công trình</Link>
          <div className="mt-6 text-xs font-black uppercase tracking-[.18em] text-accent">{project.type} • {project.location}</div>
          <h1 className="t5-page-title">{project.title}</h1>
          <p className="t5-page-desc">{project.detail}</p>
          <Link href={`/?phan-khuc=${project.segment}#du-toan`} className="t5-button t5-button-primary mt-8">Dự toán công trình tương tự</Link>
        </div>
        <div className="relative min-h-80 overflow-hidden rounded-[32px] border-[5px] border-glass-tint/15"><Image src={project.image} alt={project.title} fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 45vw" /></div>
      </div>
    </section>
    <section className="t5-section">
      <div className="t5-container">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Phân khúc", SEGMENTS[project.segment].label], ["Tiết kiệm/tháng", `~${formatMoneyShort(project.savingPerMonth)}`], ...project.metrics].slice(0, 6).map(([label, value]) => (
            <div key={label} className="t8-card p-6"><div className="text-xs font-black uppercase tracking-[.14em] text-fg-subtle">{label}</div><div className="mt-3 text-2xl font-black text-primary">{value}</div></div>
          ))}
        </div>
        <p className="mt-4 text-xs text-fg-subtle">Dữ liệu demo — thay bằng ảnh khảo sát, thi công, nghiệm thu và số liệu vận hành thật của công trình.</p>
        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="text-2xl font-black text-fg">Công trình cùng loại</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {related.map((p) => <Link key={p.slug} href={`/cong-trinh/${p.slug}`} className="t8-card block p-6 transition hover:-translate-y-1.5"><div className="text-sm font-bold text-fg-muted">{p.location} • {formatNumber(p.kwp)} kWp</div><div className="mt-2 text-xl font-black text-fg">{p.title}</div><div className="mt-3 text-sm text-accent">~{formatMoneyShort(p.savingPerMonth)}/tháng</div></Link>)}
            </div>
          </div>
        )}
      </div>
    </section>
  </main>;
}
