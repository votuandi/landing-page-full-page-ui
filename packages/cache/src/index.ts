import { randomUUID } from "node:crypto";
import { createMemoryCache, type ContentCache, type CacheOptions } from "./memory.ts";
import { isValidTag } from "./tags.ts";
import { getRedisCore } from "./redis.js";
import { createRedisContentCache } from "./shared.ts";
export * from "./tags.ts";
export * from "./memory.ts";
export * from "./signature.ts";
const state = globalThis as typeof globalThis & { solarContentCache?: ContentCache };
function contentCache() {
  return state.solarContentCache ??= process.env.REDIS_URL
    ? createRedisContentCache({ core: getRedisCore(process.env.REDIS_URL), memory: createMemoryCache() })
    : createMemoryCache();
}
export async function cached<T>(fn: () => Promise<T>, options: CacheOptions): Promise<T> {
  return options.mode === "draft" ? fn() : contentCache().cached(fn, options);
}
export const invalidate = (tags: readonly string[]) => contentCache().invalidate(tags);
export function invalidationJob(tags: readonly string[], { hosts }: { hosts?: readonly string[] } = {}) {
  if (!tags.length || tags.length > 100 || tags.some(tag => !isValidTag(tag))) throw new Error("Invalid cache tags");
  return { topic: "invalidate", payload: { tags: [...tags], ...(hosts ? { hosts: [...hosts] } : {}) }, idempotencyKey: `invalidate:${randomUUID()}` };
}
