"use client";
import { useEffect, useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { ZaloIcon } from "@solar/ui";
import type { BranchItem, GeoPoint } from "../collections/schemas";
import type { Locale } from "../site";
import { ARCHIPELAGOS, ISLAND_PATHS, MAINLAND_PATH, MAP_H, MAP_W, SEA_LABEL, SMALL_ISLANDS, project } from "./vietnamMap";

type BranchView = BranchItem & { phoneHref: string; zaloHref: string };
const maps = (point: GeoPoint, directions = false) => "https://www.google.com/maps/" + (directions ? "dir/?api=1&destination=" : "search/?api=1&query=") + encodeURIComponent(point.lat + "," + point.lng);
const pct = (value: number, total: number) => (value / total * 100).toFixed(2) + "%";
export default function BranchMap({ items, labels, locale }: {
  items: BranchView[]; sectionId: string; locale: Locale;
  labels: { office: string; warehouse: string; hotline: string; directions: string; zalo: string };
}) {
  const initial = (items.find((b) => b.primary) ?? items[0]).id;
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => setActive(initial), [initial]);
  const branchLabel = locale === "en" ? "Branch " : "Chi nhánh ";
  return <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
    <div className="t15-card relative overflow-hidden p-3 sm:p-6">
      <div className="relative mx-auto max-w-[620px]" style={{ aspectRatio: MAP_W + " / " + MAP_H }}>
        <svg viewBox={"0 0 " + MAP_W + " " + MAP_H} className="absolute inset-0 h-full w-full" role="img" aria-label={locale === "en" ? "Vietnam, Hoang Sa and Truong Sa archipelagos" : "Bản đồ Việt Nam, quần đảo Hoàng Sa và Trường Sa"}>
          <text x={SEA_LABEL.x} y={SEA_LABEL.y} textAnchor="middle" className="fill-fg-subtle text-body font-bold italic tracking-[.3em]">BIỂN ĐÔNG</text>
          <path d={MAINLAND_PATH} strokeWidth="1.5" strokeLinejoin="round" className="fill-primary-deep stroke-primary" />
          {ISLAND_PATHS.map((d, i) => <path key={i} d={d} strokeWidth="1" className="fill-primary-deep stroke-primary" />)}
          {SMALL_ISLANDS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.6" className="fill-primary" />)}
          {ARCHIPELAGOS.map((a) => <g key={a.id}>
            {a.dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.4" className="fill-primary" />)}
            <text x={a.labelAt.x} y={a.labelAt.y} textAnchor="middle" className="fill-fg text-body-sm font-black">{a.label}</text>
            <text x={a.labelAt.x} y={a.labelAt.y + 15} textAnchor="middle" className="fill-fg-muted text-2xs font-bold">(Việt Nam)</text>
          </g>)}
        </svg>
        {items.map((branch) => {
          const { x, y } = project(branch.office.lat, branch.office.lng);
          const selected = (active ?? initial) === branch.id;
          return <button key={branch.id} type="button" onClick={() => setActive(branch.id)} aria-pressed={selected} aria-label={branchLabel + branch.name}
            className="group absolute grid h-11 w-11 -translate-x-1/2 -translate-y-full place-items-center focus-visible:z-20" style={{ left: pct(x, MAP_W), top: pct(y, MAP_H) }}>
            <MapPinIcon aria-hidden className={"h-8 w-8 " + (selected ? "text-accent" : "text-on-media")} />
            {selected && <span className="absolute bottom-11 whitespace-nowrap rounded-pill bg-accent px-2 py-0.5 text-4xs font-black text-on-accent shadow-lg sm:text-xs">{branch.name}</span>}
          </button>;
        })}
      </div>
    </div>
    <div className="grid gap-4">
      <div className="t15-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label={locale === "en" ? "Choose a branch" : "Chọn chi nhánh"}>
        {items.map((branch) => <button key={branch.id} type="button" aria-pressed={(active ?? initial) === branch.id} onClick={() => setActive(branch.id)} className="t15-chip shrink-0">{branch.name}</button>)}
      </div>
      <div aria-live="polite">{items.map((branch) => <article key={branch.id} hidden={active !== null && active !== branch.id} className="t15-card mb-4 p-6">
        <h3 className="text-2xl font-black text-fg">{branchLabel}{branch.name}</h3>
        <dl className="mt-5 grid gap-4 text-sm">
          {([{ point: branch.office, label: labels.office }, ...(branch.warehouse ? [{ point: branch.warehouse, label: labels.warehouse }] : [])]).map(({ point, label }, i) => <div key={i}>
            <dt className="font-black text-fg">{label}</dt><dd className="mt-1 leading-6 text-fg-muted">{point.address}</dd>
            <dd><a href={maps(point)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex text-xs font-bold text-primary hover:underline">Google Maps ↗</a></dd>
          </div>)}
          {branch.hours && <div><dt className="font-black text-fg">{locale === "en" ? "Opening hours" : "Giờ làm việc"}</dt><dd className="text-fg-muted">{branch.hours}</dd></div>}
          <div><dt className="font-black text-fg">{labels.hotline}</dt><dd><a href={branch.phoneHref} className="font-bold text-primary">{branch.hotline}</a></dd></div>
        </dl>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <a href={maps(branch.office, true)} target="_blank" rel="noopener noreferrer" className="t15-button t15-button-primary"><MapPinIcon aria-hidden className="h-5 w-5" />{labels.directions}</a>
          <a href={branch.zaloHref} target="_blank" rel="noopener noreferrer" className="t15-button t15-button-secondary"><ZaloIcon aria-hidden className="h-5 w-5" />{labels.zalo}</a>
        </div>
      </article>)}</div>
    </div>
  </div>;
}
