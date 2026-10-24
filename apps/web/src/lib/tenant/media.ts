import { z } from "zod";
import { mediaVariantsSchema, type TenantRepo } from "@solar/db";
import { assertKey, storageFromEnv, type StorageDriver } from "@solar/storage";
import { mediaSrc, storySource } from "@solar/sections";
import { tenantRepository, siteCanUse, type TenantSite } from "./siteData";

type ObjectData = Record<string, unknown>;
const object = (value: unknown): value is ObjectData => !!value && typeof value === "object" && !Array.isArray(value);
const uuid = (value: unknown): value is string => z.uuid().safeParse(value).success;
const file = (value: unknown): value is ObjectData & { provider: "file"; idOrSrc: string } => object(value) && value.provider === "file" && typeof value.idOrSrc === "string";

/** Runs only on validated server data; never reads request cookies in cached renders. */
export function createMediaResolver(tenantId: string, storage: Pick<StorageDriver, "publicUrl">, canUse: (feature: string) => boolean, repo?: Pick<TenantRepo, "media">) {
  const publicKey = (key: string) => {
    try { assertKey(key); return key.startsWith(`tenants/${tenantId}/`); } catch { return false; }
  };
  return async ({ data }: { data: unknown }): Promise<unknown> => {
    const ids = new Set<string>();
    const collect = (value: unknown) => {
      if (file(value) && uuid(value.idOrSrc)) ids.add(value.idOrSrc.toLowerCase());
      if (Array.isArray(value)) value.forEach(collect);
      else if (object(value)) Object.values(value).forEach(collect);
    };
    collect(data);
    const rows = ids.size && canUse("videoUpload") ? await (repo ?? tenantRepository(tenantId)).media.list({ where: {
      id: { in: [...ids] }, status: "ready", visibility: "public", mime: { startsWith: "video/" },
    } }) : [];
    const videos = new Map(rows.filter(row => row.tenantId === tenantId && row.status === "ready" && row.visibility === "public" && row.mime.startsWith("video/") && publicKey(row.key)).map(row => [row.id.toLowerCase(), row]));
    const visit = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(visit).filter(item => item !== undefined);
      if (!object(value)) return value;
      if (file(value)) {
        if (!uuid(value.idOrSrc)) return storySource.safeParse(value).success ? value : undefined;
        const video = videos.get(value.idOrSrc.toLowerCase());
        return video ? { ...value, idOrSrc: storage.publicUrl(video.key) } : undefined;
      }
      const result: ObjectData = {};
      for (const [key, item] of Object.entries(value)) {
        const resolved = visit(item);
        // A story without its required source disappears; optional video does not hide its parent.
        if (resolved === undefined && key === "source") return undefined;
        if (resolved !== undefined) result[key] = resolved;
      }
      const source = value.source ?? value.video;
      if (file(source) && uuid(source.idOrSrc) && object(value.poster) && typeof value.poster.id === "string" && !mediaSrc(value.poster as { id: string; alt: { vi: string } })) {
        const video = videos.get(source.idOrSrc.toLowerCase());
        const variants = mediaVariantsSchema.safeParse(video?.variants).data ?? [];
        const poster = variants.find(v => v.format === "webp" && v.key.endsWith("-w640.webp") && publicKey(v.key));
        if (poster) result.poster = { ...value.poster, id: storage.publicUrl(poster.key) };
      }
      return result;
    };
    return visit(data);
  };
}

export function tenantMediaResolver(site: TenantSite) {
  // Storage configuration is needed only when a Media UUID resolves, not on static pages.
  return createMediaResolver(site.tenantId, { publicUrl: key => storageFromEnv().publicUrl(key) }, siteCanUse(site));
}
