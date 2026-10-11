import { Battery50Icon, BoltIcon, SunIcon } from "@heroicons/react/24/outline";
import { MediaImage } from "@solar/ui";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import { EquipmentIllustration } from "../shared/illustrations/t07/SolarIllustrations";
import type { energyMonitoring } from "./schema";

const ICONS = [SunIcon, BoltIcon, Battery50Icon];

export default function EnergyMonitoringT07({ data, site, sectionId }: SectionPropsOf<typeof energyMonitoring>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  return <section aria-labelledby={`${sectionId}-title`} className="flex min-h-section items-center bg-primary-deep py-section text-on-media">
    <div className="mx-auto grid w-full max-w-container items-center gap-10 px-6 sm:px-7 lg:grid-cols-2">
      <div data-reveal="left">
        <p className="inline-flex rounded-pill border border-on-media/25 bg-on-media/10 px-3 py-2 text-xs font-semibold">{t(data.eyebrow)}</p>
        <h2 id={`${sectionId}-title`} className="mt-6 whitespace-pre-line font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t(data.title)}</h2>
        <p className="mt-5 max-w-xl text-sm leading-7 text-on-media/80">{t(data.description)}</p>
        <ul className="mt-8 space-y-5">{data.features.map((feature, i) => { const Icon = ICONS[i % ICONS.length]; return <li key={i} data-reveal="left" className="flex gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-accent text-on-accent"><Icon aria-hidden className="h-5 w-5" /></span><div><h3 className="font-bold">{t(feature.title)}</h3>{feature.description && <p className="mt-1 text-sm leading-6 text-on-media/80">{t(feature.description)}</p>}</div></li>; })}</ul>
        <p className="mt-8 text-xs leading-6 text-on-media/80">{t({ vi: "[DỮ LIỆU MẪU] Chỉ số phụ thuộc inverter, công tơ và cấu hình lưu trữ. Cần Internet để xem từ xa.", en: "[SAMPLE DATA] Readings depend on inverter, meter and storage configuration. Remote monitoring requires Internet." })}</p>
      </div>
      <div data-reveal="right" className="overflow-hidden rounded-media bg-bg-elevated text-fg">
        <div className="relative aspect-[4/5] sm:aspect-square">{data.image ? <MediaImage src={mediaSrc(data.image)} alt={t(data.image.alt)} sizes="(max-width:1023px) 100vw, 50vw" /> : <div className="flex h-full items-center p-5"><EquipmentIllustration /></div>}</div>
        <dl className="grid gap-3 p-5 sm:grid-cols-3">{data.flows.map((flow, i) => <div key={i} className="rounded-card bg-bg-sky p-3"><dt className="text-xs text-fg-muted">{t(flow.label)}</dt><dd className="mt-2 text-xl font-extrabold">{new Intl.NumberFormat(site.locale === "vi" ? "vi-VN" : "en-US").format(flow.value)} <span className="text-xs">{t(flow.unit)}</span></dd></div>)}</dl>
      </div>
    </div>
  </section>;
}
