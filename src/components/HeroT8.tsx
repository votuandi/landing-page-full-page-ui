import Image from "next/image";
import { ArrowRightIcon, BoltIcon, CpuChipIcon, LightBulbIcon, PlayIcon, StarIcon, SunIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG, yearsOfExperience } from "@/config/site";
import { SECTION_IDS } from "@/lib/segment";
import { delay } from "@/utils/reveal";
import HeroStats, { type HeroStat } from "@/components/HeroStats";

const stats: HeroStat[] = [
  { value: yearsOfExperience(), suffix: "+", unit: "năm", label: "kinh nghiệm" },
  { value: SITE_CONFIG.capabilities.mwp, decimals: 1, unit: "MWp", label: "đã lắp đặt" },
  { value: SITE_CONFIG.capabilities.customers, suffix: "+", unit: "khách", label: "đang dùng điện mặt trời" },
];

// Chip nổi bên phải vòm ảnh — vị trí giữ nguyên template-8; nội dung nói về cả lắp đặt lẫn thiết bị.
const chips = [
  { label: "Tấm pin N-type 580W", Icon: SunIcon, pos: "right-[-2%] top-[22%] sm:right-[2%]", tone: "bg-sun text-fg", anim: "t8-float" },
  { label: "Inverter hybrid", Icon: CpuChipIcon, pos: "right-[-4%] top-[44%] sm:right-[-6%]", tone: "bg-accent text-on-accent", anim: "t8-float-delay" },
  { label: "Đèn năng lượng mặt trời", Icon: LightBulbIcon, pos: "right-[0%] top-[66%] sm:right-[4%]", tone: "bg-primary text-on-primary", anim: "t8-float-slow" },
];

export default function HeroT8() {
  const google = SITE_CONFIG.reviews.google;
  return (
    <section className="t8-screen relative isolate overflow-hidden !min-h-[calc(100svh-7rem)] bg-gradient-to-br from-bg-elevated via-bg to-bg-tint">
      {/* Soft solar glows */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 -z-10 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-primary)/.18),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute right-[18%] -top-24 -z-10 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-sun)/.45),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 -z-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-bg-tint)/.9),transparent_70%)]" />

      <div className="t5-container grid items-center gap-10 pb-14 pt-12 lg:grid-cols-[1fr_1.02fr] lg:gap-6 lg:py-10">
        <div className="relative z-10">
          <div data-hero="down" className="inline-flex items-center gap-2 rounded-full border border-on-media/80 bg-glass py-1.5 pl-1.5 pr-4 text-xs font-bold text-fg-muted shadow-sm backdrop-blur">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-sun text-fg"><SunIcon className="h-4 w-4" /></span>
            Hộ gia đình • Cửa hàng • Nhà xưởng • Trang trại
          </div>
          <h1 data-hero="left" style={delay(0.1)} className="mt-6 max-w-2xl text-[2.5rem] font-black leading-[1.05] tracking-[-.045em] text-fg sm:text-6xl lg:text-[3.8rem]">
            Mỗi tháng trả{" "}
            <span className="relative whitespace-nowrap text-primary">
              ít tiền điện
              <svg aria-hidden viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-2.5 w-full text-sun"><path d="M2 10 C 50 2, 150 2, 198 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg>
            </span>{" "}
            hơn — nhờ chính mái nhà của bạn
          </h1>
          <p data-hero="left" style={delay(0.22)} className="mt-7 max-w-xl text-base leading-8 text-fg-muted sm:text-lg">
            Lắp đặt điện mặt trời trọn gói và cung cấp thiết bị, đèn năng lượng mặt trời chính hãng. Xem công trình thật, biết chi phí và số tiền tiết kiệm trước khi gọi.
          </p>
          <div data-hero="up" style={delay(0.34)} className="mt-9 flex flex-wrap gap-3">
            <a href={`#${SECTION_IDS.calculator}`} className="t5-button t5-button-primary shadow-[0_14px_30px_-12px_rgb(var(--c-primary)/.7)]">Dự toán chi phí <ArrowRightIcon className="h-4 w-4" /></a>
            <a href={`#${SECTION_IDS.video}`} className="t5-button t5-button-secondary"><PlayIcon className="h-4 w-4 text-accent" />Xem công trình thực tế</a>
          </div>
          <HeroStats stats={stats} />
        </div>

        <div className="relative mx-auto h-[460px] w-full max-w-[600px] sm:h-[580px]">
          {/* Concentric orbit rings */}
          <div aria-hidden className="absolute left-1/2 top-[54%] h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-media/70" />
          <div aria-hidden className="absolute left-1/2 top-[54%] h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" />
          <div aria-hidden className="absolute left-1/2 top-[54%] h-[66%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--c-primary)/.16),transparent_70%)]" />
          {[["left-[8%] top-[18%]", "h-2 w-2"], ["right-[10%] top-[8%]", "h-1.5 w-1.5"], ["left-[14%] bottom-[16%]", "h-2.5 w-2.5"], ["right-[22%] bottom-[6%]", "h-1.5 w-1.5"]].map(([pos, size]) => (
            <span key={pos} aria-hidden className={`absolute ${pos} ${size} rounded-full bg-bg-elevated shadow-[0_0_14px_4px_rgb(var(--c-on-media)/.9)]`} />
          ))}

          {/* Arch photo */}
          <div data-hero="up" style={delay(0.15)} className="absolute bottom-0 left-[12%] h-[90%] w-[60%] overflow-hidden rounded-b-[36px] rounded-t-full border-[6px] border-on-media/70 bg-bg-tint shadow-[0_40px_80px_-30px_rgb(var(--c-shadow)/.55)]">
            <Image src="/images/services/service_1772895565903.webp" alt="Kỹ sư kiểm tra hệ thống điện mặt trời áp mái" fill loading="lazy" quality={60} className="object-cover object-[72%_center]" sizes="(max-width:1024px) 60vw, 360px" />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/55 via-transparent to-on-media/10" />
          </div>

          {/* Analysis hotspots with connector lines */}
          <div data-reveal="zoom" style={delay(0.6)} className="pointer-events-none absolute inset-0 text-on-media">
            <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M48 30 C 60 28, 66 27, 74 27" className="t8-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M60 52 C 66 50, 70 49, 76 49" className="t8-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M52 74 C 60 72, 66 71, 72 71" className="t8-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="t8-hotspot absolute left-[48%] top-[30%] -translate-x-1/2 -translate-y-1/2" />
            <span className="t8-hotspot absolute left-[60%] top-[52%] -translate-x-1/2 -translate-y-1/2" />
            <span className="t8-hotspot absolute left-[52%] top-[74%] -translate-x-1/2 -translate-y-1/2" />
          </div>

          {chips.map(({ label, Icon, pos, tone, anim }, i) => (
            <div key={label} data-reveal="right" style={delay(0.45 + i * 0.15)} className={`absolute ${pos} ${anim} flex items-center`}>
              <span className={`relative z-10 grid h-11 w-11 place-items-center rounded-full border-4 border-on-media/80 shadow-lg ${tone}`}><Icon className="h-5 w-5" /></span>
              <span className="t8-glass -ml-3 rounded-full py-2.5 pl-6 pr-5 text-xs font-black text-fg sm:text-sm">{label}</span>
            </div>
          ))}

          {/* Live data cards */}
          <div data-reveal="down" style={delay(0.5)} className="t8-glass t8-float-slow absolute left-0 top-[6%] hidden w-52 rounded-3xl p-4 sm:block">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.14em] text-fg-muted">Sản lượng hôm nay <span className="flex items-center gap-1 text-success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />Live</span></div>
            <div className="mt-2 text-2xl font-black text-fg">48,6 <span className="text-sm font-bold text-fg-subtle">kWh</span></div>
            <div className="mt-3 flex h-10 items-end gap-1">
              {[22, 35, 48, 66, 82, 100, 92, 74, 55, 34].map((h, i) => <span key={i} className="flex-1 rounded-full bg-gradient-to-t from-primary to-sun" style={{ height: `${h}%`, opacity: 0.45 + h / 200 }} />)}
            </div>
          </div>

          <div data-reveal="left" style={delay(0.7)} className="t8-glass t8-float absolute bottom-[10%] left-[-2%] rounded-3xl p-4 sm:left-0">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-sun text-fg"><BoltIcon className="h-5 w-5" /></span>
              <div><div className="text-[11px] font-bold uppercase tracking-[.12em] text-fg-muted">Hóa đơn giảm</div><div className="text-xl font-black text-fg">−1,2 triệu<span className="ml-1 text-xs font-semibold text-fg-subtle">/ tháng*</span></div></div>
            </div>
          </div>

          {google.url && google.rating > 0 && (
            <div data-reveal="up" style={delay(0.85)} className="t8-glass-dark t8-float-delay absolute bottom-[3%] right-[2%] hidden rounded-2xl bg-scrim/70 px-4 py-3 text-on-media sm:block">
              <div className="flex items-center gap-1 text-highlight" aria-hidden>{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} className="h-3.5 w-3.5" />)}</div>
              <div className="mt-1 text-lg font-black">{String(google.rating).replace(".", ",")}/5 <span className="text-xs font-semibold text-on-media/80">· {google.count} đánh giá Google</span></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
