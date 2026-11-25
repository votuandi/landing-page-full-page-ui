import { memoryCounter, type Counter } from "@solar/auth";

export function createMediaLimiter({ primary, fallback = memoryCounter() }: {
  primary?: () => Pick<Counter, "increment"> | undefined; fallback?: Counter;
} = {}) {
  return async (tenantId: string): Promise<{ ok: boolean; retryAfterS: number }> => {
    const key = `media:reserve:${tenantId}`, windowMs = 600_000;
    // Mirror every attempt locally so a Redis outage/recovery cannot reset this process's budget.
    const local = await fallback.increment(key, windowMs);
    let count = local.count, resetMs = local.resetMs;
    try {
      const shared = await primary?.()?.increment(key, windowMs);
      if (shared) { count = Math.max(count, shared.count); resetMs = Math.max(resetMs, shared.resetMs); }
    } catch { /* Keep the local reservation when Redis is unavailable. */ }
    return { ok: count <= 60, retryAfterS: Math.max(1, Math.ceil(resetMs / 1000)) };
  };
}
