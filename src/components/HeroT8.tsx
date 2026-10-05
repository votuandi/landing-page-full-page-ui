import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, Battery100Icon, BoltIcon, CpuChipIcon, SunIcon } from "@heroicons/react/24/outline";
import { SITE_CONFIG } from "@/config/site";
import { delay } from "@/utils/reveal";

const stats = [
  [SITE_CONFIG.capabilities.years + "+", "năm", "kinh nghiệm"],
  [String(SITE_CONFIG.capabilities.mwp).replace(".", ",") + "", "MWp", "đã lắp đặt"],
  [SITE_CONFIG.capabilities.projects + "+", "dự án", "đang vận hành"],
] as const;

// Floating chips on the right of the arch, positioned like the reference layout.
const chips = [
  { label: "Tấm pin N-type 585W", Icon: SunIcon, pos: "right-[-2%] top-[22%] sm:right-[2%]", tone: "bg-[var(--t5-accent)] text-[var(--t8-ink)]", anim: "t8-float" },
  { label: "Inverter hybrid", Icon: CpuChipIcon, pos: "right-[-4%] top-[44%] sm:right-[-6%]", tone: "bg-[var(--t8-blue)] text-white", anim: "t8-float-delay" },
  { label: "Pin lưu trữ LFP", Icon: Battery100Icon, pos: "right-[0%] top-[66%] sm:right-[4%]", tone: "bg-emerald-400 text-[var(--t8-ink)]", anim: "t8-float-slow" },
];

export default function HeroT8() {
  return (
    <section className="t8-screen relative isolate overflow-hidden !min-h-[calc(100svh-5rem)] bg-gradient-to-br from-white via-[var(--t8-beige)] to-[#eaf2ff]">
      {/* Soft solar glows */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 -z-10 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle,rgb(47_111_228_/_.32),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute right-[18%] -top-24 -z-10 h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgb(255_214_102_/_.55),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 -z-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgb(239_227_204_/_.9),transparent_70%)]" />

      <div className="t5-container grid items-center gap-10 pb-14 pt-12 lg:grid-cols-[1fr_1.02fr] lg:gap-6 lg:py-10">
        <div className="relative z-10">
          <div data-reveal="down" className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/60 py-1.5 pl-1.5 pr-4 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--t5-accent)] text-[var(--t8-ink)]"><SunIcon className="h-4 w-4" /></span>
            Điện mặt trời cho nhà máy • cửa hàng • gia đình
          </div>
          <h1 data-reveal="left" style={delay(0.1)} className="mt-6 max-w-2xl text-[2.6rem] font-black leading-[1.05] tracking-[-.045em] text-[var(--t8-ink)] sm:text-6xl lg:text-[3.8rem]">
            Cùng biến nắng thành{" "}
            <span className="relative whitespace-nowrap text-[var(--t5-primary)]">
              dòng tiền
              <svg aria-hidden viewBox="0 0 200 14" preserveAspectRatio="none" className="absolute -bottom-1 left-0 h-2.5 w-full text-[var(--t5-accent)]"><path d="M2 10 C 50 2, 150 2, 198 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg>
            </span>{" "}
            cho công trình của bạn
          </h1>
          <p data-reveal="left" style={delay(0.22)} className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            Thiết kế hệ solar theo đúng phụ tải, theo dõi điện năng 24/7 trên điện thoại và tối ưu hóa đơn từ tháng đầu tiên vận hành.
          </p>
          <div data-reveal="up" style={delay(0.34)} className="mt-9 flex flex-wrap gap-3">
            <a href="#roi" className="t5-button bg-[var(--t5-primary)] text-white shadow-[0_14px_30px_-12px_rgb(13_59_120_/_.7)] hover:brightness-110">Tính tiết kiệm <ArrowRightIcon className="h-4 w-4" /></a>
            <Link href="/contact-us" className="t5-button border border-slate-300 bg-white/50 text-[var(--t8-ink)] backdrop-blur hover:bg-white">Đặt lịch khảo sát</Link>
          </div>
          <dl data-reveal-stagger="up" data-reveal-step="0.12" className="mt-12 grid max-w-lg grid-cols-3 gap-4 sm:mt-16">
            {stats.map(([value, unit, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-2xl font-black tracking-tight text-[var(--t8-ink)] sm:text-4xl">{value}<span className="ml-1 text-xs sm:text-base font-bold text-slate-400">{unit}</span></dd>
                <dd className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto h-[460px] w-full max-w-[600px] sm:h-[580px]">
          {/* Concentric orbit rings */}
          <div aria-hidden className="absolute left-1/2 top-[54%] h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70" />
          <div aria-hidden className="absolute left-1/2 top-[54%] h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(47_111_228_/_.15)]" />
          <div aria-hidden className="absolute left-1/2 top-[54%] h-[66%] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(47_111_228_/_.22),transparent_70%)]" />
          {[["left-[8%] top-[18%]", "h-2 w-2"], ["right-[10%] top-[8%]", "h-1.5 w-1.5"], ["left-[14%] bottom-[16%]", "h-2.5 w-2.5"], ["right-[22%] bottom-[6%]", "h-1.5 w-1.5"]].map(([pos, size]) => (
            <span key={pos} aria-hidden className={`absolute ${pos} ${size} rounded-full bg-white shadow-[0_0_14px_4px_rgb(255_255_255_/_.9)]`} />
          ))}

          {/* Arch photo */}
          <div data-reveal="up" style={delay(0.15)} className="absolute bottom-0 left-[12%] h-[90%] w-[60%] overflow-hidden rounded-b-[36px] rounded-t-full border-[6px] border-white/70 bg-[var(--t8-sky)] shadow-[0_40px_80px_-30px_rgb(13_59_120_/_.55)]">
            <Image src="/images/services/service_1772895565903.webp" alt="Kỹ sư kiểm tra hệ thống điện mặt trời áp mái" fill priority className="object-cover object-[72%_center]" sizes="(max-width:1024px) 70vw, 360px" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(11_31_58_/_.55)] via-transparent to-white/10" />
          </div>

          {/* Analysis hotspots with connector lines */}
          <div data-reveal="zoom" style={delay(0.6)} className="pointer-events-none absolute inset-0">
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M48 30 C 60 28, 66 27, 74 27" className="t8-dash" fill="none" stroke="#ffffff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <path d="M60 52 C 66 50, 70 49, 76 49" className="t8-dash" fill="none" stroke="#ffffff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <path d="M52 74 C 60 72, 66 71, 72 71" className="t8-dash" fill="none" stroke="#ffffff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="t8-hotspot absolute left-[48%] top-[30%] -translate-x-1/2 -translate-y-1/2" />
          <span className="t8-hotspot absolute left-[60%] top-[52%] -translate-x-1/2 -translate-y-1/2" />
          <span className="t8-hotspot absolute left-[52%] top-[74%] -translate-x-1/2 -translate-y-1/2" />
          </div>

          {chips.map(({ label, Icon, pos, tone, anim }, i) => (
            <div key={label} data-reveal="right" style={delay(0.45 + i * 0.15)} className={`absolute ${pos} ${anim} flex items-center`}>
              <span className={`relative z-10 grid h-11 w-11 place-items-center rounded-full border-4 border-white/80 shadow-lg ${tone}`}><Icon className="h-5 w-5" /></span>
              <span className="t8-glass -ml-3 rounded-full py-2.5 pl-6 pr-5 text-xs font-black text-[var(--t8-ink)] sm:text-sm">{label}</span>
            </div>
          ))}

          {/* Live data cards */}
          <div data-reveal="down" style={delay(0.5)} className="t8-glass t8-float-slow absolute left-0 top-[6%] hidden w-52 rounded-3xl p-4 sm:block">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[.14em] text-slate-500">Sản lượng hôm nay <span className="flex items-center gap-1 text-emerald-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Live</span></div>
            <div className="mt-2 text-2xl font-black text-[var(--t8-ink)]">1.248 <span className="text-sm font-bold text-slate-400">kWh</span></div>
            <div className="mt-3 flex h-10 items-end gap-1">
              {[22, 35, 48, 66, 82, 100, 92, 74, 55, 34].map((h, i) => <span key={i} className="flex-1 rounded-full bg-gradient-to-t from-[var(--t8-blue)] to-[var(--t8-sun)]" style={{ height: `${h}%`, opacity: 0.45 + h / 200 }} />)}
            </div>
          </div>

          <div data-reveal="left" style={delay(0.7)} className="t8-glass t8-float absolute bottom-[10%] left-[-2%] rounded-3xl p-4 sm:left-0">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[rgb(247_185_40_/_.90)] text-[var(--t8-ink)]"><BoltIcon className="h-5 w-5" /></span>
              <div><div className="text-[11px] font-bold uppercase tracking-[.12em] text-slate-500">Hóa đơn giảm</div><div className="text-xl font-black text-[var(--t8-ink)]">−38%<span className="ml-1 text-xs font-semibold text-slate-400">/ tháng*</span></div></div>
            </div>
          </div>

          <div data-reveal="up" style={delay(0.85)} className="t8-glass-dark t8-float-delay absolute bottom-[3%] right-[2%] hidden rounded-2xl bg-[rgb(11_31_58_/_.60)] px-4 py-3 text-white sm:block">
            <div className="text-[11px] font-semibold text-white/60">CO₂ giảm mỗi năm</div>
            <div className="text-lg font-black">~840 tấn</div>
          </div>
        </div>
      </div>
    </section>
  );
}
