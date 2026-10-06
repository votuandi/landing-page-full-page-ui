import Image from "next/image";
import Link from "next/link";
import { SERVICES } from "@/data/solar";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Giải pháp solar nhà xưởng, gia đình, hybrid & O&M",
  "Giải pháp điện mặt trời theo từng bài toán: C&I, hộ tiêu thụ cao, hybrid lưu trữ và O&M định kỳ.",
  "/giai-phap",
  "/images/solar-installation-hero.jpg"
);

export default function ServicePage() {
  return <main>
    <section className="t5-page-hero t12-invert"><div className="t5-container"><span className="t5-eyebrow">Giải pháp kỹ thuật</span><h1 className="t5-page-title">Mỗi công trình một giải pháp riêng.</h1><p className="t5-page-desc">Mỗi dịch vụ bắt đầu từ vấn đề vận hành, đi qua dữ liệu và kết thúc bằng đầu ra kỹ thuật rõ ràng.</p></div></section>
    <section className="t5-section"><div className="t5-container grid gap-5 md:grid-cols-2">
      {SERVICES.map((service) => <Link key={service.slug} href={`/giai-phap/${service.slug}`} className="t8-card group grid overflow-hidden transition hover:-translate-y-1.5 sm:grid-cols-[.85fr_1.15fr]"><div className="relative min-h-64 overflow-hidden"><Image src={service.image} alt={service.title} fill loading="lazy" sizes="(max-width:768px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" /></div><div className="p-6"><div className="text-xs font-black uppercase tracking-[.15em] text-fg-subtle">{service.audience}</div><h2 className="mt-3 text-2xl font-black text-primary">{service.title}</h2><p className="mt-4 text-sm leading-7 text-fg-muted">{service.solution}</p><div className="mt-6 font-black text-primary">{service.price}</div><div className="mt-6 text-sm font-black">Xem quy trình & gói tham khảo →</div></div></Link>)}
    </div></section>
  </main>;
}