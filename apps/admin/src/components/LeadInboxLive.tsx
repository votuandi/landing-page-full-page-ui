"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LeadInboxLive({ latest }: { latest: string | null }) {
  const router = useRouter(), [message, setMessage] = useState("");
  const [, startTransition] = useTransition();
  useEffect(() => {
    let stopped = false, running = false, previous = latest;
    const controller = new AbortController();
    async function poll() {
      if (document.hidden || stopped || running) return;
      running = true;
      try {
        const response = await fetch("/api/lead/moi-nhat", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(2500)]) });
        if (!response.ok) return;
        const data = await response.json() as { latest?: string | null };
        if (!stopped && data.latest !== undefined && data.latest !== previous) {
          previous = data.latest; setMessage("Có lead mới"); startTransition(() => router.refresh());
        }
      } catch { /* Keep the inbox usable while offline; next poll retries. */ }
      finally { running = false; }
    }
    const timer = setInterval(() => { void poll(); }, 3000);
    const visible = () => { if (!document.hidden) void poll(); };
    document.addEventListener("visibilitychange", visible);
    return () => { stopped = true; controller.abort(); clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [latest, router]);
  return <p aria-live="polite" role="status" className="text-sm text-fg-muted">{message || "Tự cập nhật khi có lead mới"}</p>;
}
