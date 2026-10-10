"use client";
import { useRef, useState } from "react";
import { MediaImage, CarouselNav, useDialog, useSnapCarousel } from "@solar/ui";
import { MagnifyingGlassPlusIcon, ShieldCheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { Locale } from "../site";

type Cert = { id: string; title: string; subtitle: string; issuer: string; number: string; validUntil: string; scope: string; image?: string; imageAlt: string };
function Visual({ cert }: { cert: Cert }) {
  if (cert.image) return <MediaImage src={cert.image} alt={cert.imageAlt} sizes="(max-width:768px) 90vw, 480px" className="!object-contain bg-on-media" />;
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-bg-elevated via-bg-tint to-primary-deep p-5 text-center"><div aria-hidden className="absolute inset-3 rounded-2xl border-2 border-dashed border-accent/35" /><span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent-ink ring-4 ring-accent/20"><ShieldCheckIcon className="h-8 w-8" /></span><span className="text-xl font-black leading-tight text-fg">{cert.title}</span><span className="text-xs font-bold text-fg-muted">{cert.subtitle}</span></div>;
}
function Details({ cert, labels }: { cert: Cert; labels: string[] }) {
  return <dl className="mt-4 grid gap-3 text-sm">{[cert.issuer, cert.number, cert.validUntil, cert.scope].map((value, i) => <div key={i} className="border-b border-line/12 pb-3"><dt className="text-xs font-bold uppercase tracking-[.14em] text-fg-subtle">{labels[i]}</dt><dd className="mt-1 font-bold leading-6 text-fg">{value}</dd></div>)}</dl>;
}
function Lightbox({ items, index, setIndex, labels, locale, onClose }: { items: Cert[]; index: number; setIndex: (i: number) => void; labels: string[]; locale: Locale; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, true, onClose);
  const cert = items[index];
  const go = (delta: number) => setIndex((index + delta + items.length) % items.length);
  return <div ref={ref} role="dialog" aria-modal="true" aria-label={cert.title} className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim/85 p-3 backdrop-blur-sm sm:p-6" onKeyDown={(event) => { if (event.key === "ArrowRight") go(1); if (event.key === "ArrowLeft") go(-1); }}>
    <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
    <div className="relative grid max-h-[calc(100svh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-media border border-glass-border bg-bg-elevated/95 shadow-2xl backdrop-blur-xl md:grid-cols-2"><div className="relative aspect-[3/4] md:aspect-auto md:min-h-[520px]"><Visual cert={cert} /></div><div className="flex flex-col p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[.16em] text-accent-ink">{index + 1} / {items.length}</div><h3 className="mt-2 text-2xl font-black text-fg">{cert.title}</h3><p className="mt-1 text-sm text-fg-muted">{cert.subtitle}</p></div><button data-autofocus type="button" onClick={onClose} className="t15-icon-button shrink-0" aria-label={locale === "en" ? "Close" : "Đóng"}><XMarkIcon aria-hidden className="h-5 w-5" /></button></div><Details cert={cert} labels={labels} /><div className="mt-auto flex justify-between gap-3 pt-6"><button type="button" onClick={() => go(-1)} className="t15-button t15-button-secondary">{locale === "en" ? "Previous" : "Trước"}</button><button type="button" onClick={() => go(1)} className="t15-button t15-button-secondary">{locale === "en" ? "Next" : "Tiếp"}</button></div></div></div>
  </div>;
}
export default function Trust({ items, labels, locale }: { items: Cert[]; labels: string[]; locale: Locale }) {
  const [open, setOpen] = useState<number | null>(null);
  const { ref, prev, next, atStart, atEnd } = useSnapCarousel();
  return <>
    <CarouselNav prevLabel={locale === "en" ? "Previous" : "Trước"} nextLabel={locale === "en" ? "Next" : "Tiếp"} prev={prev} next={next} atStart={atStart} atEnd={atEnd} className="mt-5 justify-end" />
    <div ref={ref} className="t15-no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0" aria-label={locale === "en" ? "Certificates" : "Danh sách chứng chỉ"}>
      {items.map((cert, i) => <article key={cert.id} className="group relative w-[68%] shrink-0 snap-start overflow-hidden rounded-card border border-glass-border bg-bg-elevated text-left shadow-certificate transition motion-safe:hover:-translate-y-1.5 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]"><button type="button" onClick={() => setOpen(i)} aria-label={`${locale === "en" ? "View" : "Xem"} ${cert.title}`} className="block w-full text-left"><div className="relative aspect-[3/4]"><Visual cert={cert} /></div><span className="flex items-center justify-between gap-2 border-t border-line/12 p-4"><span className="min-w-0"><span className="block text-sm font-black text-fg">{cert.title}</span><span className="block text-xs text-fg-muted">{cert.subtitle}</span></span><MagnifyingGlassPlusIcon aria-hidden className="h-5 w-5 shrink-0 text-primary" /></span></button><div className="px-4 pb-4"><Details cert={cert} labels={labels} /></div></article>)}
    </div>
    {open !== null && <Lightbox items={items} index={open} setIndex={setOpen} labels={labels} locale={locale} onClose={() => setOpen(null)} />}
  </>;
}
