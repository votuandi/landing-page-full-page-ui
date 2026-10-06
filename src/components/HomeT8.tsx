import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { delay } from "@/utils/reveal";
import { isDistributor } from "@/config/site";
import { FAQS, PRODUCTS, TESTIMONIALS } from "@/data/solar";
import HeroT8 from "@/components/HeroT8";
import SolarEstimator from "@/components/SolarEstimator";
import SavingsBySegment from "@/components/SavingsBySegment";
import PackagesSection from "@/components/PackagesSection";
import InvestmentModels from "@/components/InvestmentModels";
import ProjectsGallery from "@/components/ProjectsGallery";
import VideoStories from "@/components/VideoStories";
import StatsSection from "@/components/StatsSection";
import EnergyMonitoringSection from "@/components/EnergyMonitoringSection";
import SectionReveal from "@/components/SectionReveal";
import LeadForm from "@/components/LeadForm";

const processSteps = [
  ["01","Khảo sát","Phụ tải, hóa đơn, mái, trạm điện và điều kiện thi công.","Biên bản khảo sát + dữ liệu đầu vào"],
  ["02","Thiết kế","Mô phỏng sản lượng, chọn thiết bị, layout và phương án đấu nối.","Hồ sơ kỹ thuật + mô hình tài chính"],
  ["03","Thi công","Kế hoạch an toàn, chia khu vực, quản lý vật tư và chất lượng.","Checklist thi công + nhật ký"],
  ["04","Nghiệm thu","Đo kiểm, cấu hình giám sát, hướng dẫn vận hành.","Biên bản nghiệm thu + hồ sơ bàn giao"],
  ["05","Bảo trì","Theo dõi sản lượng, cảnh báo, vệ sinh và bảo trì.","Báo cáo hiệu suất định kỳ"],
];

const warranties = [
  ["Tấm pin","12–15 năm sản phẩm","25–30 năm hiệu suất*"],
  ["Inverter","5 năm tiêu chuẩn","Có tùy chọn mở rộng*"],
  ["Pin lưu trữ","10 năm*","Theo điều kiện chu kỳ / dung lượng"],
  ["Thi công & mái","Theo hợp đồng","Tách bạch phạm vi chống dột"],
];

export default function HomeT8() {
  const partnerBrands = Array.from(new Set(PRODUCTS.map((p) => p.brand)));
  return (
    <main>
      <SectionReveal />
      <HeroT8 />
      <SolarEstimator />
      <SavingsBySegment />
      <PackagesSection />
      <InvestmentModels />
      <ProjectsGallery />
      <VideoStories />
      <StatsSection />
      <EnergyMonitoringSection />

      <section className="t12-invert t8-screen relative overflow-hidden bg-gradient-to-br from-bg-deep to-primary-deep text-fg">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.3),transparent_65%)]" />
        <div className="t5-container relative py-14 md:py-16">
          <span data-reveal="down" className="t5-eyebrow">Quy trình triển khai</span>
          <h2 data-reveal="left" className="mt-4 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">Mỗi bước đều có đầu ra rõ ràng để bạn kiểm soát.</h2>
        </div>
        <div data-reveal-stagger="up" data-reveal-step="0.12" className="relative grid flex-1 border-t border-line/15 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map(([no,title,desc,output]) => <article key={no} className="group relative flex flex-col border-b border-line/15 bg-glass-tint/[.04] p-6 backdrop-blur transition hover:bg-glass-tint/[.12] sm:border-r lg:min-h-[420px] lg:border-b-0 lg:p-8 xl:p-10">
            <div className="text-7xl font-black leading-none text-fg/10 transition group-hover:text-accent/35">{no}</div>
            <h3 className="mt-6 text-2xl font-black">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-fg-muted">{desc}</p>
            <div className="mt-auto pt-8"><div className="rounded-2xl border border-line/15 bg-glass-strong p-4 text-xs font-bold leading-5 text-fg"><span className="mb-1 block text-[10px] uppercase tracking-[.16em] text-accent-soft">Đầu ra</span>{output}</div></div>
          </article>)}
        </div>
      </section>

      <section className="t5-section">
        <div className="t5-container grid items-center gap-12 lg:grid-cols-2">
          <div data-reveal="left"><span className="t5-eyebrow">Bảo hành tách bạch</span><h2 className="t5-heading">Biết rõ ai chịu trách nhiệm cho từng phần.</h2><p className="t5-subheading">Không gộp “bảo hành 25 năm” thành một câu quảng cáo. Mỗi hạng mục có thời hạn, điều kiện và đơn vị chịu trách nhiệm khác nhau.</p></div>
          <div data-reveal="right" style={delay(0.15)} className="t8-card overflow-hidden">{warranties.map(([item,period,note]) => <div key={item} className="grid grid-cols-[1fr_1fr] gap-4 border-b border-line/12 p-5 last:border-0"><div><div className="font-black text-primary">{item}</div><div className="mt-1 text-xs text-fg-muted">{note}</div></div><div className="text-right text-sm font-bold">{period}</div></div>)}</div>
        </div>
      </section>

      <section className="t5-section bg-gradient-to-b from-bg to-bg-tint/40">
        <div className="t5-container">
          <span data-reveal="down" className="t5-eyebrow">Khách hàng nói gì</span><h2 data-reveal="up" style={delay(0.1)} className="t5-heading">Niềm tin đến từ những hóa đơn điện thật.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">{TESTIMONIALS.map((item, index) => <blockquote key={item.company} data-reveal={index % 2 ? "right" : "left"} style={delay(0.2 + index * 0.1)} className="t8-card flex flex-col p-7"><div className="text-sm font-black text-accent">{item.rating}</div><p className="mt-6 text-lg font-bold leading-8 text-fg">“{item.text}”</p><footer className="mt-auto border-t border-line/12 pt-4 text-sm"><strong>{item.person}</strong><div className="text-fg-muted">{item.company}</div></footer></blockquote>)}</div>
          {isDistributor && (
            <div className="mt-16">
              <div data-reveal="up" className="text-center text-xs font-black uppercase tracking-[.2em] text-fg-subtle">Thương hiệu thiết bị phân phối</div>
              <div data-reveal-stagger="zoom" data-reveal-step="0.06" className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">{partnerBrands.map((brand) => <span key={brand} className="rounded-full border border-glass-border bg-glass px-5 py-2 text-lg font-black tracking-tight text-fg-muted shadow-sm backdrop-blur">{brand}</span>)}</div>
              <div data-reveal="up" className="mt-6 text-center"><Link href="/san-pham" className="inline-flex items-center gap-2 text-sm font-black text-primary hover:gap-3">Xem thiết bị <ArrowRightIcon className="h-4 w-4" /></Link></div>
            </div>
          )}
        </div>
      </section>

      <section className="t5-section">
        <div className="t5-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div data-reveal="left"><span className="t5-eyebrow">Câu hỏi thường gặp</span><h2 className="t5-heading">Những điều nên rõ trước khi lắp đặt.</h2></div>
          <div data-reveal-stagger="right" data-reveal-step="0.08" className="grid gap-3">{FAQS.map(([q,a]) => <details key={q} className="t8-card group px-6 py-5"><summary className="cursor-pointer list-none pr-8 font-black text-fg">{q}<span aria-hidden className="float-right grid h-7 w-7 place-items-center rounded-full bg-bg-tint text-primary transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-fg-muted">{a}</p></details>)}</div>
        </div>
      </section>

      <section className="t12-invert t8-screen relative bg-gradient-to-br from-bg-deep via-bg-tint to-primary-deep text-fg">
        <div className="grid flex-1 lg:grid-cols-2">
          <div data-reveal="left" className="relative min-h-[48vh] overflow-hidden lg:min-h-0">
            <Image src="/images/solar-installation-hero.jpg" alt="Hệ thống điện mặt trời dưới bầu trời nắng" fill loading="lazy" className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-scrim/15 lg:to-scrim/70" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-on-media sm:p-10 xl:p-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-on-accent"><ShieldCheckIcon className="h-7 w-7" /></div>
              <h2 className="mt-6 max-w-lg text-4xl font-black tracking-[-.04em] sm:text-5xl">Khảo sát miễn phí, báo giá trong 24 giờ.</h2>
              <p className="mt-5 max-w-md text-on-media/85">Để lại thông tin, kỹ sư sẽ gọi lại hẹn lịch khảo sát mái và tư vấn gói phù hợp.</p>
            </div>
          </div>
          <div className="flex items-center px-4 py-14 sm:px-10 xl:px-20">
            <div data-reveal="right" style={delay(0.15)} className="w-full max-w-[620px] rounded-[32px] border border-glass-border bg-bg-elevated/95 p-6 text-fg shadow-2xl backdrop-blur md:p-8"><LeadForm source="home-bottom" withMessage /></div>
          </div>
        </div>
      </section>
    </main>
  );
}
