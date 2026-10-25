import Redis from "ioredis";

/** Increments `key` in a fixed window; returns the count and ms until the window resets. */
export type Counter = (key: string, windowMs: number) => Promise<{ count: number; resetMs: number }>;

export function memoryCounter(now = Date.now): Counter {
  const windows = new Map<string, { count: number; reset: number }>();
  return async (key, windowMs) => {
    const time = now();
    if (windows.size > 10_000) for (const [k, w] of windows) if (w.reset <= time) windows.delete(k);
    let window = windows.get(key);
    if (!window || window.reset <= time) windows.set(key, window = { count: 0, reset: time + windowMs });
    window.count++;
    return { count: window.count, resetMs: window.reset - time };
  };
}

const script = "local c = redis.call('INCR', KEYS[1]) if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end return {c, redis.call('PTTL', KEYS[1])}";
export function redisCounter(redis: Pick<Redis, "eval">): Counter {
  return async (key, windowMs) => {
    const [count, ttl] = await redis.eval(script, 1, key, windowMs) as [number, number];
    return { count, resetMs: ttl > 0 ? ttl : windowMs };
  };
}

/** Redis is shared by every web instance; when it is down, fall back to this instance's memory instead of blocking leads. */
export function createRateLimiter({ primary, fallback = memoryCounter() }: { primary?: Counter; fallback?: Counter } = {}) {
  return async function hit(key: string, limit: number, windowMs: number) {
    let result: Awaited<ReturnType<Counter>>;
    try {
      if (!primary) throw new Error("no shared counter");
      result = await primary(key, windowMs);
    } catch (error) {
      if (primary) console.error("[rate-limit] Redis lỗi, dùng bộ đếm bộ nhớ", error);
      result = await fallback(key, windowMs);
    }
    return { ok: result.count <= limit, retryAfterSec: Math.max(1, Math.ceil(result.resetMs / 1000)) };
  };
}
export type RateLimiter = ReturnType<typeof createRateLimiter>;

const state = globalThis as typeof globalThis & { solarRateLimiter?: RateLimiter; solarRateLimitRedis?: Redis };
export function getRateLimitRedis() {
  const url = process.env.REDIS_URL;
  if (!url) return undefined;
  return state.solarRateLimitRedis ??= new Redis(url, {
    // Queue while connecting (bounded by commandTimeout) so the first requests after boot share the Redis quota.
    enableOfflineQueue: true, maxRetriesPerRequest: 0, commandTimeout: 500, connectTimeout: 1_000,
  }).on("error", () => undefined);
}
export function getRateLimiter() {
  const redis = getRateLimitRedis();
  return state.solarRateLimiter ??= createRateLimiter({ primary: redis ? redisCounter(redis) : undefined });
}

/** First hop of `x-forwarded-for` (set by Caddy), then `x-real-ip`. */
export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim() || "unknown";
}
