"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Template-8 directional reveals, with visible server output and route-safe setup. */
export default function SectionReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const targets = new Set<HTMLElement>();
    const observer = !motion.matches && typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const element = entry.target as HTMLElement;
            if (entry.isIntersecting) element.setAttribute("data-shown", "");
            else if (entry.rootBounds && entry.boundingClientRect.top > entry.rootBounds.bottom) {
              element.removeAttribute("data-shown");
            }
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })
      : null;

    const showAll = () => targets.forEach((element) => element.setAttribute("data-shown", ""));
    const scan = () => {
      document.querySelectorAll<HTMLElement>("[data-reveal-stagger]").forEach((group) => {
        const step = Number(group.dataset.revealStep || 0.1);
        Array.from(group.children).forEach((child, index) => {
          (child as HTMLElement).style.setProperty("--rd", `${Math.min(index * step, 0.5)}s`);
        });
      });
      document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-stagger] > *").forEach((element) => {
        if (targets.has(element)) return;
        targets.add(element);
        if (!observer || motion.matches) element.setAttribute("data-shown", "");
        else {
          element.setAttribute("data-reveal-ready", "");
          observer.observe(element);
        }
      });
      targets.forEach((element) => {
        if (!element.isConnected) {
          observer?.unobserve(element);
          targets.delete(element);
        }
      });
    };

    scan();
    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });
    motion.addEventListener("change", showAll);

    return () => {
      observer?.disconnect();
      mutations.disconnect();
      motion.removeEventListener("change", showAll);
      targets.forEach((element) => element.removeAttribute("data-reveal-ready"));
    };
  }, [pathname]);

  return null;
}
