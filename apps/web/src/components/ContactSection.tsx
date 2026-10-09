import { delay } from "@solar/ui";
import Image from "next/image";
import { CheckCircleIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { Tr } from "@/i18n/LangProvider";
import LeadForm from "@/components/LeadForm";

const POINTS = [
  ["Khảo sát mái & đọc hóa đơn miễn phí", "Free roof survey & bill review"],
  ["Báo giá chi tiết trong 24 giờ", "Detailed quote within 24 hours"],
  ["Hỗ trợ hồ sơ đấu nối EVN", "Grid-connection paperwork handled"],
] as const;

/** Form "Nhận báo giá" cuối trang chủ: ảnh + cam kết bên trái, thẻ form sáng bên phải. */
export default function ContactSection() {
  return (
    <section id="nhan-bao-gia" className="t15-invert t15-ocean relative overflow-hidden text-fg" aria-labelledby="nhan-bao-gia-title">
      <div className="grid lg:grid-cols-2">
        <div data-reveal="left" className="relative min-h-[52vh] overflow-hidden lg:min-h-[640px]">
          <Image src="/images/solar-installation-hero.jpg" alt="Hệ thống điện mặt trời dưới bầu trời nắng" fill loading="lazy" className="object-cover" sizes="(max-width:1024px) 100vw, 50vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/50 to-scrim/5" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-on-media sm:p-10 xl:p-16">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-on-accent"><ShieldCheckIcon className="h-7 w-7" /></div>
            <h2 id="nhan-bao-gia-title" className="mt-6 max-w-lg text-4xl font-black tracking-[-.04em] sm:text-5xl"><Tr vi="Nhận báo giá — khảo sát miễn phí trong 48 giờ." en="Get a quote — free site survey within 48 hours." /></h2>
            <ul className="mt-6 grid gap-2.5">
              {POINTS.map(([vi, en]) => <li key={vi} className="flex items-center gap-2 font-semibold"><CheckCircleIcon className="h-5 w-5 shrink-0 text-accent" /><Tr vi={vi} en={en} /></li>)}
            </ul>
          </div>
        </div>
        <div className="flex items-center px-4 py-14 sm:px-10 xl:px-20">
          <div data-reveal="right" style={delay(0.15)} className="t15-card w-full max-w-[620px] p-6 text-fg shadow-2xl md:p-8">
            <div className="mb-5 text-lg font-black text-fg"><Tr vi="Để lại thông tin, kỹ sư sẽ gọi lại" en="Leave your details — an engineer will call" /></div>
            <LeadForm source="home-bottom" fields={{ zalo: true, address: true, message: true }} />
          </div>
        </div>
      </div>
    </section>
  );
}
