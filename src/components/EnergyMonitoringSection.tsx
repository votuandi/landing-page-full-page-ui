import Link from "next/link";
import { ArrowRightIcon, Battery50Icon, BellAlertIcon, BoltIcon, ChartBarIcon, DevicePhoneMobileIcon, HomeIcon, SunIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const flows = [
  { label: "Sản xuất", desc: "Sản lượng từ tấm pin theo từng giờ, từng string.", value: "186 kW", Icon: SunIcon, tone: "bg-[var(--t5-accent)] text-[var(--t8-ink)]" },
  { label: "Tiêu thụ", desc: "Phụ tải thực tế, phần dùng từ solar và từ lưới.", value: "172 kW", Icon: BoltIcon, tone: "bg-[var(--t8-blue)] text-white" },
  { label: "Lưu trữ", desc: "Dung lượng pin, chu kỳ sạc/xả và thời gian dự phòng.", value: "86%", Icon: Battery50Icon, tone: "bg-emerald-400 text-[var(--t8-ink)]" },
];

const features = [
  [BellAlertIcon, "Cảnh báo tức thì khi sản lượng bất thường"],
  [ChartBarIcon, "Báo cáo tiết kiệm theo ngày, tháng, năm"],
  [UserGroupIcon, "Chia sẻ quyền xem cho nhiều thành viên"],
  [DevicePhoneMobileIcon, "Ứng dụng iOS, Android và trình duyệt web"],
] as const;

// Hourly production vs consumption (kW) for the in-phone chart.
const production = [0, 0, 0, 0, 0, 4, 18, 52, 96, 138, 170, 186, 182, 168, 140, 104, 62, 24, 4, 0, 0, 0, 0, 0];
const consumption = [38, 34, 32, 30, 32, 44, 88, 140, 162, 170, 174, 172, 150, 168, 176, 170, 158, 120, 84, 70, 62, 54, 46, 40];

function toPath(values: number[], close: boolean) {
  const pts = values.map((v, i) => `${(i / 23) * 220},${92 - (v / 200) * 84}`);
  return close ? `M0,92 L${pts.join(" L")} L220,92 Z` : `M${pts.join(" L")}`;
}

function PhoneDashboard() {
  return (
    <div className="absolute left-[60px] top-[10px] h-[540px] w-[260px] rounded-[44px] bg-gradient-to-b from-slate-700 to-slate-900 p-[9px] shadow-[0_50px_100px_-30px_rgb(0_0_0_/_.6)]">
      <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-gradient-to-b from-[#f4f8ff] to-[var(--t8-beige)] text-[var(--t8-ink)]">
        <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
        <div className="flex items-center justify-between px-5 pt-2.5 text-[10px] font-bold"><span>9:41</span><span className="tracking-tighter">●●● ▮</span></div>

        <div className="px-4 pt-5">
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-semibold text-slate-500">Xin chào,</div><div className="text-[13px] font-black">Nhà máy Long An</div></div>
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Trực tuyến</span>
          </div>

          <div className="mt-3 rounded-2xl bg-gradient-to-br from-[var(--t5-primary)] to-[var(--t8-blue)] p-3 text-white">
            <div className="flex items-start justify-between">
              <div><div className="text-[9px] font-semibold uppercase tracking-wider text-white/70">Sản lượng hôm nay</div><div className="mt-0.5 text-xl font-black">1.248 <span className="text-[10px] font-semibold text-white/70">kWh</span></div><div className="text-[9px] font-bold text-[var(--t8-sun)]">▲ 12% so với hôm qua</div></div>
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="rgb(255 255 255 / .2)" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="var(--t8-sun)" strokeWidth="4" strokeDasharray="94.2" strokeDashoffset="20" strokeLinecap="round" /></svg>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {flows.map(({ label, value, Icon, tone }) => (
              <div key={label} className="rounded-xl bg-white/90 p-2 shadow-sm">
                <span className={`grid h-5 w-5 place-items-center rounded-full ${tone}`}><Icon className="h-3 w-3" /></span>
                <div className="mt-1.5 text-[11px] font-black">{value}</div>
                <div className="text-[8px] font-semibold text-slate-500">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 rounded-2xl bg-white/90 p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-[9px] font-bold"><span>Sản xuất vs tiêu thụ</span><span className="text-slate-400">24h</span></div>
            <svg viewBox="0 0 220 96" className="mt-1 h-[78px] w-full">
              <defs><linearGradient id="t8-prod" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f7b928" stopOpacity=".7" /><stop offset="1" stopColor="#f7b928" stopOpacity=".05" /></linearGradient></defs>
              <path d={toPath(production, true)} fill="url(#t8-prod)" />
              <path d={toPath(production, false)} fill="none" stroke="#f0a500" strokeWidth="1.5" />
              <path d={toPath(consumption, false)} fill="none" stroke="#2f6fe4" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            <div className="mt-1 flex gap-3 text-[8px] font-semibold text-slate-500"><span className="flex items-center gap-1"><i className="h-1.5 w-3 rounded-full bg-[#f0a500]" />Sản xuất</span><span className="flex items-center gap-1"><i className="h-1.5 w-3 rounded-full bg-[#2f6fe4]" />Tiêu thụ</span></div>
          </div>

          <div className="mt-2.5 rounded-2xl bg-white/90 p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-[9px] font-bold"><span>Pin lưu trữ • đang sạc</span><span className="text-emerald-600">86%</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500" /></div>
            <div className="mt-1.5 text-[8px] font-semibold text-slate-500">Dự phòng ước tính 5 giờ 20 phút</div>
          </div>
        </div>

        <div className="absolute inset-x-3 bottom-3 flex justify-around rounded-2xl bg-white/90 py-2 text-slate-400 shadow-sm backdrop-blur">
          <HomeIcon className="h-4 w-4 text-[var(--t5-primary)]" /><ChartBarIcon className="h-4 w-4" /><BellAlertIcon className="h-4 w-4" /><UserGroupIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function HandHoldingPhone() {
  const skin = "#f1c7a3";
  const shade = "#dfa982";
  const fade = { maskImage: "linear-gradient(to bottom, #000 82%, transparent)", WebkitMaskImage: "linear-gradient(to bottom, #000 82%, transparent)" };
  return (
    <div className="relative h-[660px] w-[380px]" role="img" aria-label="Tay cầm điện thoại hiển thị bảng theo dõi điện năng">
      {/* Palm and wrist behind the phone */}
      <svg aria-hidden viewBox="0 0 380 660" className="absolute inset-0 h-full w-full" style={fade}>
        <path d={`M48 470 C 40 560, 90 630, 190 660 L 380 660 L 380 600 C 360 560, 350 470, 345 330 L 318 330 L 318 470 Z`} fill={skin} />
        <path d="M200 660 C 260 640, 330 610, 380 600 L 380 660 Z" fill={shade} opacity=".6" />
        <path d="M250 660 L 380 585 L 380 660 Z" fill="#1d5bb8" />
        <path d="M250 660 L 380 585 L 380 600 L 276 660 Z" fill="#f7b928" />
      </svg>
      <PhoneDashboard />
      {/* Thumb and fingertips wrapping the phone edges */}
      <svg aria-hidden viewBox="0 0 380 660" className="pointer-events-none absolute inset-0 h-full w-full" style={fade}>
        <path d="M30 610 C 18 540, 36 476, 74 438 C 90 422, 116 428, 114 452 C 112 470, 98 484, 92 508 C 86 534, 92 572, 104 612 Z" fill={skin} />
        <path d="M74 438 C 90 422, 116 428, 114 452 C 106 448, 92 446, 80 452 Z" fill={shade} opacity=".5" />
        <ellipse cx="100" cy="440" rx="9" ry="12" transform="rotate(-35 100 440)" fill="#f8dcc4" />
        {[300, 350, 400, 450].map((y, i) => (
          <g key={y}>
            <rect x={302 + i * 2} y={y} width="52" height="40" rx="20" fill={skin} />
            <ellipse cx={316 + i * 2} cy={y + 20} rx="8" ry="11" fill="#f8dcc4" />
            <path d={`M${330 + i * 2} ${y + 38} q 12 -2 22 -10`} stroke={shade} strokeWidth="2" fill="none" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function EnergyMonitoringSection() {
  return (
    <section id="theo-doi-24-7" className="relative isolate overflow-hidden bg-gradient-to-br from-[#082a57] via-[var(--t5-primary)] to-[#1d5bb8] py-16 text-white md:py-24">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(247_185_40_/_.35),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(219_233_255_/_.18),transparent_65%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="t5-container grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-[var(--t8-sun)] backdrop-blur"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--t8-sun)]" />Theo dõi điện năng 24/7</span>
          <h2 className="mt-5 max-w-2xl text-4xl font-black leading-[1.08] tracking-[-.04em] sm:text-5xl">Toàn bộ dòng điện của bạn, gọn trong lòng bàn tay.</h2>
          <p className="mt-5 max-w-xl leading-8 text-white/70">Mỗi hệ thống được bàn giao kèm ứng dụng giám sát. Xem điện năng sinh ra, tiêu thụ và lưu trữ theo thời gian thực — biết chính xác mình đang tiết kiệm bao nhiêu, ở bất cứ đâu.</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {flows.map(({ label, desc, value, Icon, tone }) => (
              <div key={label} className="t8-glass-dark rounded-3xl p-5 transition hover:bg-white/15">
                <div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></span><span className="text-sm font-black text-white/90">{value}</span></div>
                <div className="mt-4 font-black">{label}</div>
                <p className="mt-1 text-xs leading-5 text-white/60">{desc}</p>
              </div>
            ))}
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map(([Icon, text]) => <li key={text} className="flex items-center gap-3 text-sm font-semibold text-white/80"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10"><Icon className="h-4 w-4 text-[var(--t8-sun)]" /></span>{text}</li>)}
          </ul>

          <Link href="/contact-us" className="t5-button mt-10 bg-[var(--t5-accent)] text-[var(--t8-ink)] hover:brightness-105">Xem demo ứng dụng <ArrowRightIcon className="h-4 w-4" /></Link>
        </div>

        <div className="flex justify-center">
        <div className="relative -mb-24 w-[380px] shrink-0 origin-top scale-[.84] sm:mb-0 sm:scale-100">
          <div aria-hidden className="absolute left-1/2 top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
          <div aria-hidden className="absolute left-1/2 top-[42%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(255_214_102_/_.3),transparent_68%)]" />
          <HandHoldingPhone />
          <div className="t8-glass t8-float absolute -left-24 top-[34%] hidden rounded-2xl px-4 py-3 text-[var(--t8-ink)] sm:block lg:-left-32">
            <div className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500">Tiết kiệm tháng này</div>
            <div className="text-lg font-black">128,4 triệu ₫</div>
          </div>
          <div className="t8-glass t8-float-delay absolute -right-28 top-[6%] hidden max-w-[190px] items-start gap-2 rounded-2xl px-3 py-3 text-[var(--t8-ink)] sm:flex lg:-right-10">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600"><BellAlertIcon className="h-4 w-4" /></span>
            <div className="text-[11px] font-semibold leading-4"><b className="block text-xs">String 3 giảm 8%</b>Đề xuất vệ sinh tấm pin</div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
