"use client";

import { useId, useState } from "react";

export function FocalPicker({ src, width, height, initial }: { src: string; width: number; height: number; initial: { x: number; y: number } }) {
  const [point, setPoint] = useState(initial), id = useId();
  return <fieldset className="min-w-0 space-y-3">
    <legend className="font-semibold">Điểm lấy nét</legend>
    <p id={`${id}-hint`} className="text-sm text-fg-muted">Chọn trên ảnh hoặc nhập tọa độ từ 0 đến 1. Dùng phím mũi tên trên ảnh để di chuyển điểm.</p>
    <button type="button" aria-label="Chọn điểm lấy nét trên ảnh" aria-describedby={`${id}-hint`} className="relative block w-full overflow-hidden rounded-card border border-line/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      onClick={event => {
        if (!event.detail) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const at = (value: number) => Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;
        setPoint({ x: at((event.clientX - rect.left) / rect.width), y: at((event.clientY - rect.top) / rect.height) });
      }} onKeyDown={event => {
        const shifts: Record<string, [number, number]> = { ArrowLeft: [-0.01, 0], ArrowRight: [0.01, 0], ArrowUp: [0, -0.01], ArrowDown: [0, 0.01] };
        const shift = shifts[event.key]; if (!shift) return;
        event.preventDefault(); setPoint(p => ({ x: Math.round(Math.min(1, Math.max(0, p.x + shift[0])) * 100) / 100, y: Math.round(Math.min(1, Math.max(0, p.y + shift[1])) * 100) / 100 }));
      }}>
      {/* Private authenticated preview is served by the admin API, without public image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" width={width} height={height} className="block h-auto w-full" />
      <span aria-hidden="true" className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-pill border-2 border-bg bg-primary/70 ring-2 ring-primary" style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} />
    </button>
    <div className="grid grid-cols-2 gap-3">{(["x", "y"] as const).map(axis => <label key={axis} className="space-y-1">
      <span className="block">{axis === "x" ? "Tọa độ ngang (x)" : "Tọa độ dọc (y)"}</span>
      <input type="number" inputMode="decimal" name={axis} min="0" max="1" step="any" required value={Number.isFinite(point[axis]) ? point[axis] : ""} onChange={event => setPoint(p => ({ ...p, [axis]: event.target.valueAsNumber }))} className="w-full rounded-input border border-line/25 bg-bg px-3 py-2 text-fg" />
    </label>)}</div>
    <output aria-live="polite" className="block text-sm text-fg-muted">Điểm: {Number.isFinite(point.x) ? point.x.toFixed(2) : "—"}, {Number.isFinite(point.y) ? point.y.toFixed(2) : "—"}</output>
  </fieldset>;
}
