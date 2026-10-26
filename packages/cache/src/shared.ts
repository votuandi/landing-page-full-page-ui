import { createMemoryCache, type CacheOptions } from "./memory.ts";
import type { RedisCore } from "./redis.js";

export function createRedisContentCache({ core, memory }: { core: RedisCore; memory: ReturnType<typeof createMemoryCache> }) {
  // Reset the existing L1 rather than keeping a second, unbounded metadata map.
  core.onReset(() => memory.clear());
  core.onInvalidate(tags => { void memory.invalidate(tags); });
  async function cached<T>(fn: () => Promise<T>, options: CacheOptions): Promise<T> {
    if (options.mode === "draft") return fn();
    let expiration: number;
    try { expiration = await core.expiration(options.tags); }
    catch { core.warn(); return fn(); }
    const load = () => memory.cached(async () => ({ startedAt: core.now(), value: await fn(), invalidated: false }), options);
    const entry = await load();
    if (entry.startedAt > expiration) return entry.value;
    // Synchronous identity flag keeps concurrent readers from evicting the replacement.
    if (!entry.invalidated) { entry.invalidated = true; memory.evict(options.keyParts); }
    return (await load()).value;
  }
  async function invalidate(tags: readonly string[]) {
    await memory.invalidate(tags);
    try { await core.invalidate(tags); } catch (error) { core.warn(); throw error; }
  }
  return { cached, invalidate };
}
