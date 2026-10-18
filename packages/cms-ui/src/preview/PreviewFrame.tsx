"use client";

import { useEffect, useRef } from "react";
import { parsePreviewMessage, PREVIEW_MESSAGE, shouldHandlePreview } from "./protocol.ts";
export type PreviewFrameProps = { src: string; title: string; sectionId: string; targetOrigin: string; refreshKey: number; onUpdated?(): void };
export function PreviewFrame({ src, title, sectionId, targetOrigin, refreshKey, onUpdated }: PreviewFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const latest = useRef({ sectionId, refreshKey, onUpdated });
  useEffect(() => { latest.current = { sectionId, refreshKey, onUpdated }; }, [sectionId, refreshKey, onUpdated]);
  useEffect(() => {
    ready.current = false;
    const receive = (event: MessageEvent) => {
      if (!shouldHandlePreview(event, targetOrigin, frame.current?.contentWindow)) return;
      const message = parsePreviewMessage(event.data);
      if (message?.action === "ready") {
        ready.current = true;
        frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, action: latest.current.refreshKey ? "refresh" : "scroll", sectionId: latest.current.sectionId }, targetOrigin);
      }
      if (message?.action === "updated") latest.current.onUpdated?.();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [src, targetOrigin]);
  useEffect(() => {
    if (ready.current) frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, action: "refresh", sectionId }, targetOrigin);
  }, [refreshKey, sectionId, targetOrigin]);
  return <iframe ref={frame} src={src} title={title} className="h-full min-h-96 w-full rounded-card border border-line/20 bg-bg" />;
}
