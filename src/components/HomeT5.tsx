import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CheckCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG } from "@/config/site";
import { FAQS, POLICY_SUMMARY, PRODUCTS, PROJECTS, SERVICES, TESTIMONIALS } from "@/data/solar";
import RoiCalculator from "@/components/RoiCalculator";
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

export default function HomeT5() {
  const partnerBrands = Array.from(new Set(PRODUCTS.map((p) => p.brand)));
  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--t5-primary)] text-white">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="t5-container relative grid min-h-[720px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="inline-flex border border-white/20 px-3 py-2 text-xs font-black uppercase tracking-[.18em] text-[var(--t5-accent)]">Điện mặt trời cho C&I</div>
            <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-[-.055em] sm:text-6xl lg:text-7xl">Biến mái nhà xưởng thành một tài sản <span className="text-[var(--t5-accent)]">giảm chi phí điện.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/70">Thiết kế hệ solar dựa trên phụ tải ban ngày, ROI và điều kiện vận hành thực tế — từ khảo sát đến O&M trong một đầu mối kỹ thuật.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#roi" className="t5-button bg-[var(--t5-accent)] text-[var(--t5-primary)] hover:brightness-105">Tính ROI cho nhà xưởng <ArrowRightIcon className="h-4 w-4" /></a>
              <Link href="/contact-us" className="t5-button border border-white/25 text-white hover:bg-white/10">Đặt lịch khảo sát</Link>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
              {[
                [SITE_CONFIG.capabilities.projects + "+","dự án"],
                [SITE_CONFIG.capabilities.mwp + " MWp","đã triển khai"],
                [SITE_CONFIG.capabilities.engineers + "","kỹ sư & kỹ thuật"],
                [SITE_CONFIG.capabilities.provinces + "","tỉnh thành"],
              ].map(([value,label]) => <div key={label} className="bg-[var(--t5-primary)] p-5"><div className="text-2xl font-black text-white">{value}</div><div className="mt-1 text-xs font-bold uppercase tracking-[.13em] text-white/45">{label}</div></div>)}
            </div>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden border border-white/15">
              <Image src="/images/solar-installation-hero.jpg" alt="Hệ thống điện mặt trời trên mái nhà xưởng" fill priority className="object-cover" sizes="(max-width:1024px) 100vw, 45vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--t5-primary)]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="border-l-4 border-[var(--t5-accent)] bg-[var(--t5-primary)]/85 p-5 backdrop-blur">
                  <div className="text-xs font-black uppercase tracking-[.16em] text-white/50">Mục tiêu thiết kế</div>
                  <div className="mt-2 text-2xl font-black">Tối đa tỷ lệ tự dùng, không tối đa số tấm pin.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="t5-section">
        <div className="t5-container">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
            <div><span className="t5-eyebrow">Chọn theo bài toán</span><h2 className="t5-heading">Một hệ solar tốt bắt đầu từ đúng nhu cầu.</h2></div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Doanh nghiệp / Nhà xưởng","Giảm chi phí điện giờ sản xuất, ROI rõ ràng.","/service/solar-nha-xuong","01"],
                ["Hộ gia đình","Tối ưu hóa đơn cho biệt thự và hộ tiêu thụ cao.","/service/solar-gia-dinh","02"],
                ["Hybrid lưu trữ","Dự phòng tải quan trọng và tăng tỷ lệ tự dùng.","/service/hybrid-luu-tru","03"],
              ].map(([title,desc,href,no]) => <Link key={href} href={href} className="group border border-slate-200 p-6 transition hover:border-[var(--t5-primary)] hover:bg-slate-50"><div className="text-xs font-black text-slate-400">{no}</div><h3 className="mt-10 text-xl font-black text-[var(--t5-primary)]">{title}</h3><p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p><div className="mt-6 text-sm font-black text-[var(--t5-primary)]">Xem giải pháp →</div></Link>)}
            </div>
          </div>
        </div>
      </section>

      <RoiCalculator />

      <section className="t5-section">
        <div className="t5-container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><span className="t5-eyebrow">Case study</span><h2 className="t5-heading">Dữ liệu vận hành nói thay lời quảng cáo.</h2></div><Link href="/contact-us" className="text-sm font-black text-[var(--t5-primary)]">Nhận hồ sơ dự án tương tự →</Link></div>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {PROJECTS.map((project) => <Link key={project.slug} href={`/project/${project.slug}`} className="group border border-slate-200 bg-white">
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><Image src={project.image} alt={project.title} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width:1024px) 100vw, 33vw" /></div>
              <div className="p-6"><div className="text-xs font-black uppercase tracking-[.15em] text-slate-400">{project.type} • {project.location}</div><h3 className="mt-3 text-xl font-black text-[var(--t5-primary)]">{project.title}</h3><div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-200 pt-5"><div><div className="text-xs text-slate-400">Công suất</div><strong>{project.capacity}</strong></div><div><div className="text-xs text-slate-400">Tiết kiệm</div><strong>{project.saving}</strong></div></div></div>
            </Link>)}
          </div>
        </div>
      </section>

      <section className="t5-section bg-[var(--t5-primary)] text-white">
        <div className="t5-container">
          <span className="t5-eyebrow !text-[var(--t5-accent)]">Quy trình triển khai</span>
          <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-.04em] sm:text-5xl">Mỗi bước đều có đầu ra để chủ đầu tư kiểm soát.</h2>
          <div className="mt-12 grid gap-px bg-white/15 lg:grid-cols-5">
            {processSteps.map(([no,title,desc,output]) => <article key={no} className="bg-[var(--t5-primary)] p-6"><div className="text-sm font-black text-[var(--t5-accent)]">{no}</div><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-white/60">{desc}</p><div className="mt-6 border-t border-white/10 pt-4 text-xs font-bold leading-5 text-white/85">{output}</div></article>)}
          </div>
        </div>
      </section>

      <section className="t5-section bg-slate-50">
        <div className="t5-container">
          <span className="t5-eyebrow">Mô hình đầu tư</span><h2 className="t5-heading">Chọn cấu trúc tài chính phù hợp dòng tiền.</h2>
          <div className="mt-10 overflow-x-auto border border-slate-200 bg-white"><table className="min-w-[760px] w-full text-left text-sm"><thead className="bg-slate-100 text-[var(--t5-primary)]"><tr>{["Mô hình","Sở hữu","CAPEX ban đầu","Lợi ích chính","Phù hợp"].map((h) => <th key={h} className="p-4 font-black">{h}</th>)}</tr></thead><tbody>{investmentModels.map((row) => <tr key={row[0]} className="border-t border-slate-200">{row.map((cell,index) => <td key={cell} className={`p-4 ${index===0?"font-black text-[var(--t5-primary)]":"text-slate-600"}`}>{cell}</td>)}</tr>)}</tbody></table></div>
          <p className="mt-3 text-xs text-slate-500">PPA/thuê mái phụ thuộc đối tác tài chính, pháp lý và điều kiện dự án. [CẦN XÁC MINH]</p>
        </div>
      </section>

      <section className="t5-section">
        <div className="t5-container grid gap-12 lg:grid-cols-2">
          <div><span className="t5-eyebrow">Bảo hành tách bạch</span><h2 className="t5-heading">Biết rõ ai chịu trách nhiệm cho từng phần.</h2><p className="t5-subheading">Không gộp “bảo hành 25 năm” thành một câu quảng cáo. Mỗi hạng mục có thời hạn, điều kiện và đơn vị chịu trách nhiệm khác nhau.</p></div>
          <div className="border border-slate-200">{warranties.map(([item,period,note]) => <div key={item} className="grid grid-cols-[1fr_1fr] gap-4 border-b border-slate-200 p-5 last:border-0"><div><div className="font-black text-[var(--t5-primary)]">{item}</div><div className="mt-1 text-xs text-slate-500">{note}</div></div><div className="text-right text-sm font-bold">{period}</div></div>)}</div>
        </div>
      </section>

      <section className="t5-section bg-amber-50">
        <div className="t5-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div><span className="t5-eyebrow">Chính sách mái nhà</span><h2 className="t5-heading">Tóm tắt để ra quyết định, không thay thế tư vấn pháp lý.</h2></div>
          <div className="grid gap-3">{POLICY_SUMMARY.map((item) => <div key={item} className="flex gap-3 border-b border-amber-200 py-4"><CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><p className="text-sm leading-7 text-slate-700">{item}</p></div>)}</div>
        </div>
      </section>

      <section className="t5-section">
        <div className="t5-container">
          <span className="t5-eyebrow">Khách hàng nói gì</span><h2 className="t5-heading">Niềm tin đến từ cách dự án được triển khai.</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">{TESTIMONIALS.map((item) => <blockquote key={item.company} className="border border-slate-200 p-7"><div className="text-sm font-black text-amber-600">{item.rating}</div><p className="mt-6 text-xl font-bold leading-8 text-[var(--t5-primary)]">“{item.text}”</p><footer className="mt-6 border-t border-slate-200 pt-4 text-sm"><strong>{item.person}</strong><div className="text-slate-500">{item.company}</div></footer></blockquote>)}</div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-10">
        <div className="t5-container">
          <div className="text-center text-xs font-black uppercase tracking-[.2em] text-slate-400">Thiết bị có trong catalog demo</div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">{partnerBrands.map((brand) => <Link href={`/product?brand=${encodeURIComponent(brand)}`} key={brand} className="text-lg font-black tracking-tight text-slate-500 hover:text-[var(--t5-primary)]">{brand}</Link>)}</div>
        </div>
      </section>

      <section className="t5-section">
        <div className="t5-container grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div><span className="t5-eyebrow">FAQ</span><h2 className="t5-heading">Những câu hỏi cần rõ trước khi ký hợp đồng.</h2></div>
          <div className="divide-y divide-slate-200 border-y border-slate-200">{FAQS.map(([q,a]) => <details key={q} className="group py-5"><summary className="cursor-pointer list-none pr-8 font-black text-[var(--t5-primary)]">{q}<span className="float-right text-slate-400 group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{a}</p></details>)}</div>
        </div>
      </section>

      <section className="t5-section bg-slate-950 text-white">
        <div className="t5-container grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div><div className="flex h-12 w-12 items-center justify-center bg-[var(--t5-accent)] text-[var(--t5-primary)]"><ShieldCheckIcon className="h-7 w-7" /></div><h2 className="mt-6 text-4xl font-black tracking-[-.04em]">Nhận phương án sơ bộ cho công trình của bạn.</h2><p className="mt-5 text-white/60">Gửi hóa đơn điện, loại mái và nhu cầu vận hành. Đội dự án sẽ chuẩn bị cấu hình để buổi khảo sát đi thẳng vào số liệu.</p></div>
          <div className="bg-white p-6 text-slate-900 md:p-8"><LeadForm source="home-bottom" /></div>
        </div>
      </section>
    </main>
  );
}