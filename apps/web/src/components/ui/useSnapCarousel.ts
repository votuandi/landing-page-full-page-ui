"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const behavior = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

/**
 * Carousel dựa trên CSS scroll-snap (vuốt bằng tay trên mobile, nút trước/sau trên desktop).
 * Trả về chỉ số thẻ đang ở mép trái để hiển thị "01 / N" hoặc chấm chỉ báo.
 */
export function useSnapCarousel<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    setCount(items.length);
    const left = el.scrollLeft + 4;
    let i = 0;
    items.forEach((child, n) => { if (child.offsetLeft - el.offsetLeft <= left) i = n; });
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setAtEnd(end);
    setIndex(end ? items.length - 1 : i);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    let frame = 0;
    const onScroll = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { el.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [measure]);

  const goTo = useCallback((i: number) => {
    const el = ref.current;
    const child = el?.children[Math.max(0, i)] as HTMLElement | undefined;
    if (!el || !child) return;
    el.scrollTo({ left: child.offsetLeft - el.offsetLeft, behavior: behavior() });
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: behavior() });
  }, []);

  return { ref, index, count, atStart: index === 0, atEnd, goTo, prev: () => step(-1), next: () => step(1) };
}

/** "01 / 05" */
export const pad2 = (n: number) => String(n).padStart(2, "0");
