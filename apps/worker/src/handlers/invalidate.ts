import { randomUUID } from "node:crypto";
import { isValidTag, signRevalidate } from "@solar/cache";
import type { OutboxJob } from "@solar/db";
import { z } from "zod";
import type { Topic } from "../loop.ts";
const payloadSchema = z.object({ tags: z.array(z.string().refine(isValidTag)).min(1).max(100), hosts: z.array(z.string()).max(100).optional() }).strict();
export function createInvalidate({ urls = () => process.env.WEB_REVALIDATE_URLS, secret = () => process.env.REVALIDATE_SECRET, fetch: send = fetch, now = Date.now }: {
  urls?: () => string | undefined; secret?: () => string | undefined; fetch?: typeof fetch; now?: () => number;
} = {}) {
  return async (job: OutboxJob) => {
    try {
      const key = secret(), endpoints = urls()?.split(",").map(url => url.trim()).filter(Boolean);
      if (!key || !endpoints?.length) throw new Error("Missing revalidation configuration");
      const payload = payloadSchema.parse(job.payload);
      const results = await Promise.allSettled(endpoints.map(async url => {
        if (!["http:", "https:"].includes(new URL(url).protocol)) throw new Error("Invalid revalidation URL");
        const body = JSON.stringify({ ...payload, nonce: randomUUID(), ts: now() });
        const response = await send(url, { method: "POST", body, redirect: "error", signal: AbortSignal.timeout(10_000),
          headers: { "Content-Type": "application/json", "x-signature": signRevalidate(body, key), "x-idempotency-key": job.idempotencyKey } });
        await response.body?.cancel();
        if (!response.ok) throw new Error(`Revalidation HTTP ${response.status}`);
      }));
      if (results.some(result => result.status === "rejected")) throw new Error("Web revalidation incomplete");
    } catch (error) {
      if (now() - job.createdAt.getTime() > 300_000) console.error("[outbox] invalidate trễ > 5 phút", { id: job.id, tenantId: job.tenantId, attempts: job.attempts });
      throw error;
    }
  };
}
export const invalidateTopic: Topic = { maxAgeMs: Infinity, handle: createInvalidate() };
