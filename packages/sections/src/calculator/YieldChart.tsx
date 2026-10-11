import { useId } from "react";
import { formatNumber, formatVnd, type estimatePackage } from "@solar/core";
import type { Locale } from "../site";

export function YieldChart({ result, name, locale }: { result: ReturnType<typeof estimatePackage>; name: string; locale: Locale }) {
  const id = useId(), en = locale === "en";
  const maxYield = Math.max(1, ...result.monthly.map((m) => m.kwh));
  const values = result.cumulative.map((v) => v.net), min = Math.min(...values), max = Math.max(0, ...values), range = max - min || 1;
  const y = (v: number) => 175 - ((v - min) / range) * 135;
  const x = (year: number) => 50 + (year / (result.cumulative.length - 1)) * 410;
  return <div className="mt-4 grid gap-5">
    <figure><figcaption className="text-sm font-semibold">{en ? "Monthly yield" : "Sản lượng 12 tháng"} · {name}</figcaption>
      <svg viewBox="0 0 480 220" role="img" aria-labelledby={`${id}-monthly`} className="w-full text-fg-muted">
        <title id={`${id}-monthly`}>{`${en ? "Simulated monthly output" : "Sản lượng mô phỏng từng tháng"}: ${name}`}</title>
        <line x1="45" y1="175" x2="465" y2="175" className="stroke-line" />
        {result.monthly.map((m, i) => <g key={m.month}><rect x={50 + i * 34} y={175 - m.kwh / maxYield * 120} width="22" height={m.kwh / maxYield * 120} className="fill-chart-a"><title>{`${m.month}: ${formatNumber(m.kwh, 1)} kWh`}</title></rect><text x={61 + i * 34} y="197" textAnchor="middle" fill="currentColor">{m.month}</text></g>)}
      </svg>
      <details><summary className="min-h-11 cursor-pointer text-sm">{en ? "Monthly data" : "Xem số liệu từng tháng"}</summary><table className="w-full text-left text-sm"><caption className="sr-only">{name} · kWh</caption><thead><tr><th scope="col">{en ? "Month" : "Tháng"}</th><th scope="col">kWh</th></tr></thead><tbody>{result.monthly.map((m) => <tr key={m.month}><th scope="row">{m.month}</th><td>{formatNumber(m.kwh, 1)}</td></tr>)}</tbody></table></details>
    </figure>
    <figure><figcaption className="text-sm font-semibold">{en ? "Cumulative payback" : "Hoàn vốn tích lũy"} · {name}</figcaption>
      <svg viewBox="0 0 480 225" role="img" aria-labelledby={`${id}-payback`} className="w-full text-fg-muted">
        <title id={`${id}-payback`}>{`${en ? "Net cash flow after investment" : "Dòng tiền ròng sau vốn đầu tư"}: ${name}`}</title>
        <line x1="50" y1={y(0)} x2="460" y2={y(0)} className="stroke-line" strokeDasharray="4 4" />
        <polyline points={result.cumulative.map((v) => `${x(v.year)},${y(v.net)}`).join(" ")} className="stroke-chart-b" fill="none" strokeWidth="3" />
        {result.cumulative.filter((v) => v.year % 5 === 0).map((v) => <text key={v.year} x={x(v.year)} y="200" textAnchor="middle" fill="currentColor">{v.year}</text>)}
      </svg>
      <details><summary className="min-h-11 cursor-pointer text-sm">{en ? "Yearly cash flow" : "Xem dòng tiền theo năm"}</summary><div className="overflow-x-auto" tabIndex={0} role="region" aria-label={en ? "Cash flow table" : "Bảng dòng tiền"}><table className="w-full text-left text-sm"><caption className="sr-only">{name} · {en ? "net cash flow" : "dòng tiền ròng"}</caption><thead><tr><th scope="col">{en ? "Year" : "Năm"}</th><th scope="col">{en ? "Savings" : "Tiết kiệm lũy kế"}</th><th scope="col">{en ? "Net" : "Ròng sau đầu tư"}</th></tr></thead><tbody>{result.cumulative.map((v) => <tr key={v.year}><th scope="row">{v.year}</th><td>{formatVnd(v.savings)}</td><td>{formatVnd(v.net)}</td></tr>)}</tbody></table></div></details>
    </figure>
  </div>;
}
