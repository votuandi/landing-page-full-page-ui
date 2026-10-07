import Link from "next/link";
import { delay } from "@/utils/reveal";
import { ArrowRightIcon, Battery50Icon, BellAlertIcon, BoltIcon, ChartBarIcon, DevicePhoneMobileIcon, HomeIcon, SunIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const flows = [
  { label: "Sản xuất", desc: "Sản lượng từ tấm pin theo từng giờ, từng string.", value: "186 kW", Icon: SunIcon, tone: "bg-accent text-on-accent" },
  { label: "Tiêu thụ", desc: "Phụ tải thực tế, phần dùng từ solar và từ lưới.", value: "172 kW", Icon: BoltIcon, tone: "bg-primary-strong text-on-media" },
  { label: "Lưu trữ", desc: "Dung lượng pin, chu kỳ sạc/xả và thời gian dự phòng.", value: "86%", Icon: Battery50Icon, tone: "bg-primary text-on-primary" },
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
    <div className="absolute left-[60px] top-[10px] h-[540px] w-[260px] rounded-[44px] bg-device p-[9px] shadow-[0_50px_100px_-30px_rgb(var(--c-shadow)/.6)]">
      <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-gradient-to-b from-bg-elevated to-bg-tint text-fg">
        <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-device" />
        <div className="flex items-center justify-between px-5 pt-2.5 text-[10px] font-bold"><span>9:41</span><span className="tracking-tighter">●●● ▮</span></div>

        <div className="px-4 pt-5">
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-semibold text-fg-muted">Xin chào,</div><div className="text-[13px] font-black">Nhà máy Long An</div></div>
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-[9px] font-bold text-success"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />Trực tuyến</span>
          </div>

          <div className="mt-3 rounded-2xl bg-primary p-3 text-on-primary">
            <div className="flex items-start justify-between">
              <div><div className="text-[9px] font-semibold uppercase tracking-wider text-on-primary/75">Sản lượng hôm nay</div><div className="mt-0.5 text-xl font-black">1.248 <span className="text-[10px] font-semibold text-on-primary/75">kWh</span></div><div className="text-[9px] font-bold text-accent">▲ 12% so với hôm qua</div></div>
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--c-on-primary) / .25)" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--c-accent))" strokeWidth="4" strokeDasharray="94.2" strokeDashoffset="20" strokeLinecap="round" /></svg>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {flows.map(({ label, value, Icon, tone }) => (
              <div key={label} className="rounded-xl bg-bg-elevated/95 p-2 shadow-sm">
                <span className={`grid h-5 w-5 place-items-center rounded-full ${tone}`}><Icon className="h-3 w-3" /></span>
                <div className="mt-1.5 text-[11px] font-black">{value}</div>
                <div className="text-[8px] font-semibold text-fg-muted">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 rounded-2xl bg-bg-elevated/95 p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-[9px] font-bold"><span>Sản xuất vs tiêu thụ</span><span className="text-fg-subtle">24h</span></div>
            <svg viewBox="0 0 220 96" className="mt-1 h-[78px] w-full">
              <defs><linearGradient id="t15-prod" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="rgb(var(--c-chart-a))" stopOpacity=".7" /><stop offset="1" stopColor="rgb(var(--c-chart-a))" stopOpacity=".05" /></linearGradient></defs>
              <path d={toPath(production, true)} fill="url(#t15-prod)" />
              <path d={toPath(production, false)} fill="none" stroke="rgb(var(--c-chart-a))" strokeWidth="1.5" />
              <path d={toPath(consumption, false)} fill="none" stroke="rgb(var(--c-chart-b))" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            <div className="mt-1 flex gap-3 text-[8px] font-semibold text-fg-muted"><span className="flex items-center gap-1"><i className="h-1.5 w-3 rounded-full bg-chart-a" />Sản xuất</span><span className="flex items-center gap-1"><i className="h-1.5 w-3 rounded-full bg-chart-b" />Tiêu thụ</span></div>
          </div>

          <div className="mt-2.5 rounded-2xl bg-bg-elevated/95 p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-[9px] font-bold"><span>Pin lưu trữ • đang sạc</span><span className="text-success">86%</span></div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-elevated"><div className="h-full w-[86%] rounded-full bg-primary" /></div>
            <div className="mt-1.5 text-[8px] font-semibold text-fg-muted">Dự phòng ước tính 5 giờ 20 phút</div>
          </div>
        </div>

        <div className="absolute inset-x-3 bottom-3 flex justify-around rounded-2xl bg-bg-elevated/95 py-2 text-fg-subtle shadow-sm backdrop-blur">
          <HomeIcon className="h-4 w-4 text-primary" /><ChartBarIcon className="h-4 w-4" /><BellAlertIcon className="h-4 w-4" /><UserGroupIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function HandHoldingPhone() {
  const skin = "rgb(var(--c-skin))";
  const shade = "rgb(var(--c-skin-shade))";
  const mask = "linear-gradient(to bottom, black 82%, transparent)"; // mask chỉ dùng kênh alpha, không phải màu hiển thị
  const fade = { maskImage: mask, WebkitMaskImage: mask };
  return (
    <div className="relative h-[660px] w-[380px]" role="img" aria-label="Tay cầm điện thoại hiển thị bảng theo dõi điện năng">
      {/* Palm and wrist behind the phone */}
      <svg aria-hidden viewBox="0 0 380 660" className="absolute inset-0 h-full w-full" style={fade}>
        <path d={`M48 470 C 40 560, 90 630, 190 660 L 380 660 L 380 600 C 360 560, 350 470, 345 330 L 318 330 L 318 470 Z`} fill={skin} />
        <path d="M200 660 C 260 640, 330 610, 380 600 L 380 660 Z" fill={shade} opacity=".6" />
        <path d="M250 660 L 380 585 L 380 660 Z" fill="rgb(var(--c-primary-strong))" />
        <path d="M250 660 L 380 585 L 380 600 L 276 660 Z" fill="rgb(var(--c-accent))" />
      </svg>
      <PhoneDashboard />
      {/* Thumb and fingertips wrapping the phone edges */}
      <svg aria-hidden viewBox="0 0 380 660" className="pointer-events-none absolute inset-0 h-full w-full" style={fade}>
        <path d="M30 610 C 18 540, 36 476, 74 438 C 90 422, 116 428, 114 452 C 112 470, 98 484, 92 508 C 86 534, 92 572, 104 612 Z" fill={skin} />
        <path d="M74 438 C 90 422, 116 428, 114 452 C 106 448, 92 446, 80 452 Z" fill={shade} opacity=".5" />
        <ellipse cx="100" cy="440" rx="9" ry="12" transform="rotate(-35 100 440)" fill="rgb(var(--c-skin-light))" />
        {[300, 350, 400, 450].map((y, i) => (
          <g key={y}>
            <rect x={302 + i * 2} y={y} width="52" height="40" rx="20" fill={skin} />
            <ellipse cx={316 + i * 2} cy={y + 20} rx="8" ry="11" fill="rgb(var(--c-skin-light))" />
            <path d={`M${330 + i * 2} ${y + 38} q 12 -2 22 -10`} stroke={shade} strokeWidth="2" fill="none" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function EnergyMonitoringSection() {
  return (
    <section id="theo-doi-24-7" className="t15-invert t15-screen relative isolate overflow-hidden t15-ocean py-16 text-fg md:py-24">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.25),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-bg-tint)/.18),transparent_65%)]" />
      <div aria-hidden className="absolute inset-0 -z-10 opacity-[.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="t15-container grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <span data-reveal="down" className="inline-flex items-center gap-2 rounded-full border border-line/15 bg-glass-strong px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-accent-ink backdrop-blur"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-soft" />Theo dõi điện năng 24/7</span>
          <h2 data-reveal="left" style={delay(0.1)} className="mt-5 max-w-2xl text-4xl font-black leading-[1.08] tracking-[-.04em] sm:text-5xl">Toàn bộ dòng điện của bạn, gọn trong lòng bàn tay.</h2>
          <p data-reveal="left" style={delay(0.2)} className="mt-5 max-w-xl leading-8 text-fg-muted">Mỗi hệ thống được bàn giao kèm ứng dụng giám sát. Xem điện năng sinh ra, tiêu thụ và lưu trữ theo thời gian thực — biết chính xác mình đang tiết kiệm bao nhiêu, ở bất cứ đâu.</p>

          <div data-reveal-stagger="up" data-reveal-step="0.12" className="mt-8 grid gap-3 sm:grid-cols-3">
            {flows.map(({ label, desc, value, Icon, tone }) => (
              <div key={label} className="t15-glass-dark rounded-3xl p-5 transition hover:bg-glass-strong">
                <div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></span><span className="text-sm font-black text-fg">{value}</span></div>
                <div className="mt-4 font-black">{label}</div>
                <p className="mt-1 text-xs leading-5 text-fg-muted">{desc}</p>
              </div>
            ))}
          </div>

          <ul data-reveal-stagger="left" data-reveal-step="0.08" className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map(([Icon, text]) => <li key={text} className="flex items-center gap-3 text-sm font-semibold text-fg"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-glass-strong"><Icon className="h-4 w-4 text-accent-ink" /></span>{text}</li>)}
          </ul>

          <Link data-reveal="up" style={delay(0.2)} href="/lien-he" className="t15-button mt-10 bg-accent text-on-accent hover:brightness-105">Xem demo ứng dụng <ArrowRightIcon className="h-4 w-4" /></Link>
        </div>

        <div className="flex justify-center">
        <div className="relative -mb-24 w-[380px] shrink-0 origin-top scale-[.84] sm:mb-0 sm:scale-100">
          <div aria-hidden className="absolute left-1/2 top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/15" />
          <div aria-hidden className="absolute left-1/2 top-[42%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent-soft)/.3),transparent_68%)]" />
          <div data-reveal="up" style={delay(0.15)}><HandHoldingPhone /></div>
          <div data-reveal="left" style={delay(0.55)} className="t15-glass t15-float absolute -left-24 top-[34%] hidden rounded-2xl px-4 py-3 text-fg sm:block lg:-left-32">
            <div className="text-[10px] font-bold uppercase tracking-[.12em] text-fg-muted">Tiết kiệm tháng này</div>
            <div className="text-lg font-black">128,4 triệu ₫</div>
          </div>
          <div data-reveal="right" style={delay(0.7)} className="t15-glass t15-float-delay absolute -right-28 top-[6%] hidden max-w-[190px] items-start gap-2 rounded-2xl px-3 py-3 text-fg sm:flex lg:-right-10">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-accent-ink"><BellAlertIcon className="h-4 w-4" /></span>
            <div className="text-[11px] font-semibold leading-4"><b className="block text-xs">String 3 giảm 8%</b>Đề xuất vệ sinh tấm pin</div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
