"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

/** Nút trước/sau cho carousel. */
export function CarouselNav({ prev, next, atStart, atEnd, className = "", prevLabel = "Trước", nextLabel = "Tiếp" }: { prev: () => void; next: () => void; atStart: boolean; atEnd: boolean; className?: string; prevLabel?: string; nextLabel?: string }) {
  const btn = "t15-glass grid h-12 w-12 place-items-center rounded-full text-fg transition hover:bg-glass-tint/10 disabled:opacity-35";
  return (
    <div className={`flex gap-2 ${className}`}>
      <button type="button" onClick={prev} disabled={atStart} aria-label={prevLabel} className={btn}><ChevronLeftIcon className="h-5 w-5" /></button>
      <button type="button" onClick={next} disabled={atEnd} aria-label={nextLabel} className={btn}><ChevronRightIcon className="h-5 w-5" /></button>
    </div>
  );
}

