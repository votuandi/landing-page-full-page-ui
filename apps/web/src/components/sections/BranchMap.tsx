"use client";

import { ZaloIcon, SectionHead } from "@solar/ui";

import { useState } from "react";
import { ArrowTopRightOnSquareIcon, BuildingOffice2Icon, ClockIcon, MapPinIcon, PhoneIcon, TruckIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { directionsUrl, mapsUrl, telHref, zaloHref } from "@/config/site";
import { useLang } from "@/i18n/LangProvider";

import { ARCHIPELAGOS, ISLAND_PATHS, MAINLAND_PATH, MAP_H, MAP_W, SEA_LABEL, SMALL_ISLANDS, project } from "@/components/sections/vietnamMap";

const { branches } = siteConfig;
const pct = (v: number, total: number) => `${((v / total) * 100).toFixed(2)}%`;

export default function BranchMap() {
  const { tr } = useLang();
  const [activeId, setActiveId] = useState((branches.find((b) => b.primary) || branches[0]).id);
  const b = branches.find((x) => x.id === activeId) || branches[0];

  return (
    <section id="chi-nhanh" className="t15-section relative overflow-hidden bg-bg" aria-labelledby="chi-nhanh-title">
      <div className="t15-container">
        <SectionHead id="chi-nhanh-title" eyebrow={tr("Hệ thống chi nhánh", "Branch network")}
          title={tr(`${branches.length} chi nhánh — kho hàng sẵn, kỹ sư gần bạn.`, `${branches.length} branches — local stock, engineers nearby.`)}
          desc={tr("Bấm vào ghim trên bản đồ để xem địa chỉ văn phòng, kho và hotline.", "Tap a pin to see office, warehouse and hotline.")} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-start">
          <div data-reveal="left" className="t15-card relative overflow-hidden p-3 sm:p-6">
            <div className="relative mx-auto max-w-[620px]" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
              <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 h-full w-full" role="img" aria-label={tr("Bản đồ Việt Nam với các chi nhánh, quần đảo Hoàng Sa và Trường Sa", "Map of Vietnam with branches, Hoang Sa and Truong Sa archipelagos")}>
                <defs>
                  <linearGradient id="vn-land" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" style={{ stopColor: "rgb(var(--c-primary))", stopOpacity: 0.55 }} />
                    <stop offset="1" style={{ stopColor: "rgb(var(--c-primary-deep))", stopOpacity: 0.9 }} />
                  </linearGradient>
                </defs>
                <text x={SEA_LABEL.x} y={SEA_LABEL.y} textAnchor="middle" className="fill-fg-subtle text-[15px] font-bold italic tracking-[.3em]">BIỂN ĐÔNG</text>
                <path d={MAINLAND_PATH} fill="url(#vn-land)" strokeWidth="1.5" strokeLinejoin="round" className="stroke-primary" />
                {ISLAND_PATHS.map((d, i) => <path key={i} d={d} fill="url(#vn-land)" strokeWidth="1" className="stroke-primary" />)}
                {SMALL_ISLANDS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.6" className="fill-primary" />)}
                {ARCHIPELAGOS.map((a) => (
                  <g key={a.id}>
                    {a.dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2.4" className="fill-primary" />)}
                    <text x={a.labelAt.x} y={a.labelAt.y} textAnchor="middle" className="fill-fg text-[13px] font-black">{a.label}</text>
                    <text x={a.labelAt.x} y={a.labelAt.y + 15} textAnchor="middle" className="fill-fg-muted text-[11px] font-bold">(Việt Nam)</text>
                  </g>
                ))}
              </svg>

              {branches.map((br) => {
                const { x, y } = project(br.office.lat, br.office.lng);
                const active = br.id === activeId;
                return (
                  <button key={br.id} type="button" onClick={() => setActiveId(br.id)} aria-pressed={active} aria-label={`${tr("Chi nhánh", "Branch")} ${br.name}`}
                    className={`group absolute -translate-x-1/2 -translate-y-full ${active ? "z-10" : "hover:z-20 focus-visible:z-20"}`} style={{ left: pct(x, MAP_W), top: pct(y, MAP_H) }}>
                    <span className="relative flex flex-col items-center">
                      <span className={`mb-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-black shadow-lg transition sm:text-xs ${active ? "bg-accent text-on-accent" : "invisible bg-bg-elevated/90 text-fg group-hover:visible group-focus-visible:visible"}`}>{br.name}</span>
                      <span className="relative grid h-11 w-11 place-items-center">
                        {active && <span aria-hidden className="t15-ping absolute h-6 w-6 rounded-full bg-accent" />}
                        <MapPinIcon className={`relative h-8 w-8 drop-shadow ${active ? "text-accent" : "text-on-media"}`} />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="t15-no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label={tr("Chọn chi nhánh", "Choose a branch")}>
              {branches.map((br) => <button key={br.id} type="button" aria-pressed={br.id === activeId} onClick={() => setActiveId(br.id)} className="t15-chip shrink-0">{br.name}</button>)}
            </div>

            <article aria-live="polite" className="t15-card p-6">
              <h3 className="text-2xl font-black text-fg">{tr("Chi nhánh", "Branch")} {b.name}</h3>
              <dl className="mt-5 grid gap-4 text-sm">
                <div className="flex gap-3">
                  <BuildingOffice2Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div><dt className="font-black text-fg">{tr("Văn phòng", "Office")}</dt><dd className="mt-1 leading-6 text-fg-muted">{b.office.address}</dd>
                    <dd><a href={mapsUrl(b.office)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Google Maps <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" /></a></dd></div>
                </div>
                {b.warehouse && (
                  <div className="flex gap-3">
                    <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div><dt className="font-black text-fg">{tr("Kho hàng", "Warehouse")}</dt><dd className="mt-1 leading-6 text-fg-muted">{b.warehouse.address}</dd>
                      <dd><a href={mapsUrl(b.warehouse)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Google Maps <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" /></a></dd></div>
                  </div>
                )}
                <div className="flex gap-3">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div><dt className="font-black text-fg">{tr("Giờ làm việc", "Opening hours")}</dt><dd className="mt-1 text-fg-muted">{b.openingHours}</dd></div>
                </div>
              </dl>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                {[[tr("Tổng đài", "Main"), b.hotline.main], [tr("Hộ gia đình", "Homes"), b.hotline.household], [tr("Dự án", "Projects"), b.hotline.project]].map(([label, phone]) => (
                  <a key={label} href={telHref(phone)} className="rounded-2xl border border-line/12 bg-glass px-2 py-3 hover:bg-glass-tint/10">
                    <span className="block text-fg-subtle">{label}</span><span className="mt-0.5 block font-black tabular-nums text-fg">{phone}</span>
                  </a>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <a href={directionsUrl(b.office)} target="_blank" rel="noopener noreferrer" className="t15-button t15-button-primary"><MapPinIcon className="h-5 w-5" />{tr("Chỉ đường", "Directions")}</a>
                <a href={zaloHref(b.hotline.main)} target="_blank" rel="noopener noreferrer" className="t15-button t15-button-secondary"><ZaloIcon className="h-5 w-5" />Zalo</a>
              </div>
              <a href={telHref(b.hotline.main)} className="mt-2 flex min-h-11 items-center justify-center gap-2 text-sm font-black text-fg-muted hover:text-fg"><PhoneIcon className="h-4 w-4" />{tr("Gọi", "Call")} {b.hotline.main}</a>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
