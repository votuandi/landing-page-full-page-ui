import type { StorageDriver } from "@solar/storage";

type IconDeps = {
  loadSite(tenantId: string, siteId: string): Promise<{ profile: { brand?: { favicon?: string } } } | null>;
  media(tenantId: string, id: string): Promise<{ tenantId: string; status: string; visibility: string; key: string } | null>;
  storage: Pick<StorageDriver, "get">;
  resize(bytes: Uint8Array, size: number): Promise<Uint8Array>;
};
const fallback = () => new Response(null, { status: 307, headers: { Location: "/favicon.svg", "Cache-Control": "no-store" } });

export function createIconHandler(deps: IconDeps) {
  return async (tenantId: string, siteId: string, size: 64 | 180) => {
    try {
      const site = await deps.loadSite(tenantId, siteId), id = site?.profile.brand?.favicon;
      if (!id) return fallback();
      const media = await deps.media(tenantId, id);
      if (!media || media.tenantId !== tenantId || media.status !== "ready" || media.visibility !== "public" || !media.key.startsWith(`tenants/${tenantId}/`)) return fallback();
      const bytes = await deps.storage.get(media.key);
      if (!bytes) return fallback();
      const png = await deps.resize(bytes, size);
      return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
    } catch { return fallback(); }
  };
}
