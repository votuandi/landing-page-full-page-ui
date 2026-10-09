import Image from "next/image";
import { ArrowRightIcon, Battery100Icon, BoltIcon, CpuChipIcon, LightBulbIcon, PlayIcon, SunIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { yearsOfExperience } from "@/config/site";
import { siteConfig } from "@/config/site.config";
import { CALCULATOR_ID, SECTION_IDS } from "@solar/core";
import { delay } from "@/utils/reveal";
import { Tr } from "@/i18n/LangProvider";
import HeroStats, { type HeroStat } from "@/components/HeroStats";

const stats: HeroStat[] = [
  { value: yearsOfExperience(), suffix: "+", unit: ["năm", "yrs"], label: ["kinh nghiệm", "experience"] },
  { value: siteConfig.stats.mwp, decimals: 1, unit: ["MWp", "MWp"], label: ["đã cung cấp & lắp đặt", "supplied & installed"] },
  { value: siteConfig.stats.customers, suffix: "+", unit: ["khách", "clients"], label: ["dùng điện mặt trời", "on solar power"] },
];

// Chip thiết bị nổi bên phải ảnh: gồm cả lắp đặt (t14) và đèn năng lượng mặt trời (t13).
const chips = [
  { label: ["Tấm pin N-type 590W", "N-type 590W panels"], Icon: SunIcon, pos: "right-[-3%] top-[14%]", tone: "bg-accent text-on-accent", anim: "t15-float" },
  { label: ["Inverter hybrid", "Hybrid inverter"], Icon: CpuChipIcon, pos: "right-[-6%] top-[33%]", tone: "bg-secondary text-on-secondary", anim: "t15-float-delay" },
  { label: ["Pin lưu trữ LFP", "LFP storage"], Icon: Battery100Icon, pos: "right-[-2%] top-[52%]", tone: "bg-primary text-on-primary", anim: "t15-float-slow" },
  { label: ["Đèn năng lượng mặt trời", "Solar lights"], Icon: LightBulbIcon, pos: "right-[2%] top-[71%]", tone: "bg-leaf text-on-accent", anim: "t15-float" },
] as const;

/** Hero trang chủ "Fresh Energy": chữ lớn gradient, CTA dự toán, số liệu đếm, ảnh vòm + mặt trời xoay + thẻ dữ liệu nổi. */
export default function Hero() {
  const google = siteConfig.reviews.google;
  return (
    <section className="t15-screen relative isolate overflow-hidden !min-h-[calc(100svh-7.5rem)] bg-gradient-to-b from-bg-tint to-bg">
      <div aria-hidden className="t15-dots pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_30%_40%,rgb(0_0_0),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-leaf)/.22),transparent_65%)]" />
      
      <div className="t15-container grid items-center gap-12 pb-16 pt-10 lg:grid-cols-[1.02fr_1fr] lg:gap-8 lg:py-12">
        <div className="relative z-10">
          <div data-hero="down" className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-bg-elevated/80 py-1.5 pl-1.5 pr-4 text-[11px] font-bold text-fg-muted shadow-sm backdrop-blur sm:text-xs">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-on-primary"><BoltIcon className="h-4 w-4" /></span>
            <Tr vi="Năng lượng xanh • Phân phối thiết bị • Tổng thầu EPC" en="Green energy • Equipment • EPC contractor" />
          </div>
          <h1 data-hero="left" style={delay(0.1)} className="mt-6 max-w-2xl text-[2.55rem] font-black leading-[1.06] tracking-[-.045em] text-fg sm:text-6xl lg:text-[3.9rem]">
            <Tr vi="Điện sạch từ" en="Clean power from" />{" "}
            <span className="t15-gradient-text"><Tr vi="mái nhà của bạn" en="your own roof" /></span>
            <span className="mt-2 block text-[0.62em] font-black leading-[1.15] tracking-[-.03em] text-fg-muted">
              <Tr vi="thiết bị chính hãng," en="genuine equipment," />{" "}
              <span className="t15-marker text-fg"><Tr vi="lắp đặt trọn gói" en="turnkey installation" /></span>
            </span>
          </h1>
          <p data-hero="left" style={delay(0.22)} className="mt-6 max-w-xl text-base leading-8 text-fg-muted sm:text-lg">
            <Tr vi="Phân phối tấm pin, inverter, pin lưu trữ, BESS, đèn năng lượng mặt trời đủ CO/CQ — và thi công trọn gói cho hộ gia đình, cửa hàng, nhà xưởng, trang trại. Xem công trình thật, biết chi phí và tiền tiết kiệm trước khi gọi."
              en="Panels, inverters, batteries, BESS and solar lights with full CO/CQ — plus turnkey installation for homes, shops, factories and farms. See real projects and know the cost and savings before you call." />
          </p>
          <div data-hero="up" style={delay(0.34)} className="mt-8 flex flex-wrap items-center gap-3">
            <a href={`#${CALCULATOR_ID}`} className="t15-button t15-button-accent min-h-12 text-base"><Tr vi="Dự toán chi phí" en="Estimate cost" /> <ArrowRightIcon className="h-4 w-4" /></a>
            <a href={`#${SECTION_IDS.video}`} className="t15-button t15-button-secondary min-h-12 text-base"><PlayIcon className="h-4 w-4 text-primary" /><Tr vi="Xem công trình thực tế" en="Watch real projects" /></a>
          </div>
          {google.url && google.rating > 0 && (
            <a data-hero="up" style={delay(0.42)} href={google.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-fg-muted hover:text-fg">
              <span className="flex text-accent" aria-hidden>{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} className="h-4 w-4" />)}</span>
              <span><strong className="text-fg">{String(google.rating).replace(".", ",")}/5</strong> · {google.count} <Tr vi="đánh giá Google" en="Google reviews" /></span>
            </a>
          )}
          <HeroStats stats={stats} />
        </div>

        <div className="relative mx-auto h-[460px] w-full max-w-[600px] sm:h-[600px]">
          {/* Mặt trời + tia nắng xoay chậm */}
          <div aria-hidden className="absolute right-[2%] top-[-2%] h-[46%] w-[46%]">
            <svg viewBox="0 0 200 200" className="t15-spin-slow h-full w-full text-accent">
              {Array.from({ length: 18 }, (_, i) => <rect key={i} x="98" y="4" width="4" height="26" rx="2" fill="currentColor" opacity=".55" transform={`rotate(${i * 20} 100 100)`} />)}
            </svg>
            <span className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle_at_35%_35%,rgb(var(--c-accent-soft)),rgb(var(--c-accent))_60%)] shadow-[0_0_80px_20px_rgb(var(--c-accent)/.45)]" />
          </div>
          {/* Vòng quỹ đạo năng lượng */}
          <div aria-hidden className="absolute left-1/2 top-[55%] h-[112%] w-[112%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/20" />
          <div aria-hidden className="absolute left-1/2 top-[55%] h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-secondary/15" />

          {/* Ảnh vòm */}
          <div data-hero="up" style={delay(0.15)} className="absolute bottom-0 left-[10%] h-[88%] w-[62%] overflow-hidden rounded-b-[40px] rounded-t-full border-[6px] border-bg-elevated bg-bg-tint shadow-[0_40px_80px_-30px_rgb(var(--c-shadow)/.5)]">
            <Image src="/images/services/service_1772895565903.webp" alt="Kỹ sư kiểm tra hệ thống điện mặt trời áp mái" fill priority quality={70} className="object-cover object-[72%_center]" sizes="(max-width:1024px) 62vw, 370px" />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/45 to-transparent" />
          </div>

          {/* Điểm phân tích + đường nối */}
          <div data-reveal="zoom" style={delay(0.6)} className="pointer-events-none absolute inset-0 text-on-media">
            <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M44 30 C 56 26, 66 22, 76 22" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M58 50 C 66 46, 70 43, 78 42" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <path d="M50 70 C 60 66, 66 64, 76 63" className="t15-dash" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="t15-hotspot absolute left-[44%] top-[30%] -translate-x-1/2 -translate-y-1/2" />
            <span className="t15-hotspot absolute left-[58%] top-[50%] -translate-x-1/2 -translate-y-1/2" />
            <span className="t15-hotspot absolute left-[50%] top-[70%] -translate-x-1/2 -translate-y-1/2" />
          </div>

          {chips.map(({ label, Icon, pos, tone, anim }, i) => (
            <div key={label[0]} data-reveal="right" style={delay(0.45 + i * 0.12)} className={`absolute ${pos} ${anim} flex items-center ${i === 3 ? "hidden sm:flex" : ""}`}>
              <span className={`relative z-10 grid h-11 w-11 place-items-center rounded-full border-4 border-bg-elevated shadow-lg ${tone}`}><Icon className="h-5 w-5" /></span>
              <span className="t15-glass -ml-3 rounded-full py-2.5 pl-6 pr-4 text-xs font-black text-fg sm:text-sm"><Tr vi={label[0]} en={label[1]} /></span>
            </div>
          ))}

          {/* Thẻ dữ liệu nổi */}
          <div data-reveal="down" style={delay(0.5)} className="t15-glass t15-float-slow absolute left-0 top-[4%] hidden w-56 rounded-3xl p-4 sm:block">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.12em] text-fg-muted"><Tr vi="Sản lượng hôm nay" en="Today's output" /><span className="flex items-center gap-1 text-success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />Live</span></div>
            <div className="mt-2 text-2xl font-black text-fg">1.248 <span className="text-sm font-bold text-fg-subtle">kWh</span></div>
            <div className="mt-3 flex h-10 items-end gap-1">
              {[22, 35, 48, 66, 82, 100, 92, 74, 55, 34].map((h, i) => <span key={i} className={`flex-1 rounded-full ${h > 80 ? "bg-accent" : "bg-leaf"}`} style={{ height: `${h}%` }} />)}
            </div>
          </div>

          <div data-reveal="left" style={delay(0.7)} className="t15-glass t15-float absolute bottom-[12%] left-[-3%] rounded-3xl p-4 sm:left-[-2%]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-on-accent"><BoltIcon className="h-6 w-6" /></span>
              <div><div className="text-[11px] font-bold uppercase tracking-[.12em] text-fg-muted"><Tr vi="Hóa đơn giảm" en="Bill reduced" /></div><div className="text-xl font-black text-fg">−38%<span className="ml-1 text-xs font-semibold text-fg-subtle"><Tr vi="/ tháng*" en="/ month*" /></span></div></div>
            </div>
          </div>

          <div data-reveal="up" style={delay(0.85)} className="t15-float-delay absolute bottom-[1%] right-[0%] hidden rounded-2xl bg-primary px-4 py-3 text-on-primary shadow-xl sm:block">
            <div className="text-[11px] font-semibold text-on-primary/85"><Tr vi="CO₂ giảm mỗi năm" en="CO₂ avoided / year" /></div>
            <div className="text-lg font-black">~840 <Tr vi="tấn" en="tonnes" /></div>
          </div>
        </div>
      </div>
    </section>
  );
}
