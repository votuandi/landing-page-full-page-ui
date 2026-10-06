import { catalogEnabled } from "@/config/site";
import { SegmentProvider } from "@/lib/segment";
import { StoryPlayerProvider } from "@/lib/storyPlayer";
import SectionReveal from "@/components/SectionReveal";
import HeroT8 from "@/components/HeroT8";
import SegmentGrid from "@/components/SegmentGrid";
import VideoStories from "@/components/VideoStories";
import PackagesSection from "@/components/PackagesSection";
import SolarEstimator from "@/components/SolarEstimator";
import ProjectsGallery from "@/components/ProjectsGallery";
import ProductStrip from "@/components/ProductStrip";
import EnergyMonitoringSection from "@/components/EnergyMonitoringSection";
import TrustSection from "@/components/TrustSection";
import BlogSection from "@/components/BlogSection";
import FaqSection from "@/components/FaqSection";

/**
 * Trang chủ template-13 — thứ tự theo khung 3.3 → 3.11 (xem AUDIT.md):
 * Hero → Phân khúc → Video công trình → Gói giải pháp + Dự toán → Công trình → Sản phẩm (nếu bật catalog)
 * → Theo dõi 24/7 → Uy tín → Blog → FAQ. Dải cam kết (3.11) nằm trong SiteFooter; topbar/header/liên hệ trong SiteShell.
 * SegmentProvider giữ phân khúc đang chọn để video, gói, dự toán và công trình lọc / điền sẵn.
 */
export default function HomeT8() {
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
          <TrustSection />
          <BlogSection limit={3} />
          <FaqSection />
        </StoryPlayerProvider>
      </SegmentProvider>
    </main>
  );
}
