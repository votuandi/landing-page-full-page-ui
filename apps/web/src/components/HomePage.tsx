import { delay, SectionReveal } from "@solar/ui";
import { Suspense } from "react";
import { catalogEnabled } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { SegmentProvider } from "@/lib/segment";
import { StoryPlayerProvider } from "@/lib/storyPlayer";

import { Tr } from "@/i18n/LangProvider";

import Hero from "@/components/Hero";
import SegmentGrid from "@/components/SegmentGrid";
import VideoStories from "@/components/VideoStories";
import PackagesSection from "@/components/PackagesSection";
import SolarEstimator from "@/components/SolarEstimator";
import InvestmentModels from "@/components/InvestmentModels";
import ProjectsGallery from "@/components/ProjectsGallery";
import ProductStrip from "@/components/ProductStrip";
import StatsSection from "@/components/StatsSection";
import EnergyMonitoringSection from "@/components/EnergyMonitoringSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ProcessSection from "@/components/ProcessSection";
import BlogSection from "@/components/BlogSection";
import FaqSection from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";
import CertificatesSection from "@/components/sections/CertificatesSection";
import BrandsSection from "@/components/sections/BrandsSection";
import FeaturedProjects from "@/components/sections/FeaturedProjects";
import SolutionsSection from "@/components/sections/SolutionsSection";
import PressSection from "@/components/sections/PressSection";
import TikTokSection from "@/components/sections/TikTokSection";
import DealerSection from "@/components/sections/DealerSection";
import BranchMap from "@/components/sections/BranchMap";
import EngineerBanner from "@/components/sections/EngineerBanner";
import SocialSection from "@/components/sections/SocialSection";

const c = siteConfig;

const warranties = [
  [["Tấm pin", "Panels"], "12–15 năm sản phẩm", "25–30 năm hiệu suất*"],
  [["Inverter", "Inverters"], "5–10 năm", "Theo chính sách hãng*"],
  [["Pin lưu trữ", "Batteries"], "10 năm*", "Theo điều kiện chu kỳ / dung lượng"],
  [["Đèn năng lượng mặt trời", "Solar lights"], "1–3 năm", "Theo từng dòng sản phẩm*"],
  [["Thi công & chống dột", "Workmanship"], "5 năm", "Ghi rõ phạm vi trong hợp đồng"],
] as const;

/**
 * Mỗi section client nằm trong <Suspense> riêng → React hydrate từng phần (selective hydration),
 * nhường main-thread giữa các phần thay vì một tác vụ dài.
 */
const Lazy = ({ children }: { children: React.ReactNode }) => <Suspense fallback={null}>{children}</Suspense>;

/**
 * Trang chủ template-15 = toàn bộ section của template-13 + template-14, thứ tự cố định.
 * Bật/tắt từng section trong src/config/site.config.ts. SegmentProvider giữ phân khúc đang chọn để
 * video, gói giải pháp, dự toán và công trình lọc / điền sẵn; StoryPlayerProvider dùng chung một trình phát video.
 */
export default function HomePage() {
  return (
    <main>
      <SectionReveal />
      <SegmentProvider>
        <StoryPlayerProvider>
          {c.hero.enabled && <Hero />}
          {c.segmentGrid.enabled && <Lazy><SegmentGrid /></Lazy>}
          {c.videoStories.enabled && <Lazy><VideoStories /></Lazy>}
          {c.packages.enabled && <Lazy><PackagesSection /></Lazy>}
          {c.calculator.enabled && <Lazy><SolarEstimator /></Lazy>}
          {c.legacy.investmentModels.enabled && <InvestmentModels />}
          {c.certificates.enabled && <Lazy><CertificatesSection /></Lazy>}
          {c.brands.enabled && <Lazy><BrandsSection /></Lazy>}
          {c.projects.enabled && <Lazy><FeaturedProjects /></Lazy>}
          {c.projectsGallery.enabled && <Lazy><ProjectsGallery /></Lazy>}
          {c.solutions.enabled && <Lazy><SolutionsSection /></Lazy>}
          {catalogEnabled && c.productStrip.enabled && <Lazy><ProductStrip /></Lazy>}
          {c.stats.enabled && <Lazy><StatsSection /></Lazy>}
          {c.press.enabled && <Lazy><PressSection /></Lazy>}
          {c.energyMonitoring.enabled && <EnergyMonitoringSection />}
          {c.testimonials.enabled && <Lazy><TestimonialsSection /></Lazy>}
          {c.tiktok.enabled && <Lazy><TikTokSection /></Lazy>}
          {c.dealer.enabled && <Lazy><DealerSection /></Lazy>}
          {c.branchMap.enabled && <Lazy><BranchMap /></Lazy>}
          {c.engineerBanner.enabled && <Lazy><EngineerBanner /></Lazy>}
          {c.process.enabled && <ProcessSection />}

          {c.legacy.warranty.enabled && <section className="t15-section bg-bg-elevated">
            <div className="t15-container grid items-center gap-12 lg:grid-cols-2">
              <div data-reveal="left"><span className="t15-eyebrow"><Tr vi="Bảo hành tách bạch" en="Clear warranties" /></span><h2 className="t15-heading"><Tr vi="Biết rõ ai chịu trách nhiệm cho từng phần." en="Know who is responsible for each part." /></h2><p className="t15-subheading">Không gộp “bảo hành 25 năm” thành một câu quảng cáo. Mỗi hạng mục có thời hạn, điều kiện và đơn vị chịu trách nhiệm khác nhau.</p></div>
              <div data-reveal="right" style={delay(0.15)} className="t15-card overflow-hidden">{warranties.map(([item, period, note]) => <div key={item[0]} className="grid grid-cols-[1fr_1fr] gap-4 border-b border-line/10 p-5 last:border-0"><div><div className="font-black text-primary"><Tr vi={item[0]} en={item[1]} /></div><div className="mt-1 text-xs text-fg-muted">{note}</div></div><div className="text-right text-sm font-bold">{period}</div></div>)}</div>
            </div>
          </section>}

          {c.blog.enabled && <BlogSection limit={c.blog.limit} />}
          {c.social.enabled && <Lazy><SocialSection /></Lazy>}
          {c.faq.enabled && <FaqSection />}
          {c.contactForm.enabled && <ContactSection />}
        </StoryPlayerProvider>
      </SegmentProvider>
    </main>
  );
}
