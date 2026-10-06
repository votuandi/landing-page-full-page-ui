"use client";

import { useEffect } from "react";

/** Progressive enhancement: SSR/no-JS content stays visible; reveal each block once. */
export default function SolarScrollReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".solar-home");
    if (!root || typeof IntersectionObserver === "undefined") return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observed = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          (target as HTMLElement).dataset.solarShown = "";
          observer.unobserve(target);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    );
    function register() {
      root!
        .querySelectorAll<HTMLElement>(
          "[data-solar-reveal], [data-solar-stagger] > *",
        )
        .forEach((element) => {
          if (observed.has(element)) return;
          observed.add(element);
          const group = element.parentElement;
          if (group?.hasAttribute("data-solar-stagger")) {
            element.dataset.solarReveal = group.dataset.solarStagger;
            const index = Array.from(group.children).indexOf(element);
            element.style.setProperty(
              "--solar-reveal-delay",
              `${Math.min(index, 3) * 80}ms`,
            );
          }
          // Keep initial viewport and newly mounted visible cards immediately usable.
          if (
            preference.matches ||
            element.getBoundingClientRect().top < window.innerHeight - 40
          ) {
            element.dataset.solarShown = "";
          } else {
            observer.observe(element);
          }
        });
    }
    function syncPreference() {
      if (preference.matches) {
        root!.removeAttribute("data-solar-motion");
        observed.forEach((element) => {
          element.dataset.solarShown = "";
        });
        observer.disconnect();
      } else {
        register();
        root!.dataset.solarMotion = "";
      }
    }
    register();
    syncPreference();
    // Package/project filters mount fresh cards without changing data or requests.
    const mutations = new MutationObserver(register);
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener("change", syncPreference);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      preference.removeEventListener("change", syncPreference);
      root.removeAttribute("data-solar-motion");
    };
  }, []);
  return null;
}
