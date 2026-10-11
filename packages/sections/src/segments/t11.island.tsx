"use client";
import { useSyncExternalStore } from "react";
import type { z } from "zod";
import { MediaImage } from "@solar/ui";
import { pickLocale } from "../fields";
import { mediaSrc } from "../shared/media";
import type { Locale } from "../site";
import { useSegment } from "../state/SiteState";
import type { segmentsSchema } from "./schema";

const subscribe = () => () => {};

export default function SegmentComparison({ data, locale, sectionId }: { data: z.output<typeof segmentsSchema>; locale: Locale; sectionId: string }) {
  const shared = useSegment();
  const interactive = useSyncExternalStore(subscribe, () => true, () => false);
  const en = locale === "en", t = (v: { vi: string; en?: string }) => pickLocale(v, locale);
  const index = Math.max(0, data.items.findIndex((s) => s.segment === shared.segment));
  const tabId = (i: number) => `${sectionId}-tab-${i}`, panelId = (i: number) => `${sectionId}-panel-${i}`;
  const points = (values: number[]) => values.map((v, h) => `${45 + h / 23 * 535},${190 - v / 100 * 140}`).join(" ");
  return <div className="mt-8">
    <div role={interactive ? "tablist" : "group"} aria-label={en ? "Electricity usage segments" : "Phân khúc sử dụng điện"} className="flex flex-wrap gap-2 border-b border-line pb-4">{data.items.map((s, i) => <button type="button" role={interactive ? "tab" : undefined} id={tabId(i)} key={s.segment} aria-selected={interactive ? index === i : undefined} aria-controls={panelId(i)} tabIndex={interactive && index !== i ? -1 : 0} onClick={() => shared.setSegment(s.segment, "segments")} onKeyDown={(e) => {
      let next: number;
      if (e.key === "ArrowRight") next = (i + 1) % data.items.length;
      else if (e.key === "ArrowLeft") next = (i + data.items.length - 1) % data.items.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = data.items.length - 1;
      else return;
      e.preventDefault(); shared.setSegment(data.items[next].segment, "segments"); document.getElementById(tabId(next))?.focus();
    }} className={`min-h-11 rounded-button border px-5 py-2 text-sm font-semibold ${index === i ? "border-primary bg-primary text-on-primary" : "border-line bg-bg-elevated text-fg"}`}>{t(s.label)}</button>)}</div>
    {data.items.map((s, i) => <div key={s.segment} id={panelId(i)} role={interactive ? "tabpanel" : undefined} aria-labelledby={tabId(i)} hidden={interactive && i !== index} className="mt-6">
      <div data-reveal="up" className="grid gap-7 lg:grid-cols-2"><div className="rounded-card border border-line bg-bg-elevated p-6"><h3 className="font-display text-xl font-semibold">{t(s.comparison?.title ?? s.label)}</h3><p className="mt-3 text-fg-muted">{t(s.pitch)}</p>
        {s.comparison && data.solarProfile ? <figure className="mt-5"><figcaption className="text-sm font-semibold">{en ? "Daily solar and consumption profile" : "Nhịp nắng và tiêu thụ điện trong ngày"}</figcaption><p className="mt-2 text-xs">{en ? "Solid: sun · dashed: consumption" : "Nắng: đường liền · Tiêu thụ: đường đứt"}</p><svg viewBox="0 0 620 235" role="img" aria-labelledby={`${panelId(i)}-chart`} className="mt-3 w-full text-fg-muted"><title id={`${panelId(i)}-chart`}>{`[DỮ LIỆU MẪU] ${t(s.label)} · ${en ? "relative index 0–100" : "chỉ số tương đối 0–100"}`}</title>{[0, 50, 100].map((v) => <g key={v}><line x1="45" y1={190 - v / 100 * 140} x2="580" y2={190 - v / 100 * 140} className="stroke-line" /><text x="30" y={194 - v / 100 * 140} textAnchor="end" fill="currentColor">{v}</text></g>)}<polyline points={points(data.solarProfile)} className="stroke-chart-a" fill="none" strokeWidth="4" /><polyline points={points(s.comparison.consumption)} className="stroke-chart-b" fill="none" strokeWidth="3" strokeDasharray="7 3" />{[0, 6, 12, 18, 23].map((h) => <text key={h} x={45 + h / 23 * 535} y="218" textAnchor="middle" fill="currentColor">{h}h</text>)}</svg><p className="text-xs leading-6 text-fg-muted">[DỮ LIỆU MẪU] {en ? "Relative load profile, not measured kWh." : "Mẫu phụ tải minh họa, không phải kWh đo thực."}</p><details><summary className="min-h-11 cursor-pointer text-sm">{en ? "24-hour data" : "Xem số liệu 24 giờ"}</summary><table className="w-full text-left text-sm"><caption className="sr-only">[DỮ LIỆU MẪU] {t(s.label)}</caption><thead><tr><th scope="col">{en ? "Hour" : "Giờ"}</th><th scope="col">{en ? "Sun" : "Nắng"}</th><th scope="col">{en ? "Load" : "Tiêu thụ"}</th></tr></thead><tbody>{s.comparison.consumption.map((v, h) => <tr key={h}><th scope="row">{h}h</th><td>{data.solarProfile?.[h]}</td><td>{v}</td></tr>)}</tbody></table></details></figure> : <div className="relative mt-5 aspect-video overflow-hidden rounded-media"><MediaImage src={mediaSrc(s.image)} alt={t(s.image.alt)} sizes="(max-width:1024px) 100vw, 560px" /></div>}
      </div><div>{s.comparison ? <><div className="overflow-x-auto" tabIndex={0} role="region" aria-label={en ? "System comparison table" : "Bảng so sánh hệ thống"}><table className="w-full border-collapse text-left text-sm"><caption className="mb-4 text-left font-semibold">{en ? "Comparison for" : "Đối chiếu cho"} {t(s.label)}</caption><thead className="bg-bg-tint"><tr><th scope="col" className="p-4">{en ? "Criteria" : "Tiêu chí"}</th><th scope="col" className="p-4">{en ? "Grid-tied" : "Hòa lưới"}</th><th scope="col" className="p-4">Hybrid</th></tr></thead><tbody>{(["advantages", "limitations"] as const).map((key) => <tr key={key} className="border-b border-line"><th scope="row" className="p-4">{key === "advantages" ? (en ? "Advantages" : "Lợi thế") : (en ? "Considerations" : "Cần cân nhắc")}</th><td className="p-4">{t(s.comparison![key]["hoa-luoi"])}</td><td className="p-4">{t(s.comparison![key].hybrid)}</td></tr>)}</tbody></table></div><div className="mt-5 border-l-4 border-accent bg-bg-sun p-5"><strong>{en ? "Survey considerations" : "Điểm cần khảo sát"}</strong><p className="mt-2 text-sm">{t(s.comparison.recommendation)}</p></div></> : <p className="rounded-card bg-bg-tint p-6">{t(data.savingLabel)}: {s.saving}</p>}</div></div>
    </div>)}
  </div>;
}
