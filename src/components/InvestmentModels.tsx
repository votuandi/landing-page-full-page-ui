import Link from "next/link";
import { ArrowRightIcon, BanknotesIcon, BuildingLibraryIcon, CalendarDaysIcon, KeyIcon } from "@heroicons/react/24/outline";
import { delay } from "@/utils/reveal";

/** Nội dung 4 hình thức đầu tư. [DỮ LIỆU MẪU] — điều kiện thực tế phụ thuộc đối tác tài chính. */
const MODELS = [
  { Icon: BanknotesIcon, name: "Mua đứt", tag: "Hiệu quả cao nhất", for: "Gia đình, cửa hàng, doanh nghiệp có sẵn ngân sách",
    benefits: ["Sở hữu hệ thống ngay", "Toàn bộ tiền tiết kiệm thuộc về bạn", "Hoàn vốn nhanh nhất"], cta: "Dự toán chi phí", href: "/#du-toan" },
  { Icon: CalendarDaysIcon, name: "Trả góp", tag: "Từ 0% lãi suất*", for: "Muốn lắp ngay, chia nhỏ chi phí",
    benefits: ["Trả trước từ 20–30%", "Kỳ hạn 6–36 tháng qua đối tác", "Tiền tiết kiệm bù phần lớn tiền góp"], cta: "Hỏi gói trả góp", href: "/lien-he" },
  { Icon: KeyIcon, name: "Thuê hệ thống", tag: "Không lo bảo trì", for: "Cửa hàng, chuỗi, nhà xưởng vừa",
    benefits: ["Phí thuê cố định hằng tháng", "Bảo trì, vệ sinh trọn gói", "Có quyền mua lại hệ thống"], cta: "Nhận báo giá thuê", href: "/lien-he" },
  { Icon: BuildingLibraryIcon, name: "Lắp đặt 0 đồng (ESCO)", tag: "Cho doanh nghiệp tiền điện lớn", for: "Nhà máy, trang trại tiền điện từ ~300 triệu/tháng",
    benefits: ["Nhà đầu tư bỏ 100% vốn", "Mua điện mặt trời giá thấp hơn EVN", "Nhận chuyển giao hệ thống cuối hợp đồng"], cta: "Đánh giá miễn phí", href: "/lien-he" },
];

export default function InvestmentModels() {
  return (
    <section id="hinh-thuc-dau-tu" className="t15-section bg-gradient-to-b from-bg to-bg-elevated" aria-labelledby="dau-tu-title">
      <div className="t15-container">
        <span data-reveal="down" className="t15-eyebrow">Hình thức đầu tư</span>
        <h2 id="dau-tu-title" data-reveal="left" className="t15-heading">Có tiền mặt hay không, đều lắp được điện mặt trời.</h2>
        <div data-reveal-stagger="up" data-reveal-step="0.12" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODELS.map(({ Icon, ...m }, i) => (
            <article key={m.name} className={`t15-card group flex flex-col p-6 transition hover:-translate-y-1.5 ${i === 3 ? "bg-gradient-to-br from-primary-deep/80 to-bg-elevated/80" : ""}`}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-on-accent"><Icon className="h-6 w-6" /></span>
              <h3 className="mt-5 text-xl font-black text-fg">{m.name}</h3>
              <div className="mt-1 text-sm font-bold text-accent-ink">{m.tag}</div>
              <p className="mt-3 text-sm text-fg-muted">{m.for}</p>
              <ul className="mt-4 grid gap-2 text-sm text-fg">
                {m.benefits.map((b) => <li key={b} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{b}</li>)}
              </ul>
              <Link href={m.href} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-black text-primary transition-[gap] group-hover:gap-3">{m.cta}<ArrowRightIcon className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>
        <p data-reveal="up" style={delay(0.2)} className="mt-4 text-xs text-fg-subtle">* Lãi suất, kỳ hạn và điều kiện ESCO/thuê phụ thuộc đối tác tài chính và thẩm định dự án. [CẦN XÁC MINH]</p>
      </div>
    </section>
  );
}
