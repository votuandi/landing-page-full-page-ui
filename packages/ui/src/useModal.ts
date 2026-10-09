"use client";

import { useEffect, useRef, type RefObject } from "react";

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
