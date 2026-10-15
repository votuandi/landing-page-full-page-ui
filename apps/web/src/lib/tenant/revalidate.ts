import Redis from "ioredis";
import { z } from "zod";
import { invalidate, isValidTag, verifyRevalidate } from "@solar/cache";
import { revalidateTag } from "next/cache";
import { clientIp, getRateLimiter, type RateLimiter } from "./rateLimit";
import { normalizeHost } from "./host";

type ClaimNonce = (nonce: string) => Promise<boolean>;
export function memoryNonces(now = Date.now): ClaimNonce {
  const used = new Map<string, number>();
  return async nonce => {
    const time = now();
    for (const [key, expires] of used) if (expires <= time) used.delete(key);
    if (used.has(nonce)) return false;
    if (used.size >= 10_000) throw new Error("Nonce store full");
    used.set(nonce, time + 600_000);
    return true;
  };
}
export function redisNonces(redis: Pick<Redis, "set">): ClaimNonce {
  return async nonce => (await redis.set(`revalidate:nonce:${nonce}`, "1", "PX", 600_000, "NX")) === "OK";
}
const state = globalThis as typeof globalThis & { solarRevalidateNonces?: ClaimNonce };
function getNonces() {
  const url = process.env.REDIS_URL;
  // Offline queue: the first command after boot waits for the connection (bounded by commandTimeout) instead of failing.
  return state.solarRevalidateNonces ??= url ? redisNonces(new Redis(url, {
    enableOfflineQueue: true, maxRetriesPerRequest: 0, commandTimeout: 500, connectTimeout: 1000,
  }).on("error", () => undefined)) : memoryNonces();
}
const schema = z.object({
  tags: z.array(z.string().max(256).refine(isValidTag)).min(1).max(100),
  hosts: z.array(z.string().max(253).refine(host => normalizeHost(host) === host)).max(100).optional(),
  nonce: z.string().min(8).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  ts: z.number().int().nonnegative(),
}).strict();
type Options = {
  secret?: () => string | undefined; now?: () => number; claimNonce?: ClaimNonce; limit?: RateLimiter;
  invalidate?: (tags: readonly string[]) => Promise<void>; revalidateTag?: (tag: string) => void;
  invalidateHosts?: (hosts: string[]) => Promise<void>;
};
const response = (status: number, extra: HeadersInit = {}) => Response.json({ ok: status === 200 }, { status, headers: { "Cache-Control": "no-store", ...extra } });
export function createRevalidateHandler(options: Options = {}) {
  return async function POST(request: Request) {
    const secret = (options.secret ?? (() => process.env.REVALIDATE_SECRET))();
    if (!secret) return response(503);
    try {
      const rate = await (options.limit ?? getRateLimiter())(`revalidate:ip:${clientIp(request)}`, 120, 60_000);
      if (!rate.ok) return response(429, { "Retry-After": String(rate.retryAfterSec) });
      // Bound bytes even for chunked requests; Content-Length alone is untrusted.
      const reader = request.body?.getReader();
      const chunks: Uint8Array[] = []; let size = 0;
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 65_536) { await reader.cancel(); return response(413); }
          chunks.push(value);
        }
      }
      const body = Buffer.concat(chunks).toString("utf8");
      if (!verifyRevalidate(body, request.headers.get("x-signature") ?? "", secret)) return response(401);
      let json: unknown;
      try { json = JSON.parse(body); } catch { return response(400); }
      const parsed = schema.safeParse(json);
      if (!parsed.success) return response(400);
      const { tags, hosts, nonce, ts } = parsed.data;
      if (Math.abs((options.now ?? Date.now)() - ts) > 300_000) return response(401);
      if (!await (options.claimNonce ?? getNonces())(nonce)) return response(409);
      await (options.invalidate ?? invalidate)(tags);
      for (const tag of new Set(tags)) (options.revalidateTag ?? (tag => revalidateTag(tag, { expire: 0 })))(tag);
      if (hosts?.length) await (options.invalidateHosts ?? (async hosts => (await import("./index")).invalidateHosts(hosts)))(hosts);
      return response(200);
    } catch {
      console.error("[revalidate] invalidation unavailable");
      return response(503);
    }
  };
}
