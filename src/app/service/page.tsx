import Image from "next/image";
import Link from "next/link";
import { SERVICES } from "@/data/solar";
import { makeMetadata } from "@/utils/solar";

export const metadata = makeMetadata(
  "Giải pháp điện mặt trời nhà xưởng, gia đình, hybrid & O&M",
  "Giải pháp điện mặt trời theo từng bài toán: C&I, hộ tiêu thụ cao, hệ hybrid & lưu trữ và O&M định kỳ.",
  "/service",
  "/images/solar-installation-hero.jpg"
);

export default function ServicePage() {
  return <main>
    <section className="t5-page-hero"><div className="t5-container"><span className="t5-eyebrow !text-[var(--t5-accent)]">Giải pháp kỹ thuật</span><h1 className="t5-page-title">Không bán một cấu hình cho mọi công trình.</h1><p className="t5-page-desc">Mỗi dịch vụ bắt đầu từ vấn đề vận hành, đi qua dữ liệu và kết thúc bằng đầu ra kỹ thuật rõ ràng.</p></div></section>
    <section className="t5-section"><div className="t5-container grid gap-5 md:grid-cols-2">
      {SERVICES.map((service) => <Link key={service.slug} href={`/service/${service.slug}`} className="group grid overflow-hidden border border-slate-200 bg-white sm:grid-cols-[.85fr_1.15fr]"><div className="relative min-h-64 bg-slate-100"><Image src={service.image} alt={service.title} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" /></div><div className="p-6"><div className="text-xs font-black uppercase tracking-[.15em] text-slate-400">{service.audience}</div><h2 className="mt-3 text-2xl font-black text-[var(--t5-primary)]">{service.title}</h2><p className="mt-4 text-sm leading-7 text-slate-600">{service.solution}</p><div className="mt-6 font-black text-[var(--t5-primary)]">{service.price}</div><div className="mt-6 text-sm font-black">Xem quy trình & gói tham khảo →</div></div></Link>)}
    </div></section>
  </main>;
}