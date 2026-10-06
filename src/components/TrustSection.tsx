"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowTopRightOnSquareIcon, MapPinIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { SITE_CONFIG } from "@/config/site";
import { SEGMENTS } from "@/config/segments";
import { CERTIFICATES, PRESS, TESTIMONIALS, type Certificate } from "@/data/trust";
import { productBrands } from "@/data/products";
import { formatNumber } from "@/lib/format";
import { useDialog } from "@/lib/useDialog";
import SegmentIcon from "@/components/SegmentIcon";

const BRANDS = productBrands();
const REVIEW_LINKS = [
  SITE_CONFIG.reviews.google.url && { label: "Google", ...SITE_CONFIG.reviews.google },
  SITE_CONFIG.reviews.trustpilot.url && { label: "Trustpilot", ...SITE_CONFIG.reviews.trustpilot },
].filter(Boolean) as { label: string; url: string; rating: number; count: number }[];

function Stars({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
  return (
    <span className="flex text-sun" role="img" aria-label={`${String(value).replace(".", ",")} trên 5 sao`}>
      {Array.from({ length: 5 }, (_, i) => <StarIcon key={i} className={`${className} ${i < Math.round(value) ? "" : "opacity-25"}`} />)}
    </span>
  );
}

function CertificateLightbox({ cert, onClose }: { cert: Certificate; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, true, onClose);
  return (
    <div className="fixed inset-0 z-[85] grid place-items-center bg-scrim/80 p-4 backdrop-blur-sm" role="presentation">
      <button type="button" tabIndex={-1} aria-hidden className="absolute inset-0 cursor-default" onClick={onClose} />
      <figure ref={ref} role="dialog" aria-modal="true" aria-label={cert.name} tabIndex={-1} className="relative w-full max-w-lg">
        <button type="button" onClick={onClose} className="t5-icon-button absolute -top-14 right-0" aria-label="Đóng ảnh chứng chỉ" data-autofocus><XMarkIcon className="h-5 w-5" /></button>
        <div className="relative aspect-[840/1188] max-h-[78vh] w-full overflow-hidden rounded-2xl bg-bg-elevated">
          <Image src={cert.image} alt={`Ảnh chứng chỉ: ${cert.name}`} fill unoptimized={cert.image.endsWith(".svg")} sizes="(max-width:640px) 92vw, 512px" className="object-contain" />
        </div>
        <figcaption className="mt-3 text-center text-sm font-bold text-on-media">{cert.name}<span className="block text-xs font-medium text-on-media/80">{cert.issuer}</span></figcaption>
      </figure>
    </div>
  );
}

/** Khối uy tín: chứng chỉ (bấm xem ảnh lớn), báo chí (ẩn nếu rỗng), đánh giá khách hàng, thương hiệu thiết bị. */
export default function TrustSection() {
  const [cert, setCert] = useState<Certificate | null>(null);

  return (
    <section id="uy-tin" className="t5-section relative overflow-hidden bg-bg-tint" aria-labelledby="uy-tin-title">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgb(var(--c-sun)/.22),transparent_65%)]" />
      <div className="t5-container relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div data-reveal="down">
            <span className="t5-eyebrow">Vì sao khách chọn chúng tôi</span>
            <h2 id="uy-tin-title" className="t5-heading">Uy tín có giấy tờ, có người thật kể lại.</h2>
          </div>
          {REVIEW_LINKS.length > 0 && (
            <div className="flex flex-wrap gap-2" data-reveal="up">
              {REVIEW_LINKS.map((r) => (
                <a key={r.label} href={r.url} target="_blank" rel="noopener noreferrer" className="t8-glass flex min-h-11 items-center gap-3 rounded-full px-4 py-2 text-sm font-bold text-fg">
                  <Stars value={r.rating} />
                  <span>{String(r.rating).replace(".", ",")}/5 · {formatNumber(r.count)} đánh giá {r.label}</span>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4 text-fg-muted" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Chứng chỉ / chứng nhận */}
        {CERTIFICATES.length > 0 && (
          <div className="mt-10">
            <h3 className="t5-filter-title">Chứng chỉ & chứng nhận</h3>
            <ul data-reveal-stagger="zoom" data-reveal-step="0.06" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {CERTIFICATES.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setCert(c)} className="t8-glass group flex h-full w-full flex-col items-center gap-3 rounded-3xl p-4 text-center transition hover:-translate-y-1" aria-label={`Xem chứng chỉ: ${c.name}`}>
                    <span className="relative h-20 w-20"><Image src={c.logo} alt="" fill unoptimized={c.logo.endsWith(".svg")} sizes="80px" className="object-contain" /></span>
                    <span className="text-xs font-bold leading-snug text-fg">{c.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Báo chí — danh sách rỗng thì ẩn cả khối */}
        {PRESS.length > 0 && (
          <div className="mt-10">
            <h3 className="t5-filter-title">Báo chí nói về chúng tôi</h3>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {PRESS.map((p) => (
                <li key={p.id}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="t8-glass group flex h-full flex-col gap-2 rounded-3xl p-4 transition hover:-translate-y-1">
                    <span className="relative block h-16 w-full max-w-[240px]"><Image src={p.logo} alt={p.outlet} fill unoptimized={p.logo.endsWith(".svg")} sizes="240px" className="object-contain object-left" /></span>
                    <span className="flex items-start justify-between gap-2 text-sm font-bold leading-snug text-fg">“{p.title}”<ArrowTopRightOnSquareIcon className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted group-hover:text-primary" /></span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Đánh giá khách hàng */}
        <div className="mt-10">
          <h3 className="t5-filter-title">Khách hàng nói gì</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t, i) => (
              <figure key={t.name} data-reveal={i % 2 ? "right" : "left"} className="t8-glass flex flex-col rounded-[28px] p-6">
                <Stars value={t.rating} />
                <blockquote className="mt-4 flex-1 text-base font-semibold leading-7 text-fg">“{t.quote}”</blockquote>
                <figcaption className="mt-5 border-t border-line/12 pt-4 text-sm">
                  <div className="font-black text-fg">{t.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
                    <span className="flex items-center gap-1"><SegmentIcon segment={t.segment} className="h-3.5 w-3.5" />{SEGMENTS[t.segment].short}</span>
                    <span className="flex items-center gap-1"><MapPinIcon className="h-3.5 w-3.5" />{t.location}</span>
                    <span className="font-bold text-primary-strong">{formatNumber(t.kwp)} kWp</span>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>

        {/* Thương hiệu thiết bị đang phân phối / sử dụng */}
        {BRANDS.length > 0 && (
          <div className="mt-12">
            <h3 className="t5-filter-title text-center">Thương hiệu thiết bị chúng tôi phân phối & lắp đặt</h3>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4" aria-label="Thương hiệu thiết bị">
              {BRANDS.map((b) => <li key={b} className="rounded-full border border-on-media bg-bg-elevated/70 px-5 py-2 text-lg font-black tracking-tight text-fg-muted shadow-sm">{b}</li>)}
            </ul>
          </div>
        )}
      </div>
      {cert && <CertificateLightbox cert={cert} onClose={() => setCert(null)} />}
    </section>
  );
}
