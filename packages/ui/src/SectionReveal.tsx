"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal], [data-reveal-stagger] > *";

/**
 * Reveals elements marked with `data-reveal="up|down|left|right|zoom"` (or every child of a
 * `data-reveal-stagger="..."` container) as they scroll into view. The hidden state lives in
 * globals.css; this only toggles `data-shown`. Elements replay when they leave through the
 * bottom of the viewport so each section animates again when scrolled back down to.
 * Elements rendered later (tab switches, filters) are picked up by a MutationObserver.
 */
export function SectionReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined";
    const seen = new WeakSet<Element>();

    // Stagger delays live in a separate <style> (`:nth-child` rules) instead of each child's `style`:
    // this effect can run before lazy sections hydrate, and touching their attributes causes hydration mismatches.
    const sheet = document.head.appendChild(document.createElement("style"));
    const rules = new Set<string>();
    const applyStagger = (group: HTMLElement) => {
      const step = group.dataset.revealStep;
      const selector = step ? `[data-reveal-stagger][data-reveal-step="${CSS.escape(step)}"]` : "[data-reveal-stagger]:not([data-reveal-step])";
      for (let index = 0; index < group.children.length; index++) {
        const rule = `${selector} > :nth-child(${index + 1}) { --rd: ${(index * Number(step || 0.1)).toFixed(2)}s; }`;
        if (rules.has(rule)) continue;
        rules.add(rule);
        sheet.sheet?.insertRule(rule, sheet.sheet.cssRules.length);
      }
    };

    const observer = reduced ? null : new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) el.setAttribute("data-shown", "");
        else if (entry.rootBounds && entry.boundingClientRect.top > entry.rootBounds.bottom) el.removeAttribute("data-shown");
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    const register = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>("[data-reveal-stagger]").forEach(applyStagger);
      root.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (observer) observer.observe(el); else el.setAttribute("data-shown", "");
      });
    };

    register(document);

    const mutations = new MutationObserver((records) => {
      const parents = new Set<ParentNode>();
      records.forEach((r) => { if (r.addedNodes.length && r.target.parentNode) parents.add(r.target.parentNode); });
      parents.forEach(register);
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => { observer?.disconnect(); mutations.disconnect(); sheet.remove(); };
  }, []);

  return null;
}
