import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, BuildingOffice2Icon, BuildingStorefrontIcon, CheckIcon, HomeModernIcon } from "@heroicons/react/24/outline";

const segments = [
  {
    id: "nha-may",
    no: "01",
    Icon: BuildingOffice2Icon,
    tag: "Nhà máy & nhà xưởng",
    title: "Cắt giảm chi phí điện sản xuất ngay trong giờ cao điểm ban ngày.",
    desc: "Dây chuyền, máy nén, tải lạnh chạy chủ yếu ban ngày — trùng với khung giờ hệ solar phát mạnh nhất. Mái nhà xưởng diện tích lớn trở thành nhà máy điện riêng, giảm phụ thuộc vào điện lưới.",
    image: "/images/solar-panels-hero.jpg",
    alt: "Hệ thống điện mặt trời trên mái nhà xưởng",
    href: "/service/solar-nha-xuong",
    benefits: [
      "Tỷ lệ tự dùng 90%+ nhờ phụ tải ổn định ban ngày",
      "Mái chống nóng, giảm 3–5°C nhiệt độ trong xưởng",
      "Đáp ứng tiêu chí xanh / ESG cho đơn hàng xuất khẩu",
      "Khấu hao tài sản, dòng tiền và ROI minh bạch",
    ],
    metrics: [["25–40%", "giảm hóa đơn"], ["4–5 năm", "hoàn vốn"], ["~1,4 tỷ", "tiết kiệm/năm cho 1 MWp"]],
    float: { label: "Công suất điển hình", value: "300 kWp – 2 MWp" },
  },
  {
    id: "cua-hang",
    no: "02",
    Icon: BuildingStorefrontIcon,
    tag: "Cửa hàng & kinh doanh",
    title: "Điều hòa, tủ mát, chiếu sáng — chạy bằng nắng thay vì giá điện kinh doanh.",
    desc: "Giá điện kinh doanh thuộc nhóm cao nhất, nên mỗi kWh solar tự dùng tiết kiệm nhiều hơn. Phù hợp cửa hàng tiện lợi, showroom, nhà hàng, khách sạn mini và văn phòng.",
    image: "/images/solar-installation-hero.jpg",
    alt: "Tấm pin năng lượng mặt trời dưới bầu trời nắng",
    href: "/service/hybrid-luu-tru",
    benefits: [
      "Giờ mở cửa trùng giờ nắng — dùng trực tiếp, ít lãng phí",
      "Hybrid giữ POS, camera, tủ đông hoạt động khi mất điện",
      "Thi công 1–3 ngày, không gián đoạn bán hàng",
      "Hình ảnh thương hiệu xanh với khách hàng",
    ],
    metrics: [["30–50%", "giảm hóa đơn"], ["4–6 năm", "hoàn vốn"], ["10–50 kWp", "quy mô phổ biến"]],
    float: { label: "Tiết kiệm mỗi kWh", value: "~3.150 ₫*" },
  },
  {
    id: "ho-gia-dinh",
    no: "03",
    Icon: HomeModernIcon,
    tag: "Hộ gia đình",
    title: "Thoát bậc thang giá điện cao, có điện cả buổi tối với pin lưu trữ.",
    desc: "Điều hòa, bình nóng lạnh, bơm nước, xe điện đẩy hóa đơn lên bậc 5–6. Hệ hòa lưới hoặc hybrid giúp cắt phần tiêu thụ đắt nhất và theo dõi mọi thứ trên điện thoại.",
    image: "/images/banner_1773114021067.webp",
    alt: "Kỹ thuật viên lắp tấm pin trên mái ngói nhà ở",
    href: "/service/solar-gia-dinh",
    benefits: [
      "Giảm phần điện tiêu thụ ở bậc giá cao nhất",
      "Pin lưu trữ dùng buổi tối và dự phòng khi mất điện",
      "Theo dõi sản lượng, tiêu thụ trên ứng dụng 24/7",
      "Mái mát hơn, tăng giá trị bất động sản",
    ],
    metrics: [["50–90%", "giảm hóa đơn"], ["5–7 năm", "hoàn vốn"], ["5–15 kWp", "quy mô phổ biến"]],
    float: { label: "Hệ 10 kWp tạo ra", value: "~1.200 kWh/tháng" },
  },
] as const;

export default function SavingsBySegment() {
  return (
    <section id="tiet-kiem" className="relative overflow-hidden bg-[var(--t8-beige)] py-16 md:py-24">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(255_214_102_/_.35),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(47_111_228_/_.15),transparent_65%)]" />
      <div className="t5-container relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="t5-eyebrow">Lợi ích theo từng công trình</span>
          <h2 className="t5-heading mx-auto">Mỗi mái nhà một bài toán tiết kiệm riêng.</h2>
          <p className="t5-subheading mx-auto">Cùng là điện mặt trời, nhưng nhà máy, cửa hàng và gia đình có giờ dùng điện, giá điện và mục tiêu khác nhau.</p>
          <nav aria-label="Chọn loại công trình" className="t8-glass mx-auto mt-8 inline-flex flex-wrap justify-center gap-1 rounded-[28px] p-1.5 sm:rounded-full">
            {segments.map(({ id, tag, Icon }) => <a key={id} href={`#${id}`} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-[var(--t8-ink)]"><Icon className="h-4 w-4" />{tag}</a>)}
          </nav>
        </div>

        <div className="mt-14 space-y-16 md:space-y-24">
          {segments.map((s, index) => (
            <article key={s.id} id={s.id} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className={`relative ${index % 2 ? "lg:order-2" : ""}`}>
                <div className="relative aspect-[5/4] overflow-hidden rounded-[36px] border-[6px] border-white/80 shadow-[0_40px_80px_-40px_rgb(11_31_58_/_.5)]">
                  <Image src={s.image} alt={s.alt} fill className="object-cover transition duration-700 hover:scale-[1.04]" sizes="(max-width:1024px) 100vw, 50vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgb(11_31_58_/_.50)] via-transparent to-transparent" />
                  <div className="t8-glass-dark absolute bottom-5 left-5 rounded-2xl px-4 py-3 text-white">
                    <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/70">{s.float.label}</div>
                    <div className="text-lg font-black">{s.float.value}</div>
                  </div>
                </div>
                <div className={`t8-glass t8-float absolute -top-5 flex items-center gap-3 rounded-2xl px-4 py-3 ${index % 2 ? "-left-2 sm:-left-5" : "-right-2 sm:-right-5"}`}>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--t5-accent)] text-[var(--t8-ink)]"><s.Icon className="h-5 w-5" /></span>
                  <div><div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Tiết kiệm đến</div><div className="text-xl font-black text-[var(--t5-primary)]">{s.metrics[0][0]}</div></div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-3 text-sm font-black text-[var(--t5-primary)]"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-xs shadow-sm">{s.no}</span>{s.tag}</div>
                <h3 className="mt-5 text-3xl font-black leading-tight tracking-[-.035em] text-[var(--t8-ink)] sm:text-4xl">{s.title}</h3>
                <p className="mt-5 leading-8 text-slate-600">{s.desc}</p>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {s.benefits.map((b) => <li key={b} className="flex gap-3 rounded-2xl bg-white/60 p-3 text-sm font-semibold leading-6 text-slate-700 backdrop-blur"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--t8-blue)] text-white"><CheckIcon className="h-3 w-3" strokeWidth={3} /></span>{b}</li>)}
                </ul>
                <dl className="mt-6 grid grid-cols-3 gap-3">
                  {s.metrics.map(([value, label]) => <div key={label} className="rounded-2xl border border-white/80 bg-gradient-to-br from-white/90 to-white/40 p-4 shadow-sm"><dd className="text-lg font-black text-[var(--t5-primary)] sm:text-2xl">{value}</dd><dt className="mt-1 text-xs font-semibold text-slate-500">{label}</dt></div>)}
                </dl>
                <Link href={s.href} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[var(--t5-primary)] hover:gap-3">Xem giải pháp {s.tag.toLowerCase()} <ArrowRightIcon className="h-4 w-4" /></Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-slate-500">*Số liệu tham khảo, phụ thuộc phụ tải, khu vực, giá điện và cấu hình hệ thống. [CẦN XÁC MINH]</p>
      </div>
    </section>
  );
}
