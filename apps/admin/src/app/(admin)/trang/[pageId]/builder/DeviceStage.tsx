"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function DeviceStage({ width, children }: { width: number; children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 800 });
  useEffect(() => {
    const element = stage.current!;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  const scale = size.width ? Math.min(1, size.width / width) : 1;
  return <div ref={stage} className="relative h-[70dvh] min-h-96 min-w-0 overflow-hidden rounded-card border border-line/20 bg-bg-tint">
    <div className="absolute top-0 origin-top-left" style={{ width, height: size.height / scale, left: Math.max(0, (size.width - width * scale) / 2), transform: `scale(${scale})` }}>
      {children}
    </div>
  </div>;
}
