import Image from "next/image";
import Link from "next/link";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG, yearsOfExperience } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { TEAM } from "@/data/solar";
import { pickText } from "@/i18n/text";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  `Về ${SITE_CONFIG.brand.name} | Phân phối thiết bị & tổng thầu EPC điện mặt trời`,
  `Câu chuyện, năng lực, chứng chỉ, đội ngũ kỹ thuật, chính sách bảo hành và hành trình phát triển của ${SITE_CONFIG.brand.name}.`,
  "/ve-chung-toi",
  "/images/our_story.webp"
);

const founded = SITE_CONFIG.brand.foundedYear;
/** Mốc phát triển — năm tính từ brand.foundedYear, mốc cuối luôn là năm hiện tại. [DỮ LIỆU MẪU] */
const timeline = [
  [String(founded), "Thành lập", "Bắt đầu từ đội kỹ thuật lắp đặt điện mặt trời cho hộ gia đình."],
  [String(founded + 3), "Cửa hàng & nhà xưởng", "Chuẩn hóa quy trình khảo sát mái, mô phỏng sản lượng, thi công không gián đoạn kinh doanh."],
  [String(founded + 7), "Phân phối thiết bị", "Nhà phân phối ủy quyền tấm pin, inverter, pin lưu trữ, BESS và đèn năng lượng mặt trời."],
  [String(new Date().getFullYear()), `${String(SITE_CONFIG.capabilities.mwp).replace(".", ",")} MWp`, `${siteConfig.branches.length} chi nhánh, ${siteConfig.stats.dealers}+ đại lý, hơn ${new Intl.NumberFormat("vi-VN").format(SITE_CONFIG.capabilities.customers)} khách hàng.`],
];

/** Bảo hành tách bạch theo hạng mục. [CẦN XÁC MINH theo hợp đồng thực tế] */
const warranties = [
  ["Tấm pin", "12–15 năm sản phẩm", "25–30 năm hiệu suất*"],
  ["Inverter", "5–10 năm", "Theo chính sách hãng*"],
  ["Pin lưu trữ / BESS", "10 năm*", "Theo điều kiện chu kỳ / dung lượng"],
  ["Đèn năng lượng mặt trời", "1–3 năm", "Theo từng dòng sản phẩm*"],
  ["Thi công & chống dột", "5 năm", "Ghi rõ phạm vi trong hợp đồng"],
] as const;

export default function AboutPage() {
  const c = SITE_CONFIG.capabilities;
  const stats = [[`${yearsOfExperience()}+`, "năm kinh nghiệm"], [`${new Intl.NumberFormat("vi-VN").format(c.projects)}+`, "công trình"], [`${String(c.mwp).replace(".", ",")} MWp`, "đã cung cấp & lắp đặt"], [`${c.technicians}+`, "kỹ sư & kỹ thuật viên"]];
  return <main>
    <section className="t15-page-hero">
      <div className="t15-container grid gap-10 lg:grid-cols-[1fr_.8fr]">
        <div>
          <span className="t15-eyebrow">Về chúng tôi</span>
          <h1 className="t15-page-title">{yearsOfExperience()} năm mang <span className="t15-gradient-text">năng lượng xanh</span> đến từng mái nhà.</h1>
          <p className="t15-page-desc">{SITE_CONFIG.brand.name} đồng hành cùng gia đình, cửa hàng, nhà xưởng và trang trại từ khảo sát, thiết kế, cung cấp thiết bị, thi công tới bảo trì — số liệu minh bạch ở từng bước. Thương hiệu và số liệu trong bản demo là mẫu, nằm trong file cấu hình để thay bằng thông tin công ty thật.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/#du-toan" className="t15-button t15-button-accent">Dự toán chi phí lắp đặt</Link>
            <Link href="/lien-he" className="t15-button t15-button-secondary">Đặt lịch khảo sát miễn phí</Link>
          </div>
        </div>
        <div className="relative min-h-80 overflow-hidden rounded-[32px] border-4 border-bg-elevated shadow-xl"><Image src="/images/our_story.webp" alt="Đội ngũ kỹ sư khảo sát công trình điện mặt trời" fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 40vw" /></div>
      </div>
    </section>

    <section className="t15-section">
      <div className="t15-container grid gap-12 lg:grid-cols-2">
        <div>
          <span className="t15-eyebrow">Câu chuyện</span>
          <h2 className="t15-heading">Không bắt đầu bằng số tấm pin. Bắt đầu bằng hóa đơn điện của bạn.</h2>
          <p className="t15-subheading">Mỗi công trình bắt đầu từ việc đọc hóa đơn, đo mái và hiểu giờ dùng điện. Nhờ vậy khách biết trước tiết kiệm bao nhiêu, bao lâu hoàn vốn — và ai chịu trách nhiệm sau khi bàn giao.</p>
          <div className="mt-8 grid grid-cols-2 gap-4">{stats.map(([v, l], i) => <div key={l} className="t15-card p-6"><div className={`text-3xl font-black ${["text-primary", "text-secondary", "text-accent-ink", "text-primary"][i]}`}>{v}</div><div className="mt-1 text-sm text-fg-muted">{l}</div></div>)}</div>
        </div>
        <div className="t15-card h-fit overflow-hidden" id="bao-hanh">
          <div className="border-b border-line/10 bg-bg-tint p-5 text-sm font-black uppercase tracking-[.14em] text-primary">Bảo hành tách bạch theo hạng mục</div>
          {warranties.map(([item, period, note]) => (
            <div key={item} className="grid grid-cols-2 gap-4 border-b border-line/10 p-5 last:border-0">
              <div><div className="font-black text-fg">{item}</div><div className="mt-1 text-xs text-fg-muted">{note}</div></div>
              <div className="text-right text-sm font-bold text-fg">{period}</div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="t15-section bg-bg-elevated">
      <div className="t15-container">
        <span className="t15-eyebrow">Chứng chỉ & giấy phép</span>
        <h2 className="t15-heading">Năng lực được chứng minh bằng hồ sơ.</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.certificates.items.map((cert) => (
            <div key={cert.id} className="t15-card flex gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><ShieldCheckIcon className="h-6 w-6" /></span>
              <div><div className="font-black text-fg">{pickText(cert.title, "vi")}</div><div className="mt-1 text-xs leading-5 text-fg-muted">{cert.issuer} · Số {cert.number} · Hiệu lực đến {cert.validUntil}</div></div>
            </div>
          ))}
        </div>
        <Link href="/#chung-chi" className="mt-6 inline-flex text-sm font-black text-primary hover:underline">Xem ảnh chứng chỉ →</Link>
      </div>
    </section>

    <section className="t15-section bg-bg-tint">
      <div className="t15-container">
        <span className="t15-eyebrow">Đội ngũ</span>
        <h2 className="t15-heading">Người chịu trách nhiệm công trình của bạn.</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {TEAM.map((member) => (
            <article key={member.name} className="t15-card overflow-hidden">
              <div className="relative aspect-[4/3]"><Image src={member.image} alt={member.name} fill loading="lazy" className="object-cover" sizes="(max-width:768px) 100vw, 33vw" /></div>
              <div className="p-5"><h3 className="text-lg font-black text-fg">{member.name}</h3><p className="mt-1 text-sm text-fg-muted">{member.role}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="t15-section t15-invert t15-ocean text-fg">
      <div className="t15-container">
        <span className="t15-eyebrow">Hành trình</span>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {timeline.map(([year, title, desc]) => (
            <article key={year} className="t15-glass-dark rounded-[28px] p-6">
              <div className="text-2xl font-black text-accent-ink">{year}</div>
              <h3 className="mt-7 text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-fg-muted">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  </main>;
}
