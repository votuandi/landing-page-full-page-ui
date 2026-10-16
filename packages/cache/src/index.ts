import { randomUUID } from "node:crypto";
import { createMemoryCache, type ContentCache } from "./memory.ts";
import { isValidTag } from "./tags.ts";
export * from "./tags.ts";
export * from "./memory.ts";
export * from "./signature.ts";
const state = globalThis as typeof globalThis & { solarContentCache?: ContentCache };
const memory = state.solarContentCache ??= createMemoryCache();
export const cached = memory.cached;
export const invalidate = memory.invalidate;
export function invalidationJob(tags: readonly string[], { hosts }: { hosts?: readonly string[] } = {}) {
  if (!tags.length || tags.length > 100 || tags.some(tag => !isValidTag(tag))) throw new Error("Invalid cache tags");
  return { topic: "invalidate", payload: { tags: [...tags], ...(hosts ? { hosts: [...hosts] } : {}) }, idempotencyKey: `invalidate:${randomUUID()}` };
}
