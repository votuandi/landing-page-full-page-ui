"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowRightIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { PlayIcon } from "@heroicons/react/24/solid";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";
import { useInViewOnce } from "@/lib/useCountUp";
import { openCalculator } from "@solar/core";
import { MediaImage } from "@/components/ui/Media";
import { CountUp, SectionHead } from "@/components/ui/ui";

const VideoModal = dynamic(() => import("@/components/ui/VideoModal"), { ssr: false });
const { items } = siteConfig.projects;

/** Tiền VNĐ/năm → đếm theo tỷ (≥ 1 tỷ) hoặc triệu. */
const moneyParts = (v: number, en: boolean) =>
  v >= 1e9 ? { value: v / 1e9, decimals: 2, unit: en ? "bn VND" : "tỷ" } : { value: v / 1e6, decimals: 0, unit: en ? "M VND" : "triệu" };

export default function FeaturedProjects() {
  const { tr, lang } = useLang();
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ref, seen] = useInViewOnce<HTMLDivElement>(0.25);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  if (!items.length) return null;
  const p = items[active];
  const money = moneyParts(p.savingPerYear, lang === "en");

  const onKey = (e: KeyboardEvent, i: number) => {
    const last = items.length - 1;
    const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  const metrics = [
    { label: tr("Công suất", "Capacity"), unit: "kWp", node: <CountUp key={`k${active}`} start={seen} value={p.kwp} /> },
    { label: tr("Sản lượng", "Output"), unit: tr("kWh/năm", "kWh/yr"), node: <CountUp key={`e${active}`} start={seen} value={p.kwhPerYear} /> },
    { label: tr("Tiết kiệm", "Savings"), unit: lang === "en" ? `${money.unit}/yr` : `${money.unit} VNĐ/năm`, node: <CountUp key={`s${active}`} start={seen} value={money.value} decimals={money.decimals} /> },
    { label: tr("Giảm CO₂", "CO₂ avoided"), unit: tr("tấn/năm", "t/yr"), node: <CountUp key={`c${active}`} start={seen} value={p.co2PerYear} /> },
  ];

  return (
    <section id="du-an" className="t15-invert t15-section relative overflow-hidden t15-ocean text-fg" aria-labelledby="du-an-title">
      <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-accent)/.25),transparent_65%)]" />
      <div className="t15-container relative">
        <SectionHead id="du-an-title" eyebrow={tr("Dự án tiêu biểu", "Featured projects")} title={tr("Khách hàng thật, số liệu vận hành thật.", "Real clients, real operating data.")} />

        <div role="tablist" aria-label={tr("Chọn khách hàng", "Choose a client")} className="t15-no-scrollbar -mx-4 mt-8 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {items.map((it, i) => (
            <button key={it.id} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`da-tab-${it.id}`} aria-controls="da-panel"
              aria-selected={i === active} tabIndex={i === active ? 0 : -1} onClick={() => setActive(i)} onKeyDown={(e) => onKey(e, i)}
              className={`flex min-h-16 shrink-0 items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition ${i === active ? "border-accent bg-accent/15" : "border-line/15 bg-glass hover:bg-glass-tint/10"}`}>
              <span aria-hidden className={`grid h-11 w-11 place-items-center rounded-xl text-sm font-black ${i === active ? "bg-accent text-on-accent" : "bg-glass-strong text-fg"}`}>{it.logoText}</span>
              <span><span className="block max-w-[180px] truncate text-sm font-black">{it.client}</span><span className="block text-xs text-fg-muted">{it.industry}</span></span>
            </button>
          ))}
        </div>

        <div ref={ref} id="da-panel" role="tabpanel" aria-labelledby={`da-tab-${p.id}`} className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <button type="button" onClick={() => setPlaying(true)} aria-label={`${tr("Xem video dự án", "Watch project video")}: ${p.client}`}
            className="group relative min-h-[280px] overflow-hidden rounded-[32px] border border-glass-border sm:min-h-[400px]">
            <MediaImage key={p.id} src={p.image} alt="" sizes="(max-width:1024px) 100vw, 55vw" className="transition duration-700 motion-safe:group-hover:scale-[1.04]" />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-transparent to-transparent" />
            <span className="absolute left-1/2 top-1/2 grid h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-on-accent shadow-2xl transition motion-safe:group-hover:scale-110"><PlayIcon className="ml-1 h-8 w-8" /></span>
            <span className="absolute bottom-5 left-5 flex items-center gap-1.5 rounded-full bg-scrim/60 px-3 py-1.5 text-xs font-bold text-on-media backdrop-blur"><MapPinIcon className="h-4 w-4" />{p.location}</span>
          </button>

          <div className="flex flex-col">
            <div className="text-xs font-black uppercase tracking-[.16em] text-accent-ink">{p.industry}</div>
            <h3 className="mt-2 text-3xl font-black tracking-[-.03em]">{p.client}</h3>
            <p className="mt-4 leading-7 text-fg-muted">{p.description}</p>
            <dl aria-live="polite" className="mt-6 grid grid-cols-2 gap-3">
              {metrics.map((m) => (
                <div key={m.label} className="t15-glass-dark flex flex-col-reverse rounded-2xl p-4">
                  <dt className="mt-1 text-xs font-semibold text-fg-muted">{m.label} · {m.unit}</dt>
                  <dd className="text-2xl font-black tabular-nums text-accent-ink sm:text-3xl">{m.node}</dd>
                </div>
              ))}
            </dl>
            <button type="button" onClick={() => openCalculator({ segment: p.segment, topic: `Dự án tương tự: ${p.client}` })} className="t15-button t15-button-primary mt-6 self-start">
              {tr("Dự toán công trình tương tự", "Estimate a similar project")} <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {playing && <VideoModal video={p.video} title={p.client} onClose={() => setPlaying(false)} />}
    </section>
  );
}
