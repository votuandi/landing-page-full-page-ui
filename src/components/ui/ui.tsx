"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useCountUp } from "@/lib/useCountUp";
import { formatNumber } from "@/lib/solarCalculator";
import { useLang } from "@/i18n/LangProvider";

/** Tiêu đề section theo design system template-12 (eyebrow + heading + mô tả). */
export function SectionHead({ id, eyebrow, title, desc, action, center = false }: {
  id?: string; eyebrow: string; title: string; desc?: string; action?: ReactNode; center?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-5 ${center ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between"}`}>
      <div data-reveal="down" className={center ? "max-w-3xl" : "max-w-3xl"}>
        <span className="t15-eyebrow">{eyebrow}</span>
        <h2 id={id} className={`t15-heading ${center ? "mx-auto" : ""}`}>{title}</h2>
        {desc && <p className={`t15-subheading ${center ? "mx-auto" : ""}`}>{desc}</p>}
      </div>
      {action && <div data-reveal="up" className="min-w-0 lg:max-w-[55%]">{action}</div>}
    </div>
  );
}

/** Nút trước/sau cho carousel. */
export function CarouselNav({ prev, next, atStart, atEnd, className = "" }: { prev: () => void; next: () => void; atStart: boolean; atEnd: boolean; className?: string }) {
  const { tr } = useLang();
  const btn = "t15-glass grid h-12 w-12 place-items-center rounded-full text-fg transition hover:bg-glass-tint/10 disabled:opacity-35";
  return (
    <div className={`flex gap-2 ${className}`}>
      <button type="button" onClick={prev} disabled={atStart} aria-label={tr("Trước", "Previous")} className={btn}><ChevronLeftIcon className="h-5 w-5" /></button>
      <button type="button" onClick={next} disabled={atEnd} aria-label={tr("Tiếp", "Next")} className={btn}><ChevronRightIcon className="h-5 w-5" /></button>
    </div>
  );
}

/** Số đếm khi `start` = true; tôn trọng prefers-reduced-motion (qua useCountUp). */
export function CountUp({ value, start = true, decimals = 0, duration = 1400 }: { value: number; start?: boolean; decimals?: number; duration?: number }) {
  const v = useCountUp(value, { duration, start });
  return <>{decimals ? v.toFixed(decimals).replace(".", ",") : formatNumber(v)}</>;
}

/** Hành vi chung cho dialog: khóa cuộn, focus phần tử đầu, Esc để đóng, trả focus khi đóng, giữ Tab trong dialog. */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void, initialFocus?: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (initialFocus?.current || ref.current)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab" && ref.current) {
        const nodes = Array.from(ref.current.querySelectorAll<HTMLElement>("button:not([tabindex='-1']), a[href], iframe, video, input, select, textarea"));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; opener?.focus(); };
  }, [ref, initialFocus]);
}
