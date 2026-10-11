import { formatNumber } from "@solar/core";
import type { SectionPropsOf } from "../define";
import { pickLocale } from "../fields";
import type { energyMonitoring } from "./schema";

/** Energy monitoring t10: nền mực, cột chữ trái; bảng kính phải gồm chỉ số, biểu đồ 24h (sản lượng/tiêu thụ) và danh sách điểm. */
export default function EnergyMonitoringT10({ data, site, sectionId }: SectionPropsOf<typeof energyMonitoring>) {
  const t = (value: { vi: string; en?: string }) => pickLocale(value, site.locale);
  const max = Math.max(1, ...data.chart.production, ...data.chart.consumption);
  const points = (values: number[]) => values.map((v, i) => `${((i * 560) / 23).toFixed(1)},${(200 - (v / max) * 190).toFixed(1)}`).join(" ");
  const titleId = `${sectionId}-title`;
  return (
    <section aria-labelledby={titleId} className="t15-section bg-bg-deep text-on-media">
      <div className="t15-container grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div data-reveal="up">
          <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-secondary-deep">{t(data.eyebrow)}</p>
          <h2 id={titleId} className="mt-6 text-4xl font-black leading-tight tracking-tight">{t(data.title)}</h2>
          <p className="mt-5 leading-8 text-on-media/80">{t(data.description)}</p>
        </div>
        <div data-reveal="up" className="rounded-card border border-on-media/20 bg-on-media/10 p-5 sm:p-7">
          <dl className="grid grid-cols-3 gap-3">
            {data.flows.map((flow, i) => {
              const unit = t(flow.unit);
              return (
                <div key={i} className="flex flex-col-reverse rounded-2xl bg-on-media/10 p-3">
                  <dd className="mt-2 text-base font-black sm:text-xl">{formatNumber(flow.value)}{unit.startsWith("%") ? "" : " "}{unit}</dd>
                  <dt className="text-2xs text-on-media/80">{t(flow.label)}</dt>
                </div>
              );
            })}
          </dl>
          <svg role="img" aria-label={`${t(data.chart.productionLabel)} / ${t(data.chart.consumptionLabel)}`} viewBox="-20 -10 610 250" className="mt-7 w-full">
            <g className="text-on-media/15" stroke="currentColor">
              {[0, 50, 100, 150, 200].map((y) => <line key={y} x1="0" x2="560" y1={y} y2={y} />)}
            </g>
            <polyline points={points(data.chart.consumption)} fill="none" stroke="currentColor" strokeWidth="3" className="text-chart-b" />
            <polygon points={`0,200 ${points(data.chart.production)} 560,200`} fill="currentColor" className="text-chart-a/15" />
            <polyline points={points(data.chart.production)} fill="none" stroke="currentColor" strokeWidth="4" className="text-chart-a" />
            <g fill="currentColor" fontSize="12" className="text-bg-sky">
              <text x="0" y="230">00:00</text><text x="265" y="230">12:00</text><text x="530" y="230">23:00</text>
            </g>
          </svg>
          <div className="flex gap-5 text-xs">
            <span className="text-chart-a">● {t(data.chart.productionLabel)}</span>
            <span className="text-chart-b">● {t(data.chart.consumptionLabel)}</span>
          </div>
          {data.features.length > 0 && (
            <ul className="mt-6 space-y-2">
              {data.features.map((feature, i) => (
                <li key={i} className="flex justify-between gap-3 border-t border-on-media/10 pt-3 text-xs">
                  <span>{t(feature.title)}</span>
                  {feature.description && <span className="text-on-media/80">{t(feature.description)}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
