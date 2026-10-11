import { pickLocale } from "../fields";
import type { LocalizedText } from "../define";
import type { Locale } from "../site";

type Chart = { production: number[]; consumption: number[]; productionLabel: LocalizedText; consumptionLabel: LocalizedText };

/** Hai đường dùng chung trục; 24 mẫu theo giờ từ 00:00 đến 23:00. */
export function powerChartPoints(values: number[], maximum: number) {
  return values.map((value, hour) => `${48 + hour / 23 * 528},${194 - value / Math.max(1, maximum) * 176}`).join(" ");
}

export default function PowerChart({ chart, locale, title, unit, id }: {
  chart: Chart; locale: Locale; title: string; unit: string; id: string;
}) {
  const maximum = Math.max(1, ...chart.production, ...chart.consumption);
  const t = (text: LocalizedText) => pickLocale(text, locale);
  return <figure>
    <svg viewBox="0 0 600 228" className="w-full" role="img" aria-labelledby={`${id}-chart-title ${id}-chart-desc`}>
      <title id={`${id}-chart-title`}>{title}</title>
      <desc id={`${id}-chart-desc`}>{t(chart.productionLabel)} / {t(chart.consumptionLabel)} · 00:00–23:00 · {unit}</desc>
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
        const y = 194 - fraction * 176;
        return <g key={fraction}><line x1="48" y1={y} x2="576" y2={y} stroke="currentColor" className="text-line/15" />
          <text x="40" y={y + 4} textAnchor="end" fill="currentColor" className="text-fg-muted" fontSize="11">{Math.round(fraction * maximum)}</text></g>;
      })}
      <polyline points={powerChartPoints(chart.consumption, maximum)} fill="none" stroke="currentColor" className="text-chart-b" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <polyline points={powerChartPoints(chart.production, maximum)} fill="none" stroke="currentColor" className="text-chart-a" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      {[0, 6, 12, 18, 23].map((hour) => <text key={hour} x={48 + hour / 23 * 528} y="218" textAnchor="middle" fill="currentColor" className="text-fg-muted" fontSize="11">{String(hour).padStart(2, "0")}:00</text>)}
    </svg>
    <figcaption className="mt-3 flex flex-wrap gap-5 text-sm text-fg-muted">
      <span className="flex items-center gap-2"><i aria-hidden className="h-1 w-5 bg-chart-a" />{t(chart.productionLabel)}</span>
      <span className="flex items-center gap-2"><i aria-hidden className="h-1 w-5 bg-chart-b" />{t(chart.consumptionLabel)}</span><span>{unit}</span>
    </figcaption>
  </figure>;
}
