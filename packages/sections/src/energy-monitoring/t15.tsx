import { delay } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import { MediaImage } from "@solar/ui";
import type { energyMonitoring } from "./schema";
type Data = SectionPropsOf<typeof energyMonitoring>["data"];
type Text = { vi: string; en?: string };
type Translate = (text: Text) => string;

import { Battery50Icon, BellAlertIcon, BoltIcon, ChartBarIcon, DevicePhoneMobileIcon, HomeIcon, SunIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const FLOW_ICONS = [SunIcon, BoltIcon, Battery50Icon];
const FLOW_TONES = ["bg-accent text-on-accent", "bg-primary-strong text-on-media", "bg-primary text-on-primary"];
const FEATURE_ICONS = [BellAlertIcon, ChartBarIcon, UserGroupIcon, DevicePhoneMobileIcon];

function toPath(values: number[], close: boolean) {
  const pts = values.map((v, i) => `${(i / 23) * 220},${92 - (v / 200) * 84}`);
  return close ? `M0,92 L${pts.join(" L")} L220,92 Z` : `M${pts.join(" L")}`;
}

function PhoneDashboard({ data, t, sectionId }: { data: Data; t: Translate; sectionId: string }) {
  return (
    <div className="absolute left-[60px] top-[10px] h-[540px] w-[260px] rounded-dashboard bg-device p-[9px] shadow-dashboard">
      <div className="relative h-full w-full overflow-hidden rounded-screen bg-gradient-to-b from-bg-elevated to-bg-tint text-fg">
        <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-device" />
        <div className="flex items-center justify-between px-5 pt-2.5 text-4xs font-bold"><span>9:41</span><span className="tracking-tighter">●●● ▮</span></div>

        <div className="px-4 pt-5">
          <div className="flex items-center justify-between">
            <div><div className="text-4xs font-semibold text-fg-muted">{t({ vi: "Xin chào,", en: "Hello," })}</div><div className="text-body-sm font-black">{t({ vi: "Hệ thống của bạn", en: "Your system" })}</div></div>
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-5xs font-bold text-success"><span className="h-1.5 w-1.5 animate-pulse motion-reduce:animate-none rounded-full bg-primary" />{t({ vi: "Trực tuyến", en: "Online" })}</span>
          </div>

          <div className="mt-3 rounded-2xl bg-primary p-3 text-on-primary">
            <div className="flex items-start justify-between">
              <div><div className="text-5xs font-semibold uppercase tracking-wider text-on-primary/75">{t(data.chart.productionLabel)}</div><div className="mt-0.5 text-xl font-black">{data.flows[0].value} <span className="text-4xs font-semibold text-on-primary/75">{t(data.flows[0].unit)}</span></div></div>
              <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-on-primary/25" strokeWidth="4" /><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-accent" strokeWidth="4" strokeDasharray="94.2" strokeDashoffset="20" strokeLinecap="round" /></svg>
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {data.flows.map((flow, i) => { const Icon = FLOW_ICONS[i % 3]; const tone = FLOW_TONES[i % 3]; return (
              <div key={i} className="rounded-xl bg-bg-elevated/95 p-2 shadow-sm">
                <span className={`grid h-5 w-5 place-items-center rounded-full ${tone}`}><Icon className="h-3 w-3" /></span>
                <div className="mt-1.5 text-2xs font-black">{flow.value} {t(flow.unit)}</div>
                <div className="text-6xs font-semibold text-fg-muted">{t(flow.label)}</div>
              </div>
            ); })}
          </div>

          <div className="mt-2.5 rounded-2xl bg-bg-elevated/95 p-2.5 shadow-sm">
            <div className="flex items-center justify-between text-5xs font-bold"><span>{t(data.chart.productionLabel)} / {t(data.chart.consumptionLabel)}</span><span className="text-fg-subtle">24h</span></div>
            <svg viewBox="0 0 220 96" className="mt-1 h-[78px] w-full">
              <defs><linearGradient id={`${sectionId}-prod`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" className="text-chart-a" stopOpacity=".7" /><stop offset="1" stopColor="currentColor" className="text-chart-a" stopOpacity=".05" /></linearGradient></defs>
              <path d={toPath(data.chart.production, true)} fill={`url(#${sectionId}-prod)`} />
              <path d={toPath(data.chart.production, false)} fill="none" stroke="currentColor" className="text-chart-a" strokeWidth="1.5" />
              <path d={toPath(data.chart.consumption, false)} fill="none" stroke="currentColor" className="text-chart-b" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            <div className="mt-1 flex gap-3 text-6xs font-semibold text-fg-muted"><span className="flex items-center gap-1"><i className="h-1.5 w-3 rounded-full bg-chart-a" />{t(data.chart.productionLabel)}</span><span className="flex items-center gap-1"><i className="h-1.5 w-3 rounded-full bg-chart-b" />{t(data.chart.consumptionLabel)}</span></div>
          </div>


        </div>

        <div className="absolute inset-x-3 bottom-3 flex justify-around rounded-2xl bg-bg-elevated/95 py-2 text-fg-subtle shadow-sm backdrop-blur">
          <HomeIcon className="h-4 w-4 text-primary" /><ChartBarIcon className="h-4 w-4" /><BellAlertIcon className="h-4 w-4" /><UserGroupIcon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function HandHoldingPhone({ data, t, sectionId }: { data: Data; t: Translate; sectionId: string }) {
  const mask = "linear-gradient(to bottom, black 82%, transparent)"; // mask chỉ dùng kênh alpha, không phải màu hiển thị
  const fade = { maskImage: mask, WebkitMaskImage: mask };
  return (
    <div className="relative h-[660px] w-[380px]" role="img" aria-label={t(data.title)}>
      {/* Palm and wrist behind the phone */}
      <svg aria-hidden viewBox="0 0 380 660" className="absolute inset-0 h-full w-full" style={fade}>
        <path d={`M48 470 C 40 560, 90 630, 190 660 L 380 660 L 380 600 C 360 560, 350 470, 345 330 L 318 330 L 318 470 Z`} fill="currentColor" className="text-skin" />
        <path d="M200 660 C 260 640, 330 610, 380 600 L 380 660 Z" fill="currentColor" className="text-skin-shade" opacity=".6" />
        <path d="M250 660 L 380 585 L 380 660 Z" fill="currentColor" className="text-primary-strong" />
        <path d="M250 660 L 380 585 L 380 600 L 276 660 Z" fill="currentColor" className="text-accent" />
      </svg>
      <PhoneDashboard data={data} t={t} sectionId={sectionId} />
      {/* Thumb and fingertips wrapping the phone edges */}
      <svg aria-hidden viewBox="0 0 380 660" className="pointer-events-none absolute inset-0 h-full w-full" style={fade}>
        <path d="M30 610 C 18 540, 36 476, 74 438 C 90 422, 116 428, 114 452 C 112 470, 98 484, 92 508 C 86 534, 92 572, 104 612 Z" fill="currentColor" className="text-skin" />
        <path d="M74 438 C 90 422, 116 428, 114 452 C 106 448, 92 446, 80 452 Z" fill="currentColor" className="text-skin-shade" opacity=".5" />
        <ellipse cx="100" cy="440" rx="9" ry="12" transform="rotate(-35 100 440)" fill="currentColor" className="text-skin-light" />
        {[300, 350, 400, 450].map((y, i) => (
          <g key={y}>
            <rect x={302 + i * 2} y={y} width="52" height="40" rx="20" fill="currentColor" className="text-skin" />
            <ellipse cx={316 + i * 2} cy={y + 20} rx="8" ry="11" fill="currentColor" className="text-skin-light" />
            <path d={`M${330 + i * 2} ${y + 38} q 12 -2 22 -10`} stroke="currentColor" className="text-skin-shade" strokeWidth="2" fill="none" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function EnergyMonitoringT15({ data, site, sectionId }: SectionPropsOf<typeof energyMonitoring>) {
  const t = (value: Text) => pickLocale(value, site.locale);
  return (
    <section aria-labelledby={`${sectionId}-title`} className="t15-invert t15-screen relative isolate overflow-hidden t15-ocean py-16 text-fg md:py-24">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[520px] w-[520px] rounded-full bg-glow-accent-25" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/3 -z-10 h-[520px] w-[520px] rounded-full bg-glow-bg-tint-18" />
      <div aria-hidden className="t15-dots absolute inset-0 -z-10 opacity-[.07]" />

      <div className="t15-container grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <span data-reveal="down" className="inline-flex items-center gap-2 rounded-full border border-line/15 bg-glass-strong px-3 py-1.5 text-xs font-black uppercase tracking-[.18em] text-accent-ink backdrop-blur"><span className="h-1.5 w-1.5 animate-pulse motion-reduce:animate-none rounded-full bg-accent-soft" />{t(data.eyebrow)}</span>
          <h2 id={`${sectionId}-title`} data-reveal="left" style={delay(0.1)} className="mt-5 max-w-2xl text-4xl font-black leading-[1.08] tracking-[-.04em] sm:text-5xl">{t(data.title)}</h2>
          <p data-reveal="left" style={delay(0.2)} className="mt-5 max-w-xl leading-8 text-fg-muted">{t(data.description)}</p>

          <div data-reveal-stagger="up" data-reveal-step="0.12" className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
            {data.flows.map((flow, i) => { const Icon = FLOW_ICONS[i % 3]; const tone = FLOW_TONES[i % 3]; return (
              <div key={i} className="t15-glass-dark rounded-3xl p-3 transition hover:bg-glass-strong sm:p-5">
                <span className={`grid h-9 w-9 place-items-center rounded-2xl sm:h-10 sm:w-10 ${tone}`}><Icon className="h-5 w-5" /></span>
                <div className="mt-3 text-lg font-black tabular-nums text-fg sm:mt-4 sm:text-2xl">{flow.value} <span className="text-xs font-bold text-fg-muted">{t(flow.unit)}</span></div>
                <div className="mt-0.5 text-xs font-semibold text-fg-muted sm:text-sm">{t(flow.label)}</div>
                
              </div>
            ); })}
          </div>

          <ul data-reveal-stagger="left" data-reveal-step="0.08" className="mt-8 grid gap-3 sm:grid-cols-2">
            {data.features.map((feature, i) => { const Icon = FEATURE_ICONS[i % 4]; return <li key={i} className="flex items-center gap-3 text-sm font-semibold text-fg"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-glass-strong"><Icon className="h-4 w-4 text-accent-ink" /></span><span>{t(feature.title)}{feature.description && <span className="block text-xs font-medium text-fg-muted">{t(feature.description)}</span>}</span></li>; })}
          </ul>


        </div>

        <div className="flex justify-center">
        <div className="relative -mb-24 w-[380px] shrink-0 origin-top scale-[.84] sm:mb-0 sm:scale-100">
          <div aria-hidden className="absolute left-1/2 top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line/15" />
          <div aria-hidden className="absolute left-1/2 top-[42%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow-accent-soft-30" />
          <div data-reveal="up" style={delay(0.15)}>{data.image ? <div className="relative h-[660px] w-[380px]"><MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} sizes="380px" className="!object-contain" /></div> : <HandHoldingPhone data={data} t={t} sectionId={sectionId} />}</div>


        </div>
        </div>
      </div>
    </section>
  );
}
