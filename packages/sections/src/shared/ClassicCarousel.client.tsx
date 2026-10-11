"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CarouselNav, useSnapCarousel } from "@solar/ui";
import type { Locale } from "../site";

/** Scroll-snap keeps all banners available when JavaScript is disabled. */
export default function ClassicCarousel({ children, label, locale, autoplay = false }: {
  children: ReactNode; label: string; locale: Locale; autoplay?: boolean;
}) {
  const { ref, index, count, goTo } = useSnapCarousel();
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!el || !autoplay || paused || count < 2) return;
    const timer = window.setInterval(() => {
      if (motion.matches || document.hidden || el.matches(":hover") || el.contains(document.activeElement)) return;
      goTo((index + 1) % count);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [autoplay, count, goTo, index, ref, paused]);
  return <div role="region" aria-label={label} aria-roledescription={locale === "en" ? "carousel" : "băng chuyền"}>
    <div ref={ref} tabIndex={0} className="relative flex snap-x snap-mandatory overflow-x-auto focus-visible:outline-primary">{children}</div>
    {count > 1 && <div className="flex flex-wrap items-center justify-center gap-2 bg-bg-elevated py-3 text-fg">
      <CarouselNav prev={() => goTo((index - 1 + count) % count)} next={() => goTo((index + 1) % count)} atStart={false} atEnd={false} prevLabel={locale === "en" ? "Previous" : "Trước"} nextLabel={locale === "en" ? "Next" : "Tiếp"} />
      <div className="flex gap-1">{Array.from({ length: count }, (_, i) => <button key={i} type="button" aria-label={`${locale === "en" ? "Show slide" : "Hiển thị banner"} ${i + 1}`} aria-current={i === index ? "true" : undefined} onClick={() => goTo(i)} className="grid h-11 w-11 place-items-center"><span className={`h-2 rounded-pill ${i === index ? "w-8 bg-primary" : "w-3 bg-primary/30"}`} /></button>)}</div>
      {autoplay && <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)} className="min-h-11 px-3 text-xs font-bold">{locale === "en" ? paused ? "Resume" : "Pause" : paused ? "Tiếp tục" : "Tạm dừng"}</button>}
    </div>}
  </div>;
}
