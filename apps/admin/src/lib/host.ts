import type { SlugRecord } from "@solar/db";

export function adminSlug(host: string, platform: string): string | null {
  const match = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.admin\.([a-z0-9.-]+)(?::([0-9]{1,5}))?$/.exec(host.toLowerCase());
  if (!match || match[2] !== platform.toLowerCase() || match[3] && (+match[3] < 1 || +match[3] > 65535)) return null;
  return match[1];
}
export function createHostResolver(lookup: (slug: string) => Promise<SlugRecord | null>, platform: string, now = Date.now) {
  const cache = new Map<string, { record: SlugRecord | null; until: number }>();
  return async (host: string) => {
    const slug = adminSlug(host, platform);
    if (!slug) return null;
    const cached = cache.get(slug);
    if (cached && cached.until > now()) return cached.record && { ...cached.record, slug };
    const record = await lookup(slug);
    if (cache.size >= 1000) cache.clear();
    cache.set(slug, { record, until: now() + 60_000 });
    return record && { ...record, slug };
  };
}
