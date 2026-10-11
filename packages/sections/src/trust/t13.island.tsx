"use client";

import { useState } from "react";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { MediaImage } from "@solar/ui";
import type { Locale } from "../site";
import { Lightbox, type Cert } from "./t15.island";

export default function Trust({ items, labels, locale }: {
  items: (Cert & { logo?: string; logoAlt: string })[]; labels: string[]; locale: Locale;
}) {
  const [open, setOpen] = useState<number | null>(null);
  return <>
    <ul data-reveal-stagger="zoom" data-reveal-step="0.06" className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((cert, index) => <li key={cert.id}>
        <button type="button" onClick={() => setOpen(index)} aria-label={`${locale === "en" ? "View certificate:" : "Xem chứng chỉ:"} ${cert.title}`}
          className="group flex h-full w-full flex-col items-center gap-3 rounded-card border border-glass-border bg-glass p-4 text-center shadow-glass backdrop-blur-glass transition duration-motion-fast motion-safe:hover:-translate-y-1 motion-reduce:transition-none">
          <span className="relative h-20 w-20">
            {cert.logo || cert.image
              ? <MediaImage src={cert.logo ?? cert.image} alt={cert.logo ? cert.logoAlt : cert.imageAlt} sizes="80px" className="!object-contain" />
              : <ShieldCheckIcon aria-hidden className="h-full w-full text-primary" />}
          </span>
          <span className="text-xs font-bold leading-snug text-fg">{cert.title}</span>
        </button>
      </li>)}
    </ul>
    {open !== null && <Lightbox items={items} index={open} setIndex={setOpen} labels={labels} locale={locale} onClose={() => setOpen(null)} />}
  </>;
}
