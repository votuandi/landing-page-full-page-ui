"use client";

import { useEffect, useRef } from "react";
import { parsePreviewMessage, PREVIEW_MESSAGE, shouldHandlePreview, type PreviewEvent } from "./protocol.ts";
export type PreviewFrameProps = { src: string; title: string; className?: string; sectionId?: string; selectedId?: string; selectionKey?: number; targetOrigin: string; refreshKey: number; onUpdated?(): void; onEvent?(event: PreviewEvent): void };
export function PreviewFrame({ src, title, className = "rounded-card border border-line/20", sectionId, selectedId, selectionKey, targetOrigin, refreshKey, onUpdated, onEvent }: PreviewFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const latest = useRef({ sectionId, selectedId, refreshKey, onUpdated, onEvent });
  useEffect(() => { latest.current = { sectionId, selectedId, refreshKey, onUpdated, onEvent }; }, [sectionId, selectedId, refreshKey, onUpdated, onEvent]);
  useEffect(() => {
    ready.current = false;
    const receive = (event: MessageEvent) => {
      if (!shouldHandlePreview(event, targetOrigin, frame.current?.contentWindow)) return;
      const message = parsePreviewMessage(event.data);
      if (message?.action === "ready") {
        ready.current = true;
        const current = latest.current;
        frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, action: current.refreshKey ? "refresh" : "scroll", ...(current.sectionId ? { sectionId: current.sectionId } : {}) }, targetOrigin);
        if (current.selectedId) frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, action: "select", sectionId: current.selectedId }, targetOrigin);
      }
      if (message?.action === "updated") latest.current.onUpdated?.();
      if (message && ["ready", "updated", "select", "visible", "reorder"].includes(message.action)) latest.current.onEvent?.(message as PreviewEvent);
    };
    window.addEventListener("message", receive);
    // The preview token is single-use: attach the listener first and keep src out of SSR.
    if (frame.current?.getAttribute("src") !== src) frame.current?.setAttribute("src", src);
    return () => window.removeEventListener("message", receive);
  }, [src, targetOrigin]);
  useEffect(() => {
    if (ready.current) frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, action: "refresh", ...(sectionId ? { sectionId } : {}) }, targetOrigin);
  }, [refreshKey, sectionId, targetOrigin]);
  useEffect(() => {
    if (ready.current && selectedId) frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, action: "select", sectionId: selectedId }, targetOrigin);
  }, [selectedId, selectionKey, targetOrigin]);
  return <iframe ref={frame} title={title} className={`h-full min-h-96 w-full bg-bg ${className}`} />;
}
