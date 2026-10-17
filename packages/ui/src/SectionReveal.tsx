"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal], [data-reveal-stagger] > *";
const offsets: Record<string, string> = { up: "0 64px", down: "0 -48px", left: "-80px 0", right: "80px 0" };
const milliseconds = (value: string, fallback: number) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number * (value.trim().endsWith("ms") ? 1 : 1000) : fallback;
};

/** Finite presentation-only animations: SSR remains visible and React's DOM attributes stay untouched. */
export function SectionReveal() {
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || typeof IntersectionObserver === "undefined" || typeof HTMLElement.prototype.animate !== "function") return;
    const seen = new WeakSet<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting && !motion.matches && !animations.has(el)) {
          const parent = el.parentElement;
          const group = parent?.hasAttribute("data-reveal-stagger") ? parent : null;
          const direction = el.dataset.reveal || group?.dataset.revealStagger || "up";
          const css = getComputedStyle(el);
          const delay = group ? Array.prototype.indexOf.call(group.children, el) * Number(group.dataset.revealStep || 0.1) * 1000 : 0;
          animations.set(el, el.animate([
            { opacity: 0, translate: offsets[direction || "up"] || "0 0", scale: direction === "zoom" ? ".86" : "1", filter: "blur(4px)" },
            { opacity: 1, translate: "0 0", scale: "1", filter: "blur(0px)" },
          ], { duration: milliseconds(css.getPropertyValue("--motion-slow"), 900),
            delay: milliseconds(css.getPropertyValue("--rd"), Number.isFinite(delay) ? delay : 0),
            easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }));
        } else if (!entry.isIntersecting && entry.rootBounds && entry.boundingClientRect.top > entry.rootBounds.bottom) {
          const animation = animations.get(el);
          // The reveal's own translation can cross the observer edge; let it finish before allowing a replay.
          if (animation?.playState !== "running") { animation?.cancel(); animations.delete(el); }
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    const register = (root: ParentNode) => root.querySelectorAll<HTMLElement>(SELECTOR).forEach(el => {
      if (!seen.has(el)) { seen.add(el); observer.observe(el); }
    });
    const mutations = new MutationObserver(records => {
      for (const record of records) if (record.addedNodes.length && record.target.parentNode) register(record.target.parentNode);
      for (const [el, animation] of animations) if (!el.isConnected) {
        animation.cancel(); animations.delete(el); observer.unobserve(el); seen.delete(el);
      }
    });
    const cancel = () => { if (motion.matches) { for (const animation of animations.values()) animation.cancel(); animations.clear(); } };
    register(document);
    mutations.observe(document.body, { childList: true, subtree: true });
    motion.addEventListener("change", cancel);
    return () => { observer.disconnect(); mutations.disconnect(); motion.removeEventListener("change", cancel); for (const animation of animations.values()) animation.cancel(); };
  }, []);
  return null;
}
