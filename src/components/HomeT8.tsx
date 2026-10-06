import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { delay } from "@/utils/reveal";
import { FAQS, POLICY_SUMMARY, PRODUCTS, PROJECTS, TESTIMONIALS } from "@/data/solar";
import HeroT8 from "@/components/HeroT8";
import SavingsBySegment from "@/components/SavingsBySegment";
import EnergyMonitoringSection from "@/components/EnergyMonitoringSection";
import SolarEstimator from "@/components/SolarEstimator";
import SectionReveal from "@/components/SectionReveal";
import LeadForm from "@/components/LeadForm";

const processSteps = [
  ["01","Khảo sát","Phụ tải, hóa đơn, mái, trạm điện và điều kiện thi công.","Biên bản khảo sát + dữ liệu đầu vào"],
  ["02","Thiết kế","Mô phỏng sản lượng, chọn thiết bị, layout và phương án đấu nối.","Hồ sơ kỹ thuật + mô hình tài chính"],
  ["03","Thi công","Kế hoạch an toàn, chia khu vực, quản lý vật tư và chất lượng.","Checklist thi công + nhật ký"],
  ["04","Nghiệm thu","Đo kiểm, cấu hình giám sát, hướng dẫn vận hành.","Biên bản nghiệm thu + hồ sơ bàn giao"],
  ["05","O&M","Theo dõi sản lượng, cảnh báo, vệ sinh và bảo trì.","Báo cáo hiệu suất định kỳ"],
];

const investmentModels = [
  ["Mua đứt","Doanh nghiệp sở hữu hệ thống","Cao nhất","Tiết kiệm điện trực tiếp","Doanh nghiệp có ngân sách đầu tư"],
  ["Trả góp","Chia dòng tiền đầu tư","Trung bình","Giảm áp lực CAPEX","Cần cân đối dòng tiền"],
  ["Thuê mái / PPA","Đối tác đầu tư hệ thống","Thấp / theo hợp đồng","Mua điện theo thỏa thuận","Mái lớn, phụ tải ổn định"],
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

      <EnergyMonitoringSection />

      <section className="t8-screen relative bg-bg-deep pb-10 text-fg">
        <div className="t5-container py-14 md:py-16">
          <div data-reveal="down" className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><span className="t5-eyebrow !border-line/15 !bg-glass-strong !text-accent-soft">Case study</span><h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-.045em] sm:text-5xl">Dữ liệu vận hành nói thay lời quảng cáo.</h2></div><Link href="/lien-he" className="text-sm font-black text-accent-soft">Nhận hồ sơ dự án tương tự →</Link></div>
        </div>
        <div data-reveal-stagger="up" data-reveal-step="0.15" className="grid gap-px bg-glass-strong lg:grid-cols-3">
          {PROJECTS.map((project) => <Link key={project.slug} href={`/cong-trinh/${project.slug}`} className="group flex flex-col bg-bg-deep">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src={project.image} alt={project.title} fill className="object-cover transition duration-700 group-hover:scale-[1.05]" sizes="(max-width:1024px) 100vw, 34vw" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[rgb(var(--c-scrim)/)] to-transparent" />
              <span className="t8-glass absolute left-5 top-5 rounded-full px-3 py-1.5 text-xs font-black text-primary">{project.capacity}</span>
              <span className="absolute bottom-4 left-5 text-xs font-black uppercase tracking-[.15em] text-fg">{project.type} • {project.location}</span>
            </div>
            <div className="flex flex-1 items-center justify-between gap-4 p-6 transition group-hover:bg-glass-tint/[.06] sm:px-8">
              <div><h3 className="text-xl font-black">{project.title}</h3><div className="mt-1 text-sm text-fg-muted">Tiết kiệm <strong className="text-accent-soft">{project.saving}</strong></div></div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-glass-strong text-fg transition group-hover:translate-x-1 group-hover:bg-accent group-hover:text-on-accent">→</span>
            </div>
          </Link>)}
        </div>
      </section>

      <section className="t8-screen relative overflow-hidden bg-gradient-to-br from-bg-deep to-primary-deep text-fg">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/),transparent_65%)]" />
        <div className="t5-container relative py-14 md:py-16">
          <span data-reveal="down" className="t5-eyebrow !border-line/15 !bg-glass-strong !text-accent">Quy trình triển khai</span>
          <h2 data-reveal="left" className="mt-4 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">Mỗi bước đều có đầu ra để chủ đầu tư kiểm soát.</h2>
        </div>
        <div data-reveal-stagger="up" data-reveal-step="0.12" className="relative grid flex-1 border-t border-line/15 sm:grid-cols-2 lg:grid-cols-5">
          {processSteps.map(([no,title,desc,output]) => <article key={no} className="group relative flex flex-col border-b border-line/15 bg-glass-tint/[.04] p-6 backdrop-blur transition hover:bg-glass-tint/[.12] sm:border-r lg:min-h-[420px] lg:border-b-0 lg:p-8 xl:p-10">
            <div className="text-7xl font-black leading-none text-fg/10 transition group-hover:text-[rgb(var(--c-accent)/)]">{no}</div>
            <h3 className="mt-6 text-2xl font-black">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-fg-muted">{desc}</p>
            <div className="mt-auto pt-8"><div className="rounded-2xl border border-line/15 bg-glass-strong p-4 text-xs font-bold leading-5 text-fg"><span className="mb-1 block text-[10px] uppercase tracking-[.16em] text-accent-soft">Đầu ra</span>{output}</div></div>
          </article>)}
        </div>
      </section>

      <section className="t8-screen t5-section bg-gradient-to-b from-bg to-bg-elevated">
        <div className="t5-container">
          <span data-reveal="down" className="t5-eyebrow">Mô hình đầu tư</span><h2 data-reveal="left" className="t5-heading">Chọn cấu trúc tài chính phù hợp dòng tiền.</h2>
          <div data-reveal="up" style={delay(0.15)} className="t8-card mt-10 overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-[rgb(var(--c-bg-tint)/)] text-primary"><tr>{["Mô hình","Sở hữu","CAPEX ban đầu","Lợi ích chính","Phù hợp"].map((h) => <th key={h} className="p-4 font-black">{h}</th>)}</tr></thead><tbody>{investmentModels.map((row) => <tr key={row[0]} className="border-t border-line/12">{row.map((cell,index) => <td key={cell} className={`p-4 ${index===0?"font-black text-primary":"text-fg-muted"}`}>{cell}</td>)}</tr>)}</tbody></table></div>
          <p className="mt-3 text-xs text-fg-muted">PPA/thuê mái phụ thuộc đối tác tài chính, pháp lý và điều kiện dự án. [CẦN XÁC MINH]</p>
        </div>
      </section>

      <section className="t8-screen t5-section">
        <div className="t5-container grid items-center gap-12 lg:grid-cols-2">
          <div data-reveal="left"><span className="t5-eyebrow">Bảo hành tách bạch</span><h2 className="t5-heading">Biết rõ ai chịu trách nhiệm cho từng phần.</h2><p className="t5-subheading">Không gộp “bảo hành 25 năm” thành một câu quảng cáo. Mỗi hạng mục có thời hạn, điều kiện và đơn vị chịu trách nhiệm khác nhau.</p></div>
          <div data-reveal="right" style={delay(0.15)} className="t8-card overflow-hidden">{warranties.map(([item,period,note]) => <div key={item} className="grid grid-cols-[1fr_1fr] gap-4 border-b border-line/12 p-5 last:border-0"><div><div className="font-black text-primary">{item}</div><div className="mt-1 text-xs text-fg-muted">{note}</div></div><div className="text-right text-sm font-bold">{period}</div></div>)}</div>
        </div>
      </section>

      <section className="t8-screen t5-section bg-bg-elevated">
        <div className="t5-container grid items-center gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div data-reveal="left"><span className="t5-eyebrow">Chính sách mái nhà</span><h2 className="t5-heading">Tóm tắt để ra quyết định, không thay thế tư vấn pháp lý.</h2></div>
          <div data-reveal-stagger="right" data-reveal-step="0.1" className="grid gap-3">{POLICY_SUMMARY.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-glass-border bg-glass p-4 backdrop-blur"><CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><p className="text-sm leading-7 text-fg">{item}</p></div>)}</div>
        </div>
      </section>

      <section className="t8-screen t5-section bg-gradient-to-b from-bg to-[rgb(var(--c-bg-tint)/)]">
        <div className="t5-container">
          <span data-reveal="down" className="t5-eyebrow">Khách hàng nói gì</span><h2 data-reveal="up" style={delay(0.1)} className="t5-heading">Niềm tin đến từ cách dự án được triển khai.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">{TESTIMONIALS.map((item, index) => <blockquote key={item.company} data-reveal={index % 2 ? "right" : "left"} style={delay(0.2 + index * 0.1)} className="t8-card p-7"><div className="text-sm font-black text-accent">{item.rating}</div><p className="mt-6 text-xl font-bold leading-8 text-primary">“{item.text}”</p><footer className="mt-6 border-t border-line/12 pt-4 text-sm"><strong>{item.person}</strong><div className="text-fg-muted">{item.company}</div></footer></blockquote>)}</div>
          <div data-reveal="up" className="mt-16 text-center text-xs font-black uppercase tracking-[.2em] text-fg-subtle">Thiết bị có trong catalog demo</div>
          <div data-reveal-stagger="zoom" data-reveal-step="0.06" className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">{partnerBrands.map((brand) => <Link href={`/san-pham?brand=${encodeURIComponent(brand)}`} key={brand} className="rounded-full border border-glass-border bg-glass px-5 py-2 text-lg font-black tracking-tight text-fg-muted shadow-sm backdrop-blur hover:text-primary">{brand}</Link>)}</div>
        </div>
      </section>

      <section className="t8-screen t5-section">
        <div className="t5-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div data-reveal="left"><span className="t5-eyebrow">FAQ</span><h2 className="t5-heading">Những câu hỏi cần rõ trước khi ký hợp đồng.</h2></div>
          <div data-reveal-stagger="right" data-reveal-step="0.08" className="grid gap-3">{FAQS.map(([q,a]) => <details key={q} className="t8-card group px-6 py-5"><summary className="cursor-pointer list-none pr-8 font-black text-primary">{q}<span className="float-right grid h-7 w-7 place-items-center rounded-full bg-bg-tint text-primary transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-fg-muted">{a}</p></details>)}</div>
        </div>
      </section>

      <section className="t8-screen relative bg-gradient-to-br from-bg-deep via-bg-tint to-primary-deep text-fg">
        <div className="grid flex-1 lg:grid-cols-2">
          <div data-reveal="left" className="relative min-h-[48vh] overflow-hidden lg:min-h-0">
            <Image src="/images/solar-installation-hero.jpg" alt="Hệ thống điện mặt trời dưới bầu trời nắng" fill className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--c-scrim)/)] via-[rgb(var(--c-scrim)/)] to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[rgb(var(--c-scrim)/)] lg:to-[rgb(var(--c-scrim)/)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 xl:p-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-on-accent"><ShieldCheckIcon className="h-7 w-7" /></div>
              <h2 className="mt-6 max-w-lg text-4xl font-black tracking-[-.04em] sm:text-5xl">Nhận phương án sơ bộ cho công trình của bạn.</h2>
              <p className="mt-5 max-w-md text-fg-muted">Gửi hóa đơn điện, loại mái và nhu cầu vận hành. Đội dự án sẽ chuẩn bị cấu hình để buổi khảo sát đi thẳng vào số liệu.</p>
            </div>
          </div>
          <div className="flex items-center px-4 py-14 sm:px-10 xl:px-20">
            <div data-reveal="right" style={delay(0.15)} className="w-full max-w-[620px] rounded-[32px] border border-glass-border bg-bg-elevated/95 p-6 text-fg shadow-2xl backdrop-blur md:p-8"><LeadForm source="home-bottom" /></div>
          </div>
        </div>
      </section>
    </main>
  );
}