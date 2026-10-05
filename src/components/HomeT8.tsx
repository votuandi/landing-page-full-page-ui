import Image from "next/image";
import Link from "next/link";
import { CheckCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { delay } from "@/utils/reveal";
import { FAQS, POLICY_SUMMARY, PRODUCTS, PROJECTS, TESTIMONIALS } from "@/data/solar";
import HeroT8 from "@/components/HeroT8";
import SavingsBySegment from "@/components/SavingsBySegment";
import EnergyMonitoringSection from "@/components/EnergyMonitoringSection";
import RoiCalculator from "@/components/RoiCalculator";
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

      <SavingsBySegment />

      <RoiCalculator />

      <EnergyMonitoringSection />

      <section className="t8-screen t5-section">
        <div className="t5-container">
          <div data-reveal="down" className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><span className="t5-eyebrow">Case study</span><h2 className="t5-heading">Dữ liệu vận hành nói thay lời quảng cáo.</h2></div><Link href="/contact-us" className="text-sm font-black text-[var(--t5-primary)]">Nhận hồ sơ dự án tương tự →</Link></div>
          <div data-reveal-stagger="up" data-reveal-step="0.15" className="mt-10 grid gap-5 lg:grid-cols-3">
            {PROJECTS.map((project) => <Link key={project.slug} href={`/project/${project.slug}`} className="group overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/80 shadow-[0_20px_60px_-30px_rgb(11_31_58_/_.25)] backdrop-blur transition hover:-translate-y-1">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><Image src={project.image} alt={project.title} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width:1024px) 100vw, 33vw" /></div>
              <div className="p-6"><div className="text-xs font-black uppercase tracking-[.15em] text-slate-400">{project.type} • {project.location}</div><h3 className="mt-3 text-xl font-black text-[var(--t5-primary)]">{project.title}</h3><div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5"><div><div className="text-xs text-slate-400">Công suất</div><strong>{project.capacity}</strong></div><div><div className="text-xs text-slate-400">Tiết kiệm</div><strong>{project.saving}</strong></div></div></div>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="t8-screen t5-section relative overflow-hidden bg-gradient-to-br from-[var(--t8-ink)] to-[var(--t5-primary)] text-white">
        <div className="t5-container">
          <span data-reveal="down" className="t5-eyebrow !text-[var(--t5-accent)]">Quy trình triển khai</span>
          <h2 data-reveal="left" className="mt-4 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">Mỗi bước đều có đầu ra để chủ đầu tư kiểm soát.</h2>
          <div data-reveal-stagger="up" data-reveal-step="0.12" className="mt-12 grid gap-3 lg:grid-cols-5">
            {processSteps.map(([no,title,desc,output]) => <article key={no} className="t8-glass-dark rounded-[28px] p-6 transition hover:bg-white/15"><div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--t5-accent)] text-sm font-black text-[var(--t8-ink)]">{no}</div><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-white/60">{desc}</p><div className="mt-6 border-t border-white/10 pt-4 text-xs font-bold leading-5 text-white/85">{output}</div></article>)}
          </div>
        </div>
      </section>

      <section className="t8-screen t5-section bg-gradient-to-b from-white to-[var(--t8-beige)]">
        <div className="t5-container">
          <span data-reveal="down" className="t5-eyebrow">Mô hình đầu tư</span><h2 data-reveal="left" className="t5-heading">Chọn cấu trúc tài chính phù hợp dòng tiền.</h2>
          <div data-reveal="up" style={delay(0.15)} className="t8-card mt-10 overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-[rgb(219_233_255_/_.60)] text-[var(--t5-primary)]"><tr>{["Mô hình","Sở hữu","CAPEX ban đầu","Lợi ích chính","Phù hợp"].map((h) => <th key={h} className="p-4 font-black">{h}</th>)}</tr></thead><tbody>{investmentModels.map((row) => <tr key={row[0]} className="border-t border-slate-200">{row.map((cell,index) => <td key={cell} className={`p-4 ${index===0?"font-black text-[var(--t5-primary)]":"text-slate-600"}`}>{cell}</td>)}</tr>)}</tbody></table></div>
          <p className="mt-3 text-xs text-slate-500">PPA/thuê mái phụ thuộc đối tác tài chính, pháp lý và điều kiện dự án. [CẦN XÁC MINH]</p>
        </div>
      </section>

      <section className="t8-screen t5-section">
        <div className="t5-container grid items-center gap-12 lg:grid-cols-2">
          <div data-reveal="left"><span className="t5-eyebrow">Bảo hành tách bạch</span><h2 className="t5-heading">Biết rõ ai chịu trách nhiệm cho từng phần.</h2><p className="t5-subheading">Không gộp “bảo hành 25 năm” thành một câu quảng cáo. Mỗi hạng mục có thời hạn, điều kiện và đơn vị chịu trách nhiệm khác nhau.</p></div>
          <div data-reveal="right" style={delay(0.15)} className="t8-card overflow-hidden">{warranties.map(([item,period,note]) => <div key={item} className="grid grid-cols-[1fr_1fr] gap-4 border-b border-slate-200 p-5 last:border-0"><div><div className="font-black text-[var(--t5-primary)]">{item}</div><div className="mt-1 text-xs text-slate-500">{note}</div></div><div className="text-right text-sm font-bold">{period}</div></div>)}</div>
        </div>
      </section>

      <section className="t8-screen t5-section bg-[var(--t8-beige)]">
        <div className="t5-container grid items-center gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div data-reveal="left"><span className="t5-eyebrow">Chính sách mái nhà</span><h2 className="t5-heading">Tóm tắt để ra quyết định, không thay thế tư vấn pháp lý.</h2></div>
          <div data-reveal-stagger="right" data-reveal-step="0.1" className="grid gap-3">{POLICY_SUMMARY.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-white/80 bg-white/60 p-4 backdrop-blur"><CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><p className="text-sm leading-7 text-slate-700">{item}</p></div>)}</div>
        </div>
      </section>

      <section className="t8-screen t5-section bg-gradient-to-b from-white to-[rgb(219_233_255_/_.40)]">
        <div className="t5-container">
          <span data-reveal="down" className="t5-eyebrow">Khách hàng nói gì</span><h2 data-reveal="up" style={delay(0.1)} className="t5-heading">Niềm tin đến từ cách dự án được triển khai.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">{TESTIMONIALS.map((item, index) => <blockquote key={item.company} data-reveal={index % 2 ? "right" : "left"} style={delay(0.2 + index * 0.1)} className="t8-card p-7"><div className="text-sm font-black text-amber-600">{item.rating}</div><p className="mt-6 text-xl font-bold leading-8 text-[var(--t5-primary)]">“{item.text}”</p><footer className="mt-6 border-t border-slate-200 pt-4 text-sm"><strong>{item.person}</strong><div className="text-slate-500">{item.company}</div></footer></blockquote>)}</div>
          <div data-reveal="up" className="mt-16 text-center text-xs font-black uppercase tracking-[.2em] text-slate-400">Thiết bị có trong catalog demo</div>
          <div data-reveal-stagger="zoom" data-reveal-step="0.06" className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">{partnerBrands.map((brand) => <Link href={`/product?brand=${encodeURIComponent(brand)}`} key={brand} className="rounded-full border border-white bg-white/70 px-5 py-2 text-lg font-black tracking-tight text-slate-500 shadow-sm backdrop-blur hover:text-[var(--t5-primary)]">{brand}</Link>)}</div>
        </div>
      </section>

      <section className="t8-screen t5-section">
        <div className="t5-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div data-reveal="left"><span className="t5-eyebrow">FAQ</span><h2 className="t5-heading">Những câu hỏi cần rõ trước khi ký hợp đồng.</h2></div>
          <div data-reveal-stagger="right" data-reveal-step="0.08" className="grid gap-3">{FAQS.map(([q,a]) => <details key={q} className="t8-card group px-6 py-5"><summary className="cursor-pointer list-none pr-8 font-black text-[var(--t5-primary)]">{q}<span className="float-right grid h-7 w-7 place-items-center rounded-full bg-[var(--t8-sky)] text-[var(--t5-primary)] transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{a}</p></details>)}</div>
        </div>
      </section>

      <section className="t8-screen t5-section relative overflow-hidden bg-gradient-to-br from-[var(--t8-ink)] via-[var(--t5-primary)] to-[#1d5bb8] text-white">
        <div className="t5-container grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div data-reveal="left"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--t5-accent)] text-[var(--t5-primary)]"><ShieldCheckIcon className="h-7 w-7" /></div><h2 className="mt-6 text-4xl font-black tracking-[-.04em]">Nhận phương án sơ bộ cho công trình của bạn.</h2><p className="mt-5 text-white/60">Gửi hóa đơn điện, loại mái và nhu cầu vận hành. Đội dự án sẽ chuẩn bị cấu hình để buổi khảo sát đi thẳng vào số liệu.</p></div>
          <div data-reveal="right" style={delay(0.15)} className="rounded-[32px] border border-white/40 bg-white/90 p-6 text-slate-900 shadow-2xl backdrop-blur md:p-8"><LeadForm source="home-bottom" /></div>
        </div>
      </section>
    </main>
  );
}