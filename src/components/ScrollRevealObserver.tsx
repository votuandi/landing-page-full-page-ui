"use client";

import { useEffect } from "react";

export default function ScrollRevealObserver() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(".solar-home [data-reveal]"),
    );
    if (!elements.length) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let observer: IntersectionObserver | undefined;
    const showAll = () => {
      observer?.disconnect();
      elements.forEach((element) => element.classList.add("is-visible"));
    };

    if (typeof IntersectionObserver === "undefined") {
      showAll();
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer?.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );

    if (motionPreference.matches) {
      showAll();
    } else {
      elements.forEach((element) => {
        const delay = Math.min(
          360,
          Math.max(0, Number(element.dataset.revealDelay) || 0),
        );
        element.style.setProperty("--reveal-delay", `${delay}ms`);
        element.classList.add("scroll-reveal-target");
        observer?.observe(element);
      });
    }

    // Keyboard navigation must never focus a control that is still invisible.
    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const element = event.target.closest<HTMLElement>("[data-reveal]");
      if (element) {
        element.classList.add("is-visible", "reveal-focused");
        observer?.unobserve(element);
      }
    };
    const onMotionChange = () => {
      if (motionPreference.matches) showAll();
    };
    document.addEventListener("focusin", revealFocused);
    motionPreference.addEventListener("change", onMotionChange);
    return () => {
      observer?.disconnect();
      motionPreference.removeEventListener("change", onMotionChange);
      document.removeEventListener("focusin", revealFocused);
      elements.forEach((element) => {
        element.classList.remove(
          "scroll-reveal-target",
          "is-visible",
          "reveal-focused",
        );
        element.style.removeProperty("--reveal-delay");
      });
    };
  }, []);

  return null;
}
