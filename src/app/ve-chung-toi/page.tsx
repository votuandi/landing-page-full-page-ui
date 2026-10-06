import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG, yearsOfExperience } from "@/config/site";
import { TEAM } from "@/data/solar";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  `Về ${SITE_CONFIG.brand.name} | Đơn vị lắp đặt điện mặt trời`,
  `Câu chuyện, năng lực, đội ngũ kỹ thuật và hành trình phát triển của ${SITE_CONFIG.brand.name}.`,
  "/ve-chung-toi",
  "/images/our_story.webp"
);

const founded = SITE_CONFIG.brand.foundedYear;
/** Mốc phát triển — năm tính từ brand.foundedYear, mốc cuối luôn là "Hiện nay". [DỮ LIỆU MẪU] */
const timeline = [
  [String(founded), "Thành lập", "Bắt đầu từ khảo sát và lắp đặt điện mặt trời cho hộ gia đình."],
  [String(founded + 3), "Mở rộng cửa hàng & SME", "Chuẩn hóa quy trình khảo sát mái, mô phỏng sản lượng và thi công nhanh."],
  [String(founded + 7), "Nhà xưởng & trang trại", "Triển khai các hệ hàng trăm kWp, thành lập đội bảo trì riêng."],
  ["Hiện nay", `${String(SITE_CONFIG.capabilities.mwp).replace(".", ",")} MWp`, "Phục vụ gia đình, chuỗi cửa hàng và nhà máy với nhiều hình thức đầu tư."],
];

const certificates = [
  "Chứng chỉ an toàn điện: [PLACEHOLDER – CẦN XÁC MINH]",
  "Chứng nhận đào tạo inverter: [PLACEHOLDER – CẦN XÁC MINH]",
  "Hồ sơ năng lực PCCC/thi công liên quan: [PLACEHOLDER – CẦN XÁC MINH]",
];

export default function AboutPage() {
  const c = SITE_CONFIG.capabilities;
  const stats = [[`${yearsOfExperience()}+`, "năm kinh nghiệm"], [`${c.projects}+`, "công trình"], [`${String(c.mwp).replace(".", ",")} MWp`, "đã lắp đặt"], [`${c.technicians}`, "kỹ thuật viên"]];
  return <main>
    <section className="t5-page-hero t12-invert">
      <div className="t5-container grid gap-10 lg:grid-cols-[1fr_.8fr]">
        <div>
          <span className="t5-eyebrow">Về chúng tôi</span>
          <h1 className="t5-page-title">Lắp điện mặt trời bằng năng lực kỹ thuật và trách nhiệm sau bàn giao.</h1>
          <p className="t5-page-desc">{SITE_CONFIG.brand.name} đồng hành cùng gia đình, cửa hàng và nhà xưởng từ khảo sát, thiết kế, thi công tới bảo trì — số liệu minh bạch ở từng bước.</p>
          <Link href="/#du-toan" className="t5-button t5-button-primary mt-8">Dự toán chi phí lắp đặt</Link>
        </div>
        <div className="relative min-h-80 overflow-hidden rounded-[32px] border-[5px] border-glass-tint/15"><Image src="/images/our_story.webp" alt="Đội ngũ kỹ sư khảo sát công trình điện mặt trời" fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 40vw" /></div>
      </div>
    </section>
    <section className="t5-section">
      <div className="t5-container grid gap-12 lg:grid-cols-2">
        <div><span className="t5-eyebrow">Câu chuyện</span><h2 className="t5-heading">Không bắt đầu bằng số tấm pin. Bắt đầu bằng hóa đơn điện của bạn.</h2><p className="t5-subheading">Chúng tôi tìm hiểu giờ dùng điện, kết cấu mái và mục tiêu tài chính trước khi chọn thiết bị, để bạn thấy rõ cả tiền tiết kiệm lẫn trách nhiệm kỹ thuật sau bàn giao.</p></div>
        <div className="grid grid-cols-2 gap-4">{stats.map(([v, l]) => <div key={l} className="t8-card p-6"><div className="text-3xl font-black text-accent">{v}</div><div className="mt-1 text-sm text-fg-muted">{l}</div></div>)}</div>
      </div>
    </section>
    <section className="t5-section bg-bg-elevated">
      <div className="t5-container"><span className="t5-eyebrow">Chứng chỉ & giấy phép</span><h2 className="t5-heading">Năng lực được chứng minh bằng hồ sơ.</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">{certificates.map((item) => <div key={item} className="t8-card p-6"><div className="text-sm font-black leading-6 text-fg">{item}</div></div>)}</div>
      </div>
    </section>
    <section className="t5-section">
      <div className="t5-container"><span className="t5-eyebrow">Đội ngũ</span><h2 className="t5-heading">Người chịu trách nhiệm luôn hiện diện rõ.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">{TEAM.map((member) => <article key={member.name} className="t8-card overflow-hidden"><div className="relative aspect-[4/3]"><Image src={member.image} alt={member.name} fill loading="lazy" className="object-cover" sizes="(max-width:768px) 100vw, 33vw" /></div><div className="p-5"><h3 className="text-lg font-black text-fg">{member.name}</h3><p className="mt-1 text-sm text-fg-muted">{member.role}</p></div></article>)}</div>
      </div>
    </section>
    <section className="t5-section t12-invert bg-gradient-to-br from-bg-deep to-primary-deep text-fg">
      <div className="t5-container"><span className="t5-eyebrow">Hành trình</span>
        <div className="mt-8 grid gap-px overflow-hidden rounded-[28px] bg-line/15 md:grid-cols-4">{timeline.map(([year, title, desc]) => <article key={year} className="bg-bg-deep p-6"><div className="text-2xl font-black text-accent">{year}</div><h3 className="mt-7 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-fg-muted">{desc}</p></article>)}</div>
      </div>
    </section>
  </main>;
}
