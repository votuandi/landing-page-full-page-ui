"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import type { Segment } from "@/config/solar";
import { PROJECTS } from "@/data/projects";
import { formatMoneyShort, formatNumber } from "@/lib/solarCalculator";
import { openCalculator } from "@/lib/calculatorBus";
import SegmentTabs from "@/components/SegmentTabs";

export default function ProjectsGallery() {
  const [filter, setFilter] = useState<Segment | "all">("all");
  const list = PROJECTS.filter((p) => filter === "all" || p.segment === filter);

  return (
    <section id="cong-trinh" className="t12-invert relative bg-bg-deep pb-10 text-fg" aria-labelledby="cong-trinh-title">
      <div className="t5-container py-14 md:py-16">
        <div data-reveal="down" className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="t5-eyebrow">Công trình đã thực hiện</span>
            <h2 id="cong-trinh-title" className="mt-4 max-w-3xl text-4xl font-black tracking-[-.045em] sm:text-5xl">Số liệu thật từ mái nhà thật.</h2>
          </div>
          <SegmentTabs value={filter} onChange={setFilter} idPrefix="ct" withAll label="Lọc công trình theo phân khúc" />
        </div>
      </div>
      <div id="ct-panel" role="tabpanel" aria-labelledby={`ct-tab-${filter}`} data-reveal-stagger="up" data-reveal-step="0.1" className="grid gap-px bg-line/12 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <Link key={p.slug} href={`/cong-trinh/${p.slug}`} className="group flex flex-col bg-bg-deep">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image src={p.image} alt={p.title} fill loading="lazy" className="object-cover transition duration-700 group-hover:scale-[1.05]" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 34vw" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-scrim/70 to-transparent" />
              <span className="t8-glass absolute left-5 top-5 rounded-full px-3 py-1.5 text-xs font-black text-on-media">{formatNumber(p.kwp)} kWp</span>
              <span className="absolute bottom-4 left-5 flex items-center gap-1 text-xs font-black uppercase tracking-[.15em] text-on-media/90"><MapPinIcon className="h-4 w-4" />{p.type} • {p.location}</span>
            </div>
            <div className="flex flex-1 items-center justify-between gap-4 p-6 transition group-hover:bg-glass-tint/[.06] sm:px-8">
              <div><h3 className="text-xl font-black">{p.title}</h3><div className="mt-1 text-sm text-fg-muted">Tiết kiệm <strong className="text-accent-soft">~{formatMoneyShort(p.savingPerMonth)}/tháng</strong></div></div>
              <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-glass-strong text-fg transition group-hover:translate-x-1 group-hover:bg-accent group-hover:text-on-accent">→</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="t5-container pt-8 text-center">
        <button type="button" onClick={() => openCalculator(filter === "all" ? undefined : filter)} className="t5-button t5-button-primary">Dự toán công trình của tôi</button>
      </div>
    </section>
  );
}
