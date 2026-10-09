"use client";

import { MediaImage, CarouselNav, SectionHead, useModal, useSnapCarousel } from "@solar/ui";

import { useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassPlusIcon, ShieldCheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { siteConfig } from "@/config/site.config";
import { useLang } from "@/i18n/LangProvider";

const { items } = siteConfig.certificates;
type Cert = (typeof items)[number];

/** Ảnh chứng chỉ: có `image` thì dùng ảnh scan, không thì vẽ khung giấy chứng nhận placeholder. */
function CertVisual({ cert, large = false }: { cert: Cert; large?: boolean }) {
  const { tr } = useLang();
  if (cert.image) return <MediaImage src={cert.image} alt={tr(cert.title)} sizes={large ? "(max-width:768px) 90vw, 480px" : "260px"} className="!object-contain bg-on-media" />;
  return (
    <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-bg-elevated via-bg-tint to-primary-deep p-5 text-center">
      <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-accent/35" />
      <span className="grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent-ink ring-4 ring-accent/20"><ShieldCheckIcon className="h-8 w-8" /></span>
      <span className={`${large ? "text-3xl" : "text-xl"} font-black leading-tight text-fg`}>{tr(cert.title)}</span>
      <span className="text-xs font-bold text-fg-muted">{tr(cert.subtitle)}</span>
      <span className="mt-2 rounded-full bg-glass-strong px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-fg-subtle">{tr("Ảnh minh họa", "Placeholder")}</span>
    </div>
  );
}

function Lightbox({ index, setIndex, onClose }: { index: number; setIndex: (i: number) => void; onClose: () => void }) {
  const { tr } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModal(ref, onClose, closeRef);
  const cert = items[index];
  const go = (d: number) => setIndex((index + d + items.length) % items.length);

  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={tr(cert.title)} className="fixed inset-0 z-[90] flex items-center justify-center bg-scrim/85 p-3 backdrop-blur-sm sm:p-6"
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}>
      <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="relative grid max-h-[calc(100svh-1.5rem)] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-glass-border bg-bg-elevated/95 shadow-2xl backdrop-blur-xl md:grid-cols-[1fr_1fr]">
        <div className="relative aspect-[3/4] md:aspect-auto md:min-h-[520px]"><CertVisual cert={cert} large /></div>
        <div className="flex flex-col p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[.16em] text-accent-ink">{index + 1} / {items.length}</div>
              <h3 className="mt-2 text-2xl font-black text-fg">{tr(cert.title)}</h3>
              <p className="mt-1 text-sm text-fg-muted">{tr(cert.subtitle)}</p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="t15-icon-button shrink-0" aria-label={tr("Đóng", "Close")}><XMarkIcon className="h-5 w-5" /></button>
          </div>
          <dl className="mt-6 grid gap-4 text-sm">
            {[
              [tr("Cơ quan cấp", "Issued by"), cert.issuer],
              [tr("Số hiệu", "Number"), cert.number],
              [tr("Hiệu lực đến", "Valid until"), cert.validUntil],
              [tr("Phạm vi", "Scope"), cert.scope],
            ].map(([k, v]) => (
              <div key={k} className="border-b border-line/12 pb-3"><dt className="text-xs font-bold uppercase tracking-[.14em] text-fg-subtle">{k}</dt><dd className="mt-1 font-bold leading-6 text-fg">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-auto flex justify-between gap-3 pt-6">
            <button type="button" onClick={() => go(-1)} className="t15-button t15-button-secondary"><ChevronLeftIcon className="h-4 w-4" />{tr("Trước", "Previous")}</button>
            <button type="button" onClick={() => go(1)} className="t15-button t15-button-secondary">{tr("Tiếp", "Next")}<ChevronRightIcon className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificatesSection() {
  const { tr } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const c = useSnapCarousel();
  if (!items.length) return null;

  return (
    <section id="chung-chi" className="t15-section relative overflow-hidden bg-bg-elevated" aria-labelledby="chung-chi-title">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-primary)/.14),transparent_65%)]" />
      <div className="t15-container relative">
        <SectionHead id="chung-chi-title" eyebrow={tr("Chứng chỉ & giấy phép", "Certificates & licences")}
          title={tr("Năng lực được chứng nhận, minh bạch từng giấy tờ.", "Certified capability, every document on show.")}
          action={<CarouselNav prevLabel={tr("Trước", "Previous")} nextLabel={tr("Tiếp", "Next")} prev={c.prev} next={c.next} atStart={c.atStart} atEnd={c.atEnd} className="hidden sm:flex" />} />

        <div ref={c.ref} className="t15-no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:scroll-px-0 sm:px-0" aria-label={tr("Danh sách chứng chỉ", "Certificates")}>
          {items.map((cert, i) => (
            <button key={cert.id} type="button" onClick={() => setOpen(i)} aria-label={`${tr("Xem", "View")} ${tr(cert.title)}`}
              className="group relative w-[68%] shrink-0 snap-start overflow-hidden rounded-[28px] border border-glass-border bg-bg-elevated text-left shadow-[0_20px_60px_-30px_rgb(var(--c-shadow)/.25)] transition motion-safe:hover:-translate-y-1.5 sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]">
              <div className="relative aspect-[3/4]"><CertVisual cert={cert} /></div>
              <div className="flex items-center justify-between gap-2 border-t border-line/12 p-4">
                <span className="min-w-0"><span className="block truncate text-sm font-black text-fg">{tr(cert.title)}</span><span className="block truncate text-xs text-fg-muted">{cert.issuer}</span></span>
                <MagnifyingGlassPlusIcon className="h-5 w-5 shrink-0 text-primary transition group-hover:scale-110" />
              </div>
            </button>
          ))}
        </div>
      </div>
      {open !== null && <Lightbox index={open} setIndex={setOpen} onClose={() => setOpen(null)} />}
    </section>
  );
}
