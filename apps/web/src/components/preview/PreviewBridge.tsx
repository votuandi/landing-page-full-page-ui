"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { adminOrigin, parsePreviewMessage, PREVIEW_MESSAGE, shouldHandlePreview, type PreviewEvent } from "@solar/cms-ui/preview/protocol";
import { builderMode, scrollBehavior } from "./builderMode";
import type { BuilderCanvasHandle } from "./BuilderCanvas";

const BuilderCanvas = dynamic(() => import("./BuilderCanvas"), { ssr: false });
function scrollToSection(sectionId?: string) {
  if (!sectionId) return;
  const top = document.querySelector(`[data-section-id="${CSS.escape(sectionId)}"]`)?.getBoundingClientRect().top;
  if (top !== undefined) window.scrollTo({ top: top + window.scrollY, behavior: scrollBehavior(window.matchMedia("(prefers-reduced-motion: reduce)").matches) });
}

export function PreviewBridge({ adminPort }: { adminPort?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const requested = useRef<{ sectionId?: string } | null>(null);
  const origin = useRef<string | null>(null);
  const [mode, setMode] = useState<ReturnType<typeof builderMode>>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useRef<string | null>(null);
  const canvas = useRef<BuilderCanvasHandle>(null);
  const send = useCallback((event: PreviewEvent) => { if (origin.current) window.parent.postMessage(event, origin.current); }, []);
  const select = useCallback((id: string) => {
    selected.current = id; setSelectedId(id); send({ type: PREVIEW_MESSAGE, action: "select", sectionId: id });
  }, [send]);
  useEffect(() => {
    if (window.parent === window) return;
    const target = adminOrigin(window.location.hostname, window.location.protocol, adminPort ?? window.location.port);
    origin.current = target;
    if (!target) return;
    const builder = builderMode(window.location.search, true);
    const frame = requestAnimationFrame(() => setMode(builder));
    const receive = (event: MessageEvent) => {
      if (!shouldHandlePreview(event, target, window.parent)) return;
      const message = parsePreviewMessage(event.data);
      if (builder?.reorder) {
        if (message?.action === "drag") canvas.current?.dragAt(message.y);
        if (message?.action === "drag-cancel") canvas.current?.cancel();
        if (message?.action === "drop" && canvas.current) {
          const target = canvas.current.drop(message.y);
          send({ type: PREVIEW_MESSAGE, action: "insert", ...(target ? { targetId: target.targetId, position: target.position } : {}) });
        }
      }
      if (message?.action === "scroll") scrollToSection(message.sectionId);
      if (builder && message?.action === "select" && message.sectionId !== selected.current) {
        selected.current = message.sectionId; setSelectedId(message.sectionId); scrollToSection(message.sectionId);
      }
      if (message?.action === "refresh") {
        requested.current = { sectionId: message.sectionId };
        // https://nextjs.org/docs/app/api-reference/functions/use-router#userouter
        start(() => router.refresh());
      }
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: PREVIEW_MESSAGE, action: "ready" }, target);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("message", receive); };
  }, [adminPort, router, send]);
  useEffect(() => {
    if (pending || !requested.current || !origin.current) return;
    const { sectionId } = requested.current;
    requested.current = null;
    if (sectionId) scrollToSection(sectionId);
    window.parent.postMessage({ type: PREVIEW_MESSAGE, action: "updated", ...(sectionId ? { sectionId } : {}) }, origin.current);
  }, [pending]);
  return mode ? <BuilderCanvas handle={canvas} selectedId={selectedId} reorder={mode.reorder} onSelect={select} onEvent={send} /> : null;
}
