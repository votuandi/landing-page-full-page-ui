import { delay } from "@/utils/reveal";
import { TESTIMONIALS } from "@/data/solar";
import { productBrands } from "@/data/products";
import { catalogEnabled } from "@/config/site";
import ProductStrip from "@/components/ProductStrip";
import { SegmentProvider } from "@/lib/segment";
import { StoryPlayerProvider } from "@/lib/storyPlayer";
import VideoStories from "@/components/VideoStories";
import ProjectsGallery from "@/components/ProjectsGallery";
import PackagesSection from "@/components/PackagesSection";
import SolarEstimator from "@/components/SolarEstimator";
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
  const partnerBrands = productBrands();
  return (
    <main>
      <SectionReveal />
      <SegmentProvider>
      <StoryPlayerProvider>
        <HeroT8 />
        <SegmentGrid />

        <VideoStories />

        <PackagesSection />
        <SolarEstimator />

        <ProjectsGallery />

        {catalogEnabled && <ProductStrip />}

        <EnergyMonitoringSection />

        <section className="t5-section bg-gradient-to-b from-bg-elevated to-bg-tint/40">
          <div className="t5-container">
            <span data-reveal="down" className="t5-eyebrow">Khách hàng nói gì</span>
            <div className="mt-10 grid gap-5 md:grid-cols-2">{TESTIMONIALS.map((item, index) => <blockquote key={item.company} data-reveal={index % 2 ? "right" : "left"} style={delay(0.2 + index * 0.1)} className="t8-card p-7"><p className="text-xl font-bold leading-8 text-fg">“{item.text}”</p><footer className="mt-6 border-t border-line/12 pt-4 text-sm"><strong>{item.person}</strong><div className="text-fg-muted">{item.company}</div></footer></blockquote>)}</div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">{partnerBrands.map((brand) => <span key={brand} className="rounded-full border border-on-media bg-bg-elevated/70 px-5 py-2 text-lg font-black tracking-tight text-fg-muted shadow-sm">{brand}</span>)}</div>
          </div>
        </section>

        <FaqSection />
      </StoryPlayerProvider>
      </SegmentProvider>
    </main>
  );
}
