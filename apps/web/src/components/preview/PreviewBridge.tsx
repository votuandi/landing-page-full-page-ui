"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminOrigin, parsePreviewMessage, PREVIEW_MESSAGE, shouldHandlePreview } from "@solar/cms-ui/preview/protocol";

export function PreviewBridge({ adminPort }: { adminPort?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const requested = useRef<{ sectionId?: string } | null>(null);
  const origin = useRef<string | null>(null);
  useEffect(() => {
    if (window.parent === window) return;
    const target = adminOrigin(window.location.hostname, window.location.protocol, adminPort ?? window.location.port);
    origin.current = target;
    if (!target) return;
    function scroll(sectionId?: string) {
      if (!sectionId) return;
      document.querySelector(`[data-section-id="${CSS.escape(sectionId)}"]`)?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    const receive = (event: MessageEvent) => {
      if (!shouldHandlePreview(event, target, window.parent)) return;
      const message = parsePreviewMessage(event.data);
      if (message?.action === "scroll") scroll(message.sectionId);
      if (message?.action === "refresh") {
        requested.current = { sectionId: message.sectionId };
        // https://nextjs.org/docs/app/api-reference/functions/use-router#userouter
        start(() => router.refresh());
      }
    };
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: PREVIEW_MESSAGE, action: "ready" }, target);
    return () => window.removeEventListener("message", receive);
  }, [adminPort, router]);
  useEffect(() => {
    if (pending || !requested.current || !origin.current) return;
    const { sectionId } = requested.current;
    requested.current = null;
    if (sectionId) document.querySelector(`[data-section-id="${CSS.escape(sectionId)}"]`)?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    window.parent.postMessage({ type: PREVIEW_MESSAGE, action: "updated", ...(sectionId ? { sectionId } : {}) }, origin.current);
  }, [pending]);
  return null;
}
