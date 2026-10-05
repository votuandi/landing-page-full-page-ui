import Image from "next/image";
import {
  BellAlertIcon,
  BoltIcon,
  ChartBarSquareIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

const benefits = [
  {
    icon: BoltIcon,
    title: "Theo dõi theo thời gian thực",
    description: "Nắm ngay sản lượng solar, mức tiêu thụ và lượng điện mua từ hoặc phát lên lưới.",
  },
  {
    icon: ChartBarSquareIcon,
    title: "Dữ liệu trực quan, dễ hiểu",
    description: "Biểu đồ ngày, tuần và tháng giúp người dùng nhìn nhanh xu hướng sử dụng điện và hiệu suất hệ thống.",
  },
  {
    icon: BellAlertIcon,
    title: "Cảnh báo bất thường",
    description: "Nhận cảnh báo khi sản lượng giảm, mức tiêu thụ tăng hoặc thiết bị cần được kiểm tra.",
  },
  {
    icon: DevicePhoneMobileIcon,
    title: "Quản lý mọi lúc, mọi nơi",
    description: "Theo dõi hệ thống thuận tiện trên cả dashboard web và ứng dụng di động.",
  },
];

const mobileMetrics = [
  ["Solar", "24.8 kW"],
  ["Tiêu thụ", "18.1 kW"],
  ["Lưới", "-6.7 kW"],
];

export default function EnergyMonitoringSection() {
  return (
    <section className="t5-section bg-white">
      <div className="t5-container">
        <div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
          <div>
            <span className="t5-eyebrow">Smart energy management</span>
            <h2 className="t5-heading">Mọi chỉ số năng lượng đều nằm trong tầm mắt</h2>
            <p className="t5-subheading">
              Từ sản lượng phát điện đến mức tiêu thụ và cảnh báo bất thường, tất cả được hiển thị trực quan để doanh nghiệp dễ dàng kiểm soát.
            </p>

            <div className="mt-8 grid gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2">
              {benefits.map(({ icon: Icon, title, description }) => (
                <article key={title} className="bg-white p-5">
                  <div className="flex h-10 w-10 items-center justify-center bg-[var(--t5-primary)] text-[var(--t5-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-black text-[var(--t5-primary)]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-px border border-slate-200 bg-slate-200">
              {[
                ["24/7", "Giám sát"],
                ["Realtime", "Dữ liệu"],
                ["Web + App", "Truy cập"],
              ].map(([value, label]) => (
                <div key={label} className="bg-slate-50 p-4">
                  <div className="text-lg font-black text-[var(--t5-burgundy)] sm:text-xl">{value}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-[.13em] text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[560px] overflow-hidden border border-slate-200 bg-[var(--t5-primary)] shadow-2xl">
            <Image
              src="/images/solar-installation-hero.jpg"
              alt="Hệ thống điện mặt trời nhà xưởng được theo dõi qua dashboard và ứng dụng quản lý năng lượng"
              fill
              className="object-cover opacity-35"
              sizes="(max-width:1024px) 100vw, 58vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--t5-primary)] via-[var(--t5-primary)]/88 to-[var(--t5-burgundy)]/70" />

            <div className="relative flex min-h-[560px] items-center p-5 sm:p-8">
              <div className="w-full">
                <div className="mx-auto max-w-[760px] border border-white/15 bg-[#f8fafc] p-3 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-3 pb-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Energy management dashboard</div>
                      <div className="mt-1 font-black text-[var(--t5-primary)]">Live Energy Overview</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {[
                      ["Solar generation", "24.8 kW", "+12%"],
                      ["Consumption", "18.1 kW", "+5%"],
                      ["Grid export", "6.7 kW", "Live"],
                      ["Battery", "80%", "Charging"],
                    ].map(([label, value, note], index) => (
                      <div key={label} className="border border-slate-200 bg-white p-3">
                        <div className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</div>
                        <div className="mt-2 text-lg font-black text-[var(--t5-primary)]">{value}</div>
                        <div className={`mt-1 text-[10px] font-bold ${index === 0 ? "text-emerald-600" : "text-slate-400"}`}>{note}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[.9fr_1.1fr]">
                    <div className="border border-slate-200 bg-white p-4">
                      <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Energy flow</div>
                      <div className="mt-7 grid grid-cols-3 items-center gap-2 text-center">
                        <div><div className="mx-auto flex h-12 w-12 items-center justify-center bg-[var(--t5-accent)] text-xl">☀</div><div className="mt-2 text-xs font-black">SOLAR</div></div>
                        <div className="relative h-px bg-[var(--t5-burgundy)]"><span className="absolute -right-1 -top-[4px] h-2 w-2 rotate-45 border-r-2 border-t-2 border-[var(--t5-burgundy)]" /></div>
                        <div><div className="mx-auto flex h-12 w-12 items-center justify-center bg-[var(--t5-primary)] text-xl text-white">▣</div><div className="mt-2 text-xs font-black">FACTORY</div></div>
                      </div>
                      <div className="mt-8 border-t border-slate-100 pt-4">
                        <div className="flex items-center justify-between text-xs"><span className="text-slate-500">Self-consumption</span><strong className="text-[var(--t5-primary)]">92.3%</strong></div>
                        <div className="mt-2 h-2 bg-slate-100"><div className="h-full w-[92%] bg-[var(--t5-accent)]" /></div>
                      </div>
                    </div>

                    <div className="border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Generation & consumption</div>
                        <div className="text-[9px] font-bold text-slate-400">TODAY</div>
                      </div>
                      <svg viewBox="0 0 360 160" className="mt-4 w-full" role="img" aria-label="Biểu đồ sản lượng và tiêu thụ điện trong ngày">
                        {[35,70,105,140].map((y) => <line key={y} x1="10" y1={y} x2="350" y2={y} stroke="#e2e8f0" />)}
                        <path d="M10 138 C48 138,58 126,86 96 C118 60,145 22,180 26 C217 30,230 72,252 100 C278 130,312 138,350 138" fill="rgba(245,185,39,.18)" stroke="#f5b927" strokeWidth="4" />
                        <path d="M10 112 C55 109,80 116,112 104 C145 92,169 103,200 94 C234 83,262 100,292 86 C315 75,330 91,350 82" fill="none" stroke="#8c1d2c" strokeWidth="3" />
                      </svg>
                      <div className="mt-1 flex gap-4 text-[9px] font-bold text-slate-400"><span><i className="mr-1 inline-block h-2 w-2 bg-[var(--t5-accent)]" />Solar</span><span><i className="mr-1 inline-block h-2 w-2 bg-[var(--t5-burgundy)]" />Consumption</span></div>
                    </div>
                  </div>
                </div>

                <div className="relative -mt-10 ml-auto w-[190px] border-[6px] border-[#08182c] bg-white p-3 shadow-2xl sm:mr-8 sm:w-[220px]">
                  <div className="flex items-center justify-between"><strong className="text-xs text-[var(--t5-primary)]">Live Status</strong><span className="text-[9px] text-emerald-600">● Online</span></div>
                  <div className="mt-3 space-y-2">
                    {mobileMetrics.map(([label, value], index) => (
                      <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[10px] font-bold text-slate-500">{label}</span>
                        <strong className={index === 0 ? "text-xs text-[var(--t5-burgundy)]" : "text-xs text-[var(--t5-primary)]"}>{value}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 h-14 border border-slate-100 bg-slate-50 p-2">
                    <div className="flex h-full items-end gap-1">{[20,34,56,76,91,72,52,31].map((height, index) => <span key={index} className="flex-1 bg-[var(--t5-accent)]" style={{ height: `${height}%` }} />)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 border-l-4 border-[var(--t5-accent)] bg-[var(--t5-primary)]/90 px-4 py-3 text-xs font-bold text-white backdrop-blur sm:bottom-6 sm:left-6">
              Theo dõi hệ thống trên cả dashboard web và ứng dụng di động.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
