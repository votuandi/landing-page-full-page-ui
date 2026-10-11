import { Battery50Icon, BellAlertIcon, BoltIcon, ChartBarIcon, DevicePhoneMobileIcon, SunIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { MediaImage, delay } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { energyMonitoring } from "./schema";
import { HandHoldingPhone } from "./t15";

const FLOW_ICONS = [SunIcon, BoltIcon, Battery50Icon];
const FEATURE_ICONS = [BellAlertIcon, ChartBarIcon, UserGroupIcon, DevicePhoneMobileIcon];

/** Original navy split layout; the phone reads the same chart and flow data as t15. */
export default function EnergyMonitoringT08({ data, site, sectionId }: SectionPropsOf<typeof energyMonitoring>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="t15-screen relative isolate overflow-hidden bg-primary py-16 text-on-primary md:py-24">
    <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[520px] w-[520px] rounded-pill bg-glow-accent-25" />
    <div className="t15-container grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
      <div>
        <span data-reveal="down" className="inline-flex items-center gap-2 rounded-pill border border-on-primary/20 bg-on-primary/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest backdrop-blur-glass">{t(data.eyebrow)}</span>
        <h2 id={`${sectionId}-title`} data-reveal="left" style={delay(0.1)} className="mt-5 max-w-2xl text-4xl font-black leading-[1.08] tracking-[-.04em] sm:text-5xl">{t(data.title)}</h2>
        <p data-reveal="left" style={delay(0.2)} className="mt-5 max-w-xl leading-8">{t(data.description)}</p>
        <div data-reveal-stagger="up" data-reveal-step="0.12" className="mt-8 grid gap-3 sm:grid-cols-3">
          {data.flows.map((flow, i) => { const Icon = FLOW_ICONS[i % 3]; return <div key={i} className="rounded-card border border-on-primary/15 bg-on-primary/10 p-5 backdrop-blur-glass">
            <div className="flex items-center justify-between gap-2"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-input bg-accent text-on-accent"><Icon aria-hidden className="h-5 w-5" /></span><span className="text-sm font-black">{flow.value} {t(flow.unit)}</span></div>
            <div className="mt-4 font-black">{t(flow.label)}</div>
          </div>; })}
        </div>
        <ul data-reveal-stagger="left" data-reveal-step="0.08" className="mt-8 grid gap-3 sm:grid-cols-2">
          {data.features.map((feature, i) => { const Icon = FEATURE_ICONS[i % 4]; return <li key={i} className="flex items-center gap-3 text-sm font-semibold"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-on-primary/10"><Icon aria-hidden className="h-4 w-4" /></span><span>{t(feature.title)}{feature.description && <span className="block text-xs font-medium">{t(feature.description)}</span>}</span></li>; })}
        </ul>
      </div>
      <div className="flex justify-center">
        <div className="relative -mb-24 w-[380px] shrink-0 origin-top scale-[.84] sm:mb-0 sm:scale-100">
          <div aria-hidden className="absolute left-1/2 top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-pill border border-on-primary/10" />
          <div aria-hidden className="absolute left-1/2 top-[42%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-pill bg-glow-accent-30" />
          <div data-reveal="up" style={delay(0.15)}>{data.image ? <div className="relative h-[660px] w-[380px]"><MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} sizes="380px" className="!object-contain" /></div> : <HandHoldingPhone data={data} t={t} sectionId={sectionId} />}</div>
        </div>
      </div>
    </div>
  </section>;
}
