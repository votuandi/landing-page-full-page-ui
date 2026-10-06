import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG, yearsOfExperience } from "@/config/site";
import { TEAM } from "@/data/team";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  `Về ${SITE_CONFIG.brand.name} | Năng lực lắp đặt & bảo hành`,
  `Câu chuyện, đội ngũ, chính sách bảo hành và năng lực lắp đặt điện mặt trời của ${SITE_CONFIG.brand.name}.`,
  "/ve-chung-toi",
  "/images/our_story.webp"
);

const founded = SITE_CONFIG.brand.foundedYear;
const timeline = [
  [founded, "Thành lập", "Bắt đầu từ đội kỹ thuật lắp đặt điện mặt trời cho nhà ở."],
  [founded + 3, "Mở rộng cửa hàng & nhà xưởng", "Chuẩn hóa quy trình khảo sát mái, thi công không gián đoạn kinh doanh."],
  [founded + 7, "Phân phối thiết bị", "Cung cấp tấm pin, inverter, pin lưu trữ và đèn năng lượng mặt trời chính hãng."],
  [new Date().getFullYear(), `${String(SITE_CONFIG.capabilities.mwp).replace(".", ",")} MWp`, "Hơn " + new Intl.NumberFormat("vi-VN").format(SITE_CONFIG.capabilities.customers) + " khách hàng tin dùng."],
] as const;

/** Bảo hành tách bạch theo hạng mục (chuyển từ trang chủ template-8). [CẦN XÁC MINH theo hợp đồng thực tế] */
const warranties = [
  ["Tấm pin", "12–15 năm sản phẩm", "25–30 năm hiệu suất*"],
  ["Inverter", "5–10 năm", "Theo chính sách hãng*"],
  ["Pin lưu trữ", "10 năm*", "Theo điều kiện chu kỳ / dung lượng"],
  ["Đèn năng lượng mặt trời", "1–3 năm", "Theo từng dòng sản phẩm*"],
  ["Thi công & chống dột", "5 năm", "Ghi rõ phạm vi trong hợp đồng"],
] as const;

export default function AboutPage() {
  return <main>
    <section className="t5-page-hero">
      <div className="t5-container grid gap-10 lg:grid-cols-[1fr_.8fr]">
        <div>
          <span className="t5-eyebrow !border-on-media/20 !bg-on-media/10 !text-highlight">Về chúng tôi</span>
          <h1 className="t5-page-title">{yearsOfExperience()} năm mang điện mặt trời đến từng mái nhà.</h1>
          <p className="t5-page-desc">{SITE_CONFIG.brand.name} là thương hiệu mẫu của website demo. Câu chuyện, con người và số liệu bên dưới nằm trong file cấu hình để thay bằng thông tin công ty thật.</p>
          <Link href="/lien-he" className="t5-button t5-button-accent mt-8">Đặt lịch khảo sát miễn phí</Link>
        </div>
        <div className="relative min-h-80 overflow-hidden rounded-[32px]"><Image src="/images/our_story.webp" alt="Đội ngũ kỹ sư khảo sát công trình điện mặt trời" fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 40vw" /></div>
      </div>
    </section>

    <section className="t5-section">
      <div className="t5-container grid gap-12 lg:grid-cols-2">
        <div>
          <span className="t5-eyebrow">Câu chuyện</span>
          <h2 className="t5-heading">Không bắt đầu bằng số tấm pin. Bắt đầu bằng hóa đơn điện của bạn.</h2>
          <p className="t5-subheading">Mỗi công trình bắt đầu từ việc đọc hóa đơn, đo mái và hiểu giờ dùng điện. Nhờ vậy khách biết trước tiết kiệm bao nhiêu, bao lâu hoàn vốn — và ai chịu trách nhiệm sau khi bàn giao.</p>
        </div>
        <div className="t8-card overflow-hidden" id="bao-hanh">
          <div className="border-b border-line/12 p-5 text-sm font-black uppercase tracking-[.14em] text-primary-strong">Bảo hành tách bạch theo hạng mục</div>
          {warranties.map(([item, period, note]) => (
            <div key={item} className="grid grid-cols-2 gap-4 border-b border-line/12 p-5 last:border-0">
              <div><div className="font-black text-fg">{item}</div><div className="mt-1 text-xs text-fg-muted">{note}</div></div>
              <div className="text-right text-sm font-bold text-fg">{period}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="t5-section bg-bg-tint">
      <div className="t5-container">
        <span className="t5-eyebrow">Đội ngũ</span>
        <h2 className="t5-heading">Người chịu trách nhiệm công trình của bạn.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {TEAM.map((member) => (
            <article key={member.name} className="t8-card overflow-hidden">
              <div className="relative aspect-[4/3]"><Image src={member.image} alt={member.name} fill className="object-cover" sizes="(max-width:768px) 100vw, 33vw" /></div>
              <div className="p-5"><h3 className="text-lg font-black text-fg">{member.name}</h3><p className="mt-1 text-sm text-fg-muted">{member.role}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="t13-invert t5-section bg-bg-deep">
      <div className="t5-container">
        <span className="t5-eyebrow !border-on-media/20 !bg-on-media/10 !text-highlight">Hành trình</span>
        <div className="mt-8 grid gap-px bg-on-media/15 md:grid-cols-4">
          {timeline.map(([year, title, desc]) => (
            <article key={title} className="bg-bg-deep p-6">
              <div className="text-2xl font-black text-highlight">{year}</div>
              <h3 className="mt-7 text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-fg-muted">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </main>;
}
