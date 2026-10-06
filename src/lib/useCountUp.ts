"use client";

import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** easeOutExpo — gần với cubic-bezier(.16,1,.3,1) của hiệu ứng reveal template-8. */
const ease = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Đếm số mượt từ giá trị cũ tới giá trị mới. `start=false` giữ ở 0 (dùng khi chờ cuộn tới).
 * Tôn trọng prefers-reduced-motion: nhảy thẳng tới giá trị cuối.
 */
export function useCountUp(target: number, { duration = 900, start = true } = {}) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!start || !Number.isFinite(target)) return;
    if (prefersReducedMotion()) { from.current = target; setValue(target); return; }
    const begin = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - begin) / duration);
      const next = origin + (target - origin) * ease(t);
      from.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, start]);

  return value;
}

/** true khi phần tử lọt vào viewport lần đầu. */
export function useInViewOnce<T extends Element>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}
