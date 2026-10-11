"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { z } from "zod";
import { MediaImage } from "@solar/ui";
import { estimatePackage, formatNumber, formatVnd, summarizePackageEstimates } from "@solar/core";
import { pickLocale } from "../fields";
import type { ProjectItem } from "../collections/schemas";
import { CalculatorLink } from "../render/CalculatorLink";
import { storyQuoteLink } from "../shared/storyQuote";
import type { StoryView } from "../shared/storyView";
import type { Locale } from "../site";
import { useSegment } from "../state/SiteState";
import type { projectsSchema } from "./schema";

const StoryPlayer = dynamic(() => import("../shared/StoryPlayer.island"), { ssr: false });
type View = Omit<ProjectItem, "image"> & { imageSrc?: string; imageAlt: string };
export default function ProjectEvidence({ data, items, locale }: { data: z.output<typeof projectsSchema>; items: View[]; locale: Locale }) {
  const shared = useSegment(), en = locale === "en", t = (v: { vi: string; en?: string }) => pickLocale(v, locale);
  const [playing, setPlaying] = useState<{ stories: StoryView[]; index: number } | null>(null);
  const list = items.filter((item) => !data.showFilter || !shared.segment || item.segment === shared.segment);
  const stories: StoryView[] = list.flatMap((item) => item.video ? [{ id: item.id, title: item.title, location: item.location, kwp: item.kwp, segment: item.segment, poster: item.imageSrc, source: item.video, kindLabel: t(data.segmentLabels[item.segment]) }] : []);
  const rows = list.map((project) => {
    const evidence = data.evidence, entry = evidence?.cases.find((c) => c.projectId === project.id);
    const pkg = evidence?.simulation.packages.find((p) => p.id === entry?.packageId);
    const province = evidence?.simulation.provinces.find((p) => p.id === entry?.provinceId);
    const result = pkg && province && evidence ? estimatePackage(pkg, province, evidence.simulation.assumptions) : undefined;
    return { project, pkg, result, description: entry?.description };
  });
  const totals = summarizePackageEstimates(rows.map(({ project, pkg, result }) => ({ kwp: pkg?.kwp ?? project.kwp, annualKwh: result?.annualKwh ?? 0, annualSaving: result?.annualSaving ?? 0 })), data.evidence?.carbonKgPerKwh ?? 0);
  const metric = (label: string, value: string) => <div key={label}><dt className="text-xs text-fg-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
  return <>
    {data.showFilter && <div role="group" aria-label={en ? "Filter case studies" : "Lọc case study"} className="mt-8 flex flex-wrap gap-2">{([null, ...new Set(items.map((p) => p.segment))] as const).map((s) => <button key={s ?? "all"} type="button" aria-pressed={shared.segment === s} onClick={() => shared.setSegment(s, "projects")} className={`min-h-11 rounded-button border px-4 text-sm font-semibold ${shared.segment === s ? "border-primary bg-primary text-on-primary" : "border-line bg-bg-elevated text-fg"}`}>{s ? t(data.segmentLabels[s]) : t(data.allLabel)}</button>)}</div>}
    <div className="mt-7 grid gap-6 md:grid-cols-2">{rows.map(({ project, pkg, result, description }) => {
      const link = storyQuoteLink(project, locale, t(data.ctaLabel));
      const carbon = result ? summarizePackageEstimates([{ kwp: pkg!.kwp, ...result }], data.evidence!.carbonKgPerKwh).co2 : null;
      return <article data-reveal="up" key={project.id} className="overflow-hidden rounded-card border border-line bg-bg-elevated">
        <div className="relative aspect-video bg-bg-tint"><MediaImage src={project.imageSrc} alt={project.imageAlt} sizes="(max-width:767px) 100vw, 560px" /><span className="absolute left-4 top-4 rounded-pill bg-bg-elevated px-3 py-1 text-xs text-primary">{en ? "Case study" : "Tình huống minh họa"}</span>{project.video && <button type="button" onClick={() => setPlaying({ stories, index: stories.findIndex((s) => s.id === project.id) })} className="absolute bottom-4 right-4 min-h-11 rounded-button bg-accent px-4 font-semibold text-on-accent">{en ? "Watch video" : "Xem video"}</button>}</div>
        <div className="p-6"><p className="text-xs uppercase tracking-wide text-primary">{t(data.segmentLabels[project.segment])} · {project.location}</p><h3 className="mt-2 font-display text-xl font-semibold">{project.href ? <a href={project.href}>{project.title}</a> : project.title}</h3>{description && <p className="mt-3 text-sm leading-7 text-fg-muted">{t(description)}</p>}
          <dl className="mt-5 grid grid-cols-2 gap-5 border-t border-line pt-5">{metric(en ? "Size" : "Công suất", `${formatNumber(pkg?.kwp ?? project.kwp, 1)} kWp`)}{result ? <>{metric(en ? "Annual output" : "Sản lượng/năm", `${formatNumber(result.annualKwh / 1000, 1)} MWh`)}{metric(en ? "Annual savings" : "Tiết kiệm/năm", formatVnd(result.annualSaving))}{metric("CO₂ / " + (en ? "year" : "năm"), `${formatNumber(carbon!, 1)} ${en ? "tonnes" : "tấn"}`)}</> : project.savingPerMonth !== undefined && metric(t(data.savingLabel), formatVnd(project.savingPerMonth))}</dl>
          {pkg && <details className="mt-4 border-t border-line pt-3"><summary className="min-h-11 cursor-pointer text-sm font-semibold">{en ? "Equipment configuration" : "Cấu hình thiết bị"}</summary><ul className="list-disc pl-5 text-sm">{pkg.equipment.map((item, i) => <li key={i}>{t(item)}</li>)}</ul><p className="mt-3 text-xs text-fg-muted">{t(pkg.warranty)}</p></details>}
          <CalculatorLink href={link.href} prefill={link.calculator!} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline">{t(data.ctaLabel)}</CalculatorLink>
        </div>
      </article>;
    })}{!rows.length && <p role="status" className="col-span-full py-8 text-fg-muted">{en ? "No matching case studies." : "Chưa có công trình cho phân khúc này."}</p>}</div>
    <div aria-live="polite" className="mt-7 overflow-x-auto rounded-card border border-line bg-bg-elevated p-5" tabIndex={0} role="region" aria-label={en ? "Filtered case study totals" : "Bảng tổng theo bộ lọc"}><table className="w-full text-left text-sm"><caption className="mb-4 text-left font-semibold">{en ? "Totals for current filter" : "Tổng tự cộng theo bộ lọc hiện tại"} · {rows.length}</caption><thead><tr><th scope="col">kWp</th>{data.evidence && <><th scope="col">MWh/{en ? "year" : "năm"}</th><th scope="col">{en ? "Annual savings" : "Tiết kiệm/năm"}</th><th scope="col">CO₂/{en ? "year" : "năm"}</th></>}</tr></thead><tbody><tr><td>{formatNumber(totals.kwp, 1)}</td>{data.evidence && <><td>{formatNumber(totals.mwh, 1)}</td><td>{formatVnd(totals.saving)}</td><td>{formatNumber(totals.co2, 1)} {en ? "tonnes" : "tấn"}</td></>}</tr></tbody></table></div>
    {data.evidence && <p className="mt-3 text-xs leading-6 text-fg-muted">[DỮ LIỆU MẪU] CO₂: {formatNumber(data.evidence.carbonKgPerKwh, 1)} kg/kWh. {en ? "Simulated yield and savings, not actual measurements." : "Sản lượng và tiết kiệm áp dụng cùng công thức bộ tính, không phải số đo thực."}</p>}
    {playing && <StoryPlayer stories={playing.stories} startIndex={playing.index} locale={locale} ctaLabel={t(data.ctaLabel)} onClose={() => setPlaying(null)} />}
  </>;
}
