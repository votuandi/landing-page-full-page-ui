"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type PointerEvent as ReactPointerEvent, type Ref } from "react";
import { PREVIEW_MESSAGE, type InlineField, type PreviewEvent } from "@solar/cms-ui/preview/protocol";
import { sectionRegistry } from "@solar/sections";
import { currentSection, dropTarget, matchInline, insertPlain, type SectionRect } from "./builderMode";

type Bounds = { top: number; left: number; width: number; height: number; label: string };
type Drop = { targetId: string; position: "before" | "after"; top: number };
type Drag = { id: string; pointerId: number; startY: number; y: number; moved: boolean; drop: Drop | null; handle?: HTMLElement };
type InlineBox = { top: number; left: number; width: number; height: number; path?: string };
type Editing = { text: Text; parent: HTMLElement; snapshot: ChildNode[]; original: string; lastGood: string;
  editable: string | null; field: InlineField; sectionId: string; locale: "vi" | "en"; composing: boolean };
export type BuilderCanvasHandle = { dragAt(y: number): void; drop(y: number): Drop | null; cancel(): void;
  fields(sectionId: string, fields: InlineField[]): void; commit(): void };
const sections = () => [...document.querySelectorAll<HTMLElement>("main [data-section-id]")];
const rects = (): SectionRect[] => sections().map(el => ({ id: el.dataset.sectionId!, ...pickRect(el.getBoundingClientRect()) }));
function pickRect(rect: DOMRect) { return { top: rect.top, bottom: rect.bottom, height: rect.height }; }
const sectionLabel = (element: HTMLElement) => sectionRegistry.getType(element.dataset.sectionType ?? "")?.meta.label.vi ?? "Section";

export default function BuilderCanvas({ selectedId, reorder, pending = false, onSelect, onEvent, handle }: {
  selectedId: string | null; reorder: boolean; pending?: boolean; onSelect(id: string): void; onEvent(event: PreviewEvent): void; handle?: Ref<BuilderCanvasHandle>;
}) {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [drop, setDrop] = useState<Drop | null>(null);
  const drag = useRef<Drag | null>(null);
  const animation = useRef(0);
  const [inlineBox, setInlineBox] = useState<InlineBox | null>(null);
  const inline = useRef<{ sectionId: string; fields: InlineField[] } | null>(null);
  const editing = useRef<Editing | null>(null);
  const latest = useRef({ selectedId, pending, onSelect, onEvent });
  useEffect(() => { latest.current = { selectedId, pending, onSelect, onEvent }; }, [selectedId, pending, onSelect, onEvent]);
  const finish = useCallback((revert = false) => {
    const active = editing.current;
    if (!active) return;
    editing.current = null;
    // React owns these nodes: restore identity before router.refresh reconciles them.
    if (active.parent.childNodes.length !== active.snapshot.length || active.snapshot.some((node, i) => active.parent.childNodes[i] !== node)) {
      active.parent.replaceChildren(...active.snapshot); active.text.nodeValue = active.lastGood;
    }
    const value = revert ? active.original : (active.text.nodeValue ?? "").replace(/\s+/g, " ").trim();
    active.text.nodeValue = value;
    if (active.editable === null) active.parent.removeAttribute("contenteditable");
    else active.parent.setAttribute("contenteditable", active.editable);
    setInlineBox(null);
    if (!revert && value !== active.original.trim()) latest.current.onEvent({ type: PREVIEW_MESSAGE, action: "inline",
      sectionId: active.sectionId, path: active.field.path, locale: active.locale, text: value });
  }, []);
  const commit = useCallback(() => finish(), [finish]);
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
      commit(); setInlineBox(null);
      drag.current = { id: "", pointerId: -1, startY: y, y, moved: true, drop: null };
      calculate(); if (!animation.current) animation.current = requestAnimationFrame(tick);
    },
    drop(y) {
      const target = reorder ? dropTarget(rects(), y) : null;
      cancel(); return target;
    },
    cancel,
    fields(sectionId, fields) {
      if (editing.current && (editing.current.sectionId !== sectionId || fields.length === 0)) commit();
      inline.current = { sectionId, fields };
      if (!editing.current) setInlineBox(null);
    },
    commit,
  }), [reorder, calculate, tick, cancel, commit]);
  useEffect(() => {
    function box(text: Text, path?: string) {
      const range = document.createRange(); range.selectNodeContents(text);
      const rect = range.getBoundingClientRect();
      setInlineBox({ top: rect.top, left: rect.left, width: rect.width, height: rect.height, path });
    }
    function caret(text: Text, offset: number) {
      const range = document.createRange(); range.setStart(text, Math.min(offset, text.length)); range.collapse(true);
      const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
    }
    function atPoint(event: MouseEvent) {
      const doc = document as Document & { caretPositionFromPoint?(x: number, y: number): { offsetNode: Node; offset: number } | null;
        caretRangeFromPoint?(x: number, y: number): Range | null };
      const point = doc.caretPositionFromPoint?.(event.clientX, event.clientY);
      const range = point ? null : doc.caretRangeFromPoint?.(event.clientX, event.clientY);
      return point ? { node: point.offsetNode, offset: point.offset } : range ? { node: range.startContainer, offset: range.startOffset } : null;
    }
    function candidate(event: MouseEvent) {
      const current = latest.current, list = inline.current;
      if (editing.current || current.pending || drag.current || !list || list.sectionId !== current.selectedId) return null;
      const section = sections().find(el => el.dataset.sectionId === current.selectedId);
      if (!section || !(event.target instanceof Node) || !section.contains(event.target)) return null;
      const walker = document.createTreeWalker(section, 4), texts: Text[] = [];
      while (walker.nextNode()) texts.push(walker.currentNode as Text);
      const locale = document.documentElement.lang === "en" ? "en" : "vi";
      const matches = matchInline(texts.map(text => text.nodeValue ?? ""), list.fields, locale);
      const point = atPoint(event);
      for (const [index, field] of matches) {
        const text = texts[index], parent = text.parentElement;
        if (!parent || parent.closest("script,style,noscript,textarea,input,select,[hidden],[aria-hidden=true]")) continue;
        if (point ? point.node !== text : !event.target.contains(text)) continue;
        const range = document.createRange(); range.selectNodeContents(text); const rect = range.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || (!point && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom))) continue;
        return { text, parent, field, sectionId: list.sectionId, locale: locale as "vi" | "en", offset: point?.offset ?? text.length };
      }
      return null;
    }
    const hover = (event: MouseEvent) => {
      if (editing.current) return;
      const hit = candidate(event); if (hit) box(hit.text); else setInlineBox(null);
    };
    const begin = (event: MouseEvent) => {
      const hit = candidate(event); if (!hit) return;
      event.preventDefault(); event.stopPropagation();
      const { text, parent, field, sectionId, locale, offset } = hit;
      editing.current = { text, parent, field, sectionId, locale, original: text.nodeValue ?? "", lastGood: text.nodeValue ?? "",
        snapshot: [...parent.childNodes], editable: parent.getAttribute("contenteditable"), composing: false };
      parent.setAttribute("contenteditable", "plaintext-only");
      if (parent.contentEditable !== "plaintext-only") parent.setAttribute("contenteditable", "true");
      parent.focus(); caret(text, offset); box(text, field.path.join("."));
    };
    const repair = () => {
      const active = editing.current; if (!active) return;
      if (active.parent.childNodes.length !== active.snapshot.length || active.snapshot.some((node, i) => active.parent.childNodes[i] !== node)) {
        active.parent.replaceChildren(...active.snapshot); active.text.nodeValue = active.lastGood;
        caret(active.text, active.text.length);
      } else active.lastGood = active.text.nodeValue ?? "";
      box(active.text, active.field.path.join("."));
    };
    const before = (event: InputEvent) => {
      const active = editing.current; if (!active) return;
      if (["insertParagraph", "insertLineBreak"].includes(event.inputType)) { event.preventDefault(); if (!event.isComposing) commit(); return; }
      if (/^(format|history)/.test(event.inputType) || event.inputType === "insertFromDrop") { event.preventDefault(); return; }
      const ranges = event.getTargetRanges?.() ?? [];
      const selection = window.getSelection();
      if (ranges.length ? [...ranges].some(range => range.startContainer !== active.text || range.endContainer !== active.text)
        : !selection || selection.anchorNode !== active.text || selection.focusNode !== active.text) event.preventDefault();
    };
    const input = (event: Event) => { if (!(event as InputEvent).isComposing && !editing.current?.composing) repair(); };
    const compositionStart = () => { if (editing.current) editing.current.composing = true; };
    const compositionEnd = () => { if (editing.current) editing.current.composing = false; repair(); };
    const paste = (event: ClipboardEvent) => {
      const active = editing.current; if (!active) return;
      event.preventDefault();
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (range.startContainer !== active.text || range.endContainer !== active.text) return;
      const next = insertPlain(active.text.nodeValue ?? "", range.startOffset, range.endOffset, event.clipboardData?.getData("text/plain") ?? "");
      active.text.nodeValue = next.value; active.lastGood = next.value; caret(active.text, next.caret); box(active.text, active.field.path.join("."));
    };
    const key = (event: KeyboardEvent) => {
      const active = editing.current; if (!active) return;
      if (event.isComposing || active.composing) return;
      if (event.key === "Escape" || event.key === "Enter") { event.preventDefault(); event.stopPropagation(); finish(event.key === "Escape"); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
        event.preventDefault(); const range = document.createRange(); range.selectNodeContents(active.text);
        const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range);
      }
      if ((event.ctrlKey || event.metaKey) && ["b", "i", "u", "z", "y"].includes(event.key.toLowerCase())) event.preventDefault();
    };
    const focusout = (event: FocusEvent) => { if (editing.current?.parent === event.target) commit(); };
    const reposition = () => { const active = editing.current; if (active) box(active.text, active.field.path.join(".")); else setInlineBox(null); };
    document.addEventListener("mousemove", hover); document.addEventListener("dblclick", begin, true);
    document.addEventListener("beforeinput", before, true); document.addEventListener("input", input, true);
    document.addEventListener("compositionstart", compositionStart, true); document.addEventListener("compositionend", compositionEnd, true);
    document.addEventListener("paste", paste, true); document.addEventListener("keydown", key, true); document.addEventListener("focusout", focusout, true);
    window.addEventListener("scroll", reposition, { passive: true }); window.addEventListener("resize", reposition);
    return () => {
      finish(true);
      document.removeEventListener("mousemove", hover); document.removeEventListener("dblclick", begin, true);
      document.removeEventListener("beforeinput", before, true); document.removeEventListener("input", input, true);
      document.removeEventListener("compositionstart", compositionStart, true); document.removeEventListener("compositionend", compositionEnd, true);
      document.removeEventListener("paste", paste, true); document.removeEventListener("keydown", key, true); document.removeEventListener("focusout", focusout, true);
      window.removeEventListener("scroll", reposition); window.removeEventListener("resize", reposition);
    };
  }, [commit, finish]);
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
      if (editing.current && event.target instanceof Node && editing.current.parent.contains(event.target)) return;
      commit();
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
  }, [commit]);
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
    commit(); setInlineBox(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: selectedId, pointerId: event.pointerId, startY: event.clientY, y: event.clientY, moved: false, drop: null, handle: event.currentTarget };
  }
  return <div data-builder-canvas className="pointer-events-none fixed inset-0 z-[100]">
    {inlineBox && <div data-builder-editable={inlineBox.path ? undefined : ""} data-builder-inline={inlineBox.path ? "" : undefined} data-path={inlineBox.path}
      aria-hidden className={`fixed rounded-button border-2 border-primary ${inlineBox.path ? "border-solid ring-4 ring-primary/25" : "border-dashed"}`}
      // 4px breathing room so the outline never sits on the glyphs; the chip flips below near the top edge.
      style={{ top: inlineBox.top - 4, left: inlineBox.left - 4, width: inlineBox.width + 8, height: inlineBox.height + 8 }}>
      {!inlineBox.path && <span className={`absolute left-0 whitespace-nowrap rounded-button bg-primary px-2 py-1 text-xs font-semibold text-on-primary shadow-sm ${inlineBox.top < 40 ? "top-full mt-1" : "bottom-full mb-1"}`}>Nhấp đúp để sửa</span>}
    </div>}
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
