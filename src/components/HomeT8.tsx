import Image from "next/image";
import Link from "next/link";
import { delay } from "@/utils/reveal";
import { PRODUCTS, PROJECTS, TESTIMONIALS } from "@/data/solar";
import { SegmentProvider } from "@/lib/segment";
import HeroT8 from "@/components/HeroT8";
import SegmentGrid from "@/components/SegmentGrid";
import EnergyMonitoringSection from "@/components/EnergyMonitoringSection";
import SectionReveal from "@/components/SectionReveal";
import FaqSection from "@/components/FaqSection";

/**
 * Trang chủ template-13 — thứ tự section theo khung 3.3 → 3.12 (xem AUDIT.md).
 * SegmentProvider giữ phân khúc đang chọn để các section bên dưới lọc / điền sẵn.
 */
export default function HomeT8() {
  const partnerBrands = Array.from(new Set(PRODUCTS.map((p) => p.brand)));
  return (
    <main>
      <SectionReveal />
      <SegmentProvider>
        <HeroT8 />
        <SegmentGrid />


        <section className="t13-invert relative bg-bg-deep pb-10">
          <div className="t5-container py-14 md:py-16">
            <div data-reveal="down"><h2 className="max-w-3xl text-4xl font-black tracking-[-.045em] sm:text-5xl">Công trình đã thực hiện</h2></div>
          </div>
          <div data-reveal-stagger="up" data-reveal-step="0.15" className="grid gap-px bg-on-media/10 lg:grid-cols-3">
            {PROJECTS.map((project) => <Link key={project.slug} href={`/project/${project.slug}`} className="group flex flex-col bg-bg-deep">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={project.image} alt={project.title} fill className="object-cover transition duration-700 group-hover:scale-[1.05]" sizes="(max-width:1024px) 100vw, 34vw" />
              </div>
              <div className="p-6 sm:px-8"><h3 className="text-xl font-black">{project.title}</h3><div className="mt-1 text-sm text-fg-muted">Tiết kiệm <strong className="text-highlight">{project.saving}</strong></div></div>
            </Link>)}
          </div>
        </section>

        <EnergyMonitoringSection />

        <section className="t5-section bg-gradient-to-b from-bg-elevated to-bg-tint/40">
          <div className="t5-container">
            <span data-reveal="down" className="t5-eyebrow">Khách hàng nói gì</span>
            <div className="mt-10 grid gap-5 md:grid-cols-2">{TESTIMONIALS.map((item, index) => <blockquote key={item.company} data-reveal={index % 2 ? "right" : "left"} style={delay(0.2 + index * 0.1)} className="t8-card p-7"><p className="text-xl font-bold leading-8 text-fg">“{item.text}”</p><footer className="mt-6 border-t border-line/12 pt-4 text-sm"><strong>{item.person}</strong><div className="text-fg-muted">{item.company}</div></footer></blockquote>)}</div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">{partnerBrands.map((brand) => <span key={brand} className="rounded-full border border-on-media bg-bg-elevated/70 px-5 py-2 text-lg font-black tracking-tight text-fg-muted shadow-sm">{brand}</span>)}</div>
          </div>
        </section>

        <FaqSection />
      </SegmentProvider>
    </main>
  );
}
