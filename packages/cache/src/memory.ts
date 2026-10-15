export type CacheOptions = { keyParts: string | readonly unknown[]; tags: readonly string[]; mode?: "draft" | "published" };
export function cacheKey({ siteId, locale, mode, parts }: { siteId: string; locale: string; mode: "draft" | "published"; parts: readonly unknown[] }) {
  return JSON.stringify([siteId, locale, mode, parts]);
}
export function createMemoryCache({ maxEntries = 5000, ttlMs = 24 * 60 * 60 * 1000, now = Date.now } = {}) {
  if (!Number.isInteger(maxEntries) || maxEntries < 1 || !(ttlMs > 0)) throw new Error("Invalid cache limits");
  type Entry = { tags: readonly string[]; expiresAt: number; promise: Promise<unknown> };
  const entries = new Map<string, Entry>();
  async function cached<T>(fn: () => Promise<T>, options: CacheOptions): Promise<T> {
    if (options.mode === "draft") return fn();
    const key = JSON.stringify(options.keyParts);
    const hit = entries.get(key);
    if (hit && hit.expiresAt > now()) {
      entries.delete(key); entries.set(key, hit);
      return hit.promise as Promise<T>;
    }
    const entry: Entry = { tags: [...options.tags], expiresAt: Infinity, promise: Promise.resolve() };
    // Invalidation deletes even in-flight entries. Identity prevents an old render overwriting its replacement.
    entry.promise = Promise.resolve().then(fn).then(value => {
      if (entries.get(key) === entry) entry.expiresAt = now() + ttlMs;
      return value;
    }, error => { if (entries.get(key) === entry) entries.delete(key); throw error; });
    entries.delete(key); entries.set(key, entry);
    if (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
    return entry.promise as Promise<T>;
  }
  async function invalidate(tags: readonly string[]) {
    const invalid = new Set(tags);
    for (const [key, entry] of entries) if (entry.tags.some(tag => invalid.has(tag))) entries.delete(key);
  }
  return { cached, invalidate };
}
export type ContentCache = ReturnType<typeof createMemoryCache>;
