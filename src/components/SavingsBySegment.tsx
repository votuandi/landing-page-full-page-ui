import Image from "next/image";
import { delay } from "@/utils/reveal";
import { ArrowRightIcon, BuildingOffice2Icon, BuildingStorefrontIcon, HomeModernIcon } from "@heroicons/react/24/outline";
import type { Segment } from "@/config/solar";
import OpenPackagesButton from "@/components/OpenPackagesButton";

/** Số liệu tham khảo hiển thị trên thẻ. [CẦN XÁC MINH] theo dữ liệu công trình thực tế của công ty. */
const segments: { id: Segment; no: string; Icon: typeof HomeModernIcon; tag: string; image: string; alt: string; saving: string }[] = [
  { id: "household", no: "01", Icon: HomeModernIcon, tag: "Hộ gia đình", image: "/images/illustrations/home-solar.webp", alt: "Minh họa nhà ở có pin mặt trời, pin lưu trữ và trạm sạc xe điện", saving: "50–90%" },
  { id: "shop", no: "02", Icon: BuildingStorefrontIcon, tag: "Cửa hàng & chuỗi", image: "/images/illustrations/shop-solar.webp", alt: "Minh họa cửa hàng tiện lợi có tấm pin mặt trời trên mái", saving: "30–50%" },
  { id: "factory", no: "03", Icon: BuildingOffice2Icon, tag: "Nhà xưởng & trang trại", image: "/images/illustrations/factory-solar.webp", alt: "Minh họa nhà máy với hệ thống điện mặt trời áp mái", saving: "25–40%" },
];

export default function SavingsBySegment() {
  return (
    <section id="tiet-kiem" className="t5-section relative overflow-hidden bg-bg">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.4),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-primary)/.16),transparent_65%)]" />
      <div className="t5-container relative">
        <div className="mx-auto max-w-3xl text-center">
          <span data-reveal="down" className="t5-eyebrow">Lợi ích theo từng công trình</span>
          <h2 data-reveal="up" style={delay(0.1)} className="t5-heading mx-auto">Mỗi mái nhà một bài toán tiết kiệm riêng.</h2>
          <p data-reveal="up" style={delay(0.2)} className="t5-subheading mx-auto">Gia đình, cửa hàng và nhà xưởng có giờ dùng điện, giá điện và mục tiêu khác nhau. Chọn công trình của bạn để xem gói phù hợp.</p>
        </div>
        <div data-reveal-stagger="up" data-reveal-step="0.15" className="mt-12 grid gap-5 md:grid-cols-3">
          {segments.map(({ id, no, tag, Icon, image, alt, saving }) => (
            <OpenPackagesButton key={id} segment={id} className="group relative block overflow-hidden rounded-[32px] border-[5px] border-glass-border text-left shadow-[0_30px_60px_-35px_rgb(var(--c-shadow)/.55)] transition hover:-translate-y-1.5">
              <div className="relative aspect-[4/3] md:aspect-[3/4] lg:aspect-[10/9]">
                <Image src={image} alt={alt} fill loading="lazy" className="object-cover transition duration-700 group-hover:scale-[1.05]" sizes="(max-width:768px) 100vw, 33vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/15 to-transparent" />
              </div>
              <span className="t8-glass absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-2xl text-on-media"><Icon className="h-5 w-5" /></span>
              <span className="absolute right-5 top-5 text-sm font-black text-on-media/90">{no}</span>
              <div className="absolute inset-x-4 bottom-4 rounded-3xl border border-on-media/20 bg-on-media/10 p-5 text-on-media backdrop-blur-xl">
                <div className="text-lg font-black">{tag}</div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div><div className="text-[11px] font-semibold uppercase tracking-[.14em] text-on-media/80">Giảm hóa đơn đến</div><div className="text-3xl font-black text-accent">{saving}</div></div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-on-accent transition group-hover:translate-x-1"><ArrowRightIcon className="h-4 w-4" /></span>
                </div>
              </div>
            </OpenPackagesButton>
          ))}
        </div>
      </div>
    </section>
  );
}
