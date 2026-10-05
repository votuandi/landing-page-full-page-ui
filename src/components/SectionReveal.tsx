"use client";

import { useEffect } from "react";

/**
 * Reveals elements marked with `data-reveal="up|down|left|right|zoom"` (or every child of a
 * `data-reveal-stagger="..."` container) as they scroll into view. The hidden state lives in
 * globals.css; this only toggles `data-shown`. Elements replay when they leave through the
 * bottom of the viewport so each section animates again when scrolled back down to.
 */
export default function SectionReveal() {
  useEffect(() => {
    document.querySelectorAll<HTMLElement>("[data-reveal-stagger]").forEach((group) => {
      const step = Number(group.dataset.revealStep || 0.1);
      Array.from(group.children).forEach((child, index) => {
        (child as HTMLElement).style.setProperty("--rd", `${(index * step).toFixed(2)}s`);
      });
    });

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-stagger] > *"));
    const showAll = () => targets.forEach((el) => el.setAttribute("data-shown", ""));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") {
      showAll();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) el.setAttribute("data-shown", "");
        else if (entry.rootBounds && entry.boundingClientRect.top > entry.rootBounds.bottom) el.removeAttribute("data-shown");
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
