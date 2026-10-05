import Image from "next/image";
import Link from "next/link";
import { delay } from "@/utils/reveal";
import { ArrowRightIcon, BuildingOffice2Icon, BuildingStorefrontIcon, CheckIcon, HomeModernIcon } from "@heroicons/react/24/outline";

const segments = [
  {
    id: "nha-may",
    no: "01",
    Icon: BuildingOffice2Icon,
    tag: "Nhà máy & nhà xưởng",
    title: "Cắt giảm chi phí điện sản xuất ngay trong giờ cao điểm ban ngày.",
    desc: "Dây chuyền, máy nén, tải lạnh chạy chủ yếu ban ngày — trùng với khung giờ hệ solar phát mạnh nhất. Mái nhà xưởng diện tích lớn trở thành nhà máy điện riêng, giảm phụ thuộc vào điện lưới.",
    image: "/images/illustrations/factory-solar.webp",
    cover: "/images/illustrations/factory-solar-tall.webp",
    alt: "Minh họa nhà máy với hệ thống điện mặt trời áp mái",
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
    image: "/images/illustrations/shop-solar.webp",
    cover: "/images/illustrations/shop-solar-tall.webp",
    alt: "Minh họa cửa hàng tiện lợi có tấm pin mặt trời trên mái",
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
    image: "/images/illustrations/home-solar.webp",
    cover: "/images/illustrations/home-solar-tall.webp",
    alt: "Minh họa nhà ở có pin mặt trời, pin lưu trữ và trạm sạc xe điện",
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
    <>
      <section id="tiet-kiem" className="t8-screen t5-section relative overflow-hidden bg-[var(--t8-beige)]">
        <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(255_214_102_/_.4),transparent_65%)]" />
        <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(47_111_228_/_.16),transparent_65%)]" />
        <div className="t5-container relative">
          <div className="mx-auto max-w-3xl text-center">
            <span data-reveal="down" className="t5-eyebrow">Lợi ích theo từng công trình</span>
            <h2 data-reveal="up" style={delay(0.1)} className="t5-heading mx-auto">Mỗi mái nhà một bài toán tiết kiệm riêng.</h2>
            <p data-reveal="up" style={delay(0.2)} className="t5-subheading mx-auto">Cùng là điện mặt trời, nhưng nhà máy, cửa hàng và gia đình có giờ dùng điện, giá điện và mục tiêu khác nhau.</p>
          </div>
          <div data-reveal-stagger="up" data-reveal-step="0.15" className="mt-12 grid gap-5 md:grid-cols-3">
            {segments.map(({ id, no, tag, Icon, image, alt, metrics }) => (
              <a key={id} href={`#${id}`} className="group relative block overflow-hidden rounded-[32px] border-[5px] border-white/80 shadow-[0_30px_60px_-35px_rgb(11_31_58_/_.55)] transition hover:-translate-y-1.5">
                <div className="relative aspect-[4/5] md:aspect-[3/4] lg:aspect-[10/9]">
                  <Image src={image} alt={alt} fill className="object-cover transition duration-700 group-hover:scale-[1.05]" sizes="(max-width:768px) 100vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgb(11_31_58_/_.85)] via-[rgb(11_31_58_/_.15)] to-transparent" />
                </div>
                <span className="t8-glass absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-2xl text-[var(--t5-primary)]"><Icon className="h-5 w-5" /></span>
                <span className="absolute right-5 top-5 text-sm font-black text-white/80">{no}</span>
                <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-white/20 bg-white/10 p-5 text-white backdrop-blur-xl">
                  <div className="text-lg font-black">{tag}</div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/65">Tiết kiệm đến</div><div className="text-3xl font-black text-[var(--t8-sun)]">{metrics[0][0]}</div></div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--t5-primary)] transition group-hover:translate-x-1"><ArrowRightIcon className="h-4 w-4" /></span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {segments.map((s, index) => {
        const flip = index % 2 === 1;
        const imageSide = flip ? "right" : "left";
        const textSide = flip ? "left" : "right";
        return (
          <section key={s.id} id={s.id} className={`t8-screen relative ${flip ? "bg-gradient-to-br from-white via-[#f3f7ff] to-[var(--t8-sky)]" : "bg-gradient-to-br from-[var(--t8-beige)] via-white to-[var(--t8-beige)]"}`}>
            <div className="grid flex-1 lg:grid-cols-2">
              {/* Full-bleed illustration half */}
              <div data-reveal={imageSide} className={`relative min-h-[52vh] overflow-hidden lg:min-h-0 ${flip ? "lg:order-2" : ""}`}>
                <Image src={s.cover} alt={s.alt} fill className="object-cover object-bottom transition duration-700 hover:scale-[1.03]" sizes="(max-width:1024px) 100vw, 50vw" />
                <div className={`absolute inset-0 ${flip ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-transparent via-transparent to-[rgb(248_242_231_/_.35)]`} />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[rgb(11_31_58_/_.45)] to-transparent" />
                <div data-reveal="down" style={delay(0.35)} className={`t8-glass t8-float absolute top-6 flex items-center gap-3 rounded-2xl px-4 py-3 sm:top-10 ${flip ? "left-4 sm:left-10" : "right-4 sm:right-10"}`}>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--t5-accent)] text-[var(--t8-ink)]"><s.Icon className="h-5 w-5" /></span>
                  <div><div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Tiết kiệm đến</div><div className="text-xl font-black text-[var(--t5-primary)]">{s.metrics[0][0]}</div></div>
                </div>
                <div data-reveal="up" style={delay(0.45)} className={`t8-glass-dark absolute bottom-6 rounded-2xl px-4 py-3 text-white sm:bottom-10 ${flip ? "right-4 sm:right-10" : "left-4 sm:left-10"}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-white/75">{s.float.label}</div>
                  <div className="text-lg font-black">{s.float.value}</div>
                </div>
              </div>

              {/* Copy half */}
              <div className={`relative flex items-center px-4 py-16 sm:px-10 lg:py-20 xl:px-20 ${flip ? "lg:justify-end" : ""}`}>
                <div aria-hidden className={`pointer-events-none absolute top-1/4 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgb(255_214_102_/_.3),transparent_65%)] ${flip ? "-left-20" : "-right-20"}`} />
                <div className="relative w-full max-w-[600px]">
                  <div data-reveal="down" className="flex items-center gap-3 text-sm font-black text-[var(--t5-primary)]"><span className="grid h-9 w-9 place-items-center rounded-full bg-white/80 text-xs shadow-sm">{s.no}</span>{s.tag}</div>
                  <h3 data-reveal={textSide} style={delay(0.1)} className="mt-5 text-3xl font-black leading-tight tracking-[-.035em] text-[var(--t8-ink)] sm:text-4xl">{s.title}</h3>
                  <p data-reveal={textSide} style={delay(0.2)} className="mt-5 leading-8 text-slate-600">{s.desc}</p>
                  <ul data-reveal-stagger={textSide} data-reveal-step="0.08" className="mt-6 grid gap-3 sm:grid-cols-2">
                    {s.benefits.map((b) => <li key={b} className="flex gap-3 rounded-2xl bg-white/70 p-3 text-sm font-semibold leading-6 text-slate-700 backdrop-blur"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--t8-blue)] text-white"><CheckIcon className="h-3 w-3" strokeWidth={3} /></span>{b}</li>)}
                  </ul>
                  <dl data-reveal-stagger="up" data-reveal-step="0.1" className="mt-6 grid grid-cols-3 gap-3">
                    {s.metrics.map(([value, label]) => <div key={label} className="rounded-2xl border border-white/80 bg-gradient-to-br from-white/90 to-white/40 p-4 shadow-sm"><dd className="text-lg font-black text-[var(--t5-primary)] sm:text-2xl">{value}</dd><dt className="mt-1 text-xs font-semibold text-slate-500">{label}</dt></div>)}
                  </dl>
                  <Link data-reveal="up" style={delay(0.3)} href={s.href} className="mt-7 inline-flex items-center gap-2 text-sm font-black text-[var(--t5-primary)] hover:gap-3">Xem giải pháp {s.tag.toLowerCase()} <ArrowRightIcon className="h-4 w-4" /></Link>
                  {index === segments.length - 1 && <p className="mt-8 text-xs text-slate-500">*Số liệu tham khảo, phụ thuộc phụ tải, khu vực, giá điện và cấu hình hệ thống. [CẦN XÁC MINH]</p>}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
