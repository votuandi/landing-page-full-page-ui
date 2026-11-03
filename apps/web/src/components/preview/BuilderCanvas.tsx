"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type PointerEvent as ReactPointerEvent, type Ref } from "react";
import { PREVIEW_MESSAGE, type PreviewEvent } from "@solar/cms-ui/preview/protocol";
import { sectionRegistry } from "@solar/sections";
import { currentSection, dropTarget, type SectionRect } from "./builderMode";

type Bounds = { top: number; left: number; width: number; height: number; label: string };
type Drop = { targetId: string; position: "before" | "after"; top: number };
type Drag = { id: string; pointerId: number; startY: number; y: number; moved: boolean; drop: Drop | null; handle?: HTMLElement };
export type BuilderCanvasHandle = { dragAt(y: number): void; drop(y: number): Drop | null; cancel(): void };
const sections = () => [...document.querySelectorAll<HTMLElement>("main [data-section-id]")];
const rects = (): SectionRect[] => sections().map(el => ({ id: el.dataset.sectionId!, ...pickRect(el.getBoundingClientRect()) }));
function pickRect(rect: DOMRect) { return { top: rect.top, bottom: rect.bottom, height: rect.height }; }
const sectionLabel = (element: HTMLElement) => sectionRegistry.getType(element.dataset.sectionType ?? "")?.meta.label.vi ?? "Section";

export default function BuilderCanvas({ selectedId, reorder, onSelect, onEvent, handle }: {
  selectedId: string | null; reorder: boolean; onSelect(id: string): void; onEvent(event: PreviewEvent): void; handle?: Ref<BuilderCanvasHandle>;
}) {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const drag = useRef<Drag | null>(null);
  const animation = useRef(0);
  const cancel = useCallback(() => {
    const active = drag.current; drag.current = null; setDrop(null); cancelAnimationFrame(animation.current); animation.current = 0;
    if (active?.handle?.hasPointerCapture(active.pointerId)) active.handle.releasePointerCapture(active.pointerId);
  }, []);
  const calculate = useCallback(() => {
    const active = drag.current;
    if (!active) return;
    active.drop = dropTarget(rects(), active.y, active.id);
    setDrop(active.moved ? active.drop : null);
  }, []);
  const tick = useCallback(function tick() {
    const active = drag.current;
    if (!active) return;
    if (active.moved) {
      const delta = active.y < 64 ? -12 : active.y > window.innerHeight - 64 ? 12 : 0;
      if (delta) window.scrollTo({ top: window.scrollY + delta, behavior: "instant" });
      calculate();
    }
    animation.current = requestAnimationFrame(tick);
  }, [calculate]);
  useImperativeHandle(handle, () => ({
    dragAt(y) {
      if (!reorder) return;
      drag.current = { id: "", pointerId: -1, startY: y, y, moved: true, drop: null };
      calculate(); if (!animation.current) animation.current = requestAnimationFrame(tick);
    },
    drop(y) {
      const target = reorder ? dropTarget(rects(), y) : null;
      cancel(); return target;
    },
    cancel,
  }), [reorder, calculate, tick, cancel]);
  const latest = useRef({ selectedId, onSelect, onEvent });
  useEffect(() => { latest.current = { selectedId, onSelect, onEvent }; }, [selectedId, onSelect, onEvent]);
  useEffect(() => {
    let frame = 0, lastVisible: string | null = null;
    const update = () => {
      frame = 0;
      const elements = sections(), element = elements.find(el => el.dataset.sectionId === latest.current.selectedId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setBounds(rect.height > 0 ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height,
          label: sectionLabel(element) } : null);
      } else setBounds(null);
      const visible = currentSection(rects(), window.innerHeight);
      if (visible && visible !== lastVisible) {
        lastVisible = visible;
        latest.current.onEvent({ type: PREVIEW_MESSAGE, action: "visible", sectionId: visible });
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const click = (event: MouseEvent) => {
      event.preventDefault(); event.stopPropagation();
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>("main [data-section-id]") : null;
      if (element?.dataset.sectionId) latest.current.onSelect(element.dataset.sectionId);
    };
    const submit = (event: Event) => { event.preventDefault(); event.stopPropagation(); };
    document.addEventListener("click", click, true);
    document.addEventListener("submit", submit, true);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule); observer.observe(document.body);
    const mutations = new MutationObserver(schedule); mutations.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); mutations.disconnect();
      document.removeEventListener("click", click, true); document.removeEventListener("submit", submit, true);
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    };
  }, []);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const el = sections().find(el => el.dataset.sectionId === selectedId);
      const rect = el?.getBoundingClientRect();
      setBounds(el && rect && rect.height > 0 ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height, label: sectionLabel(el) } : null);
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const active = drag.current;
      if (!active || active.pointerId !== event.pointerId) return;
      active.y = event.clientY; active.moved ||= Math.abs(active.y - active.startY) > 5;
      calculate(); if (!animation.current) animation.current = requestAnimationFrame(tick);
    };
    const up = (event: PointerEvent) => {
      const active = drag.current;
      if (!active || active.pointerId !== event.pointerId) return;
      const destination = active.drop;
      if (active.moved && destination) {
        const ids = rects().filter(rect => rect.height > 0).map(rect => rect.id);
        const from = ids.indexOf(active.id), target = ids.indexOf(destination.targetId);
        const to = target - (from < target ? 1 : 0) + (destination.position === "after" ? 1 : 0);
        if (from !== to) latest.current.onEvent({ type: PREVIEW_MESSAGE, action: "reorder", sectionId: active.id, targetId: destination.targetId, position: destination.position });
      }
      cancel();
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel); window.addEventListener("keydown", key);
    return () => { cancel(); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); window.removeEventListener("keydown", key); };
  }, [calculate, tick, cancel]);
  function start(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!reorder || !selectedId || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: selectedId, pointerId: event.pointerId, startY: event.clientY, y: event.clientY, moved: false, drop: null, handle: event.currentTarget };
  }
  return <div data-builder-canvas className="pointer-events-none fixed inset-0 z-[100]">
    {bounds && <div data-builder-selected={selectedId} className="fixed border-2 border-primary" style={{ top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height }}>
      <div className="absolute left-0 flex max-w-full items-center gap-2 rounded-button bg-primary px-3 py-1 text-sm font-semibold text-on-primary" style={{ top: Math.max(0, -bounds.top) }}>
        <span className="truncate">{bounds.label}</span>
        {reorder && <button type="button" data-builder-handle aria-label={`Kéo ${bounds.label} để sắp xếp`} tabIndex={-1}
          className="pointer-events-auto min-h-11 touch-none cursor-grab px-2" onPointerDown={start}>Kéo</button>}
      </div>
    </div>}
    {drop && <div data-builder-drop aria-hidden className="fixed inset-x-0 h-1 bg-primary" style={{ top: drop.top }} />}
  </div>;
}
