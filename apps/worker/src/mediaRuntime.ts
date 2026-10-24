import { forTenant, forPlatform, promoteMedia, rejectMedia, type MediaVariant, type PlatformDb } from "@solar/db";
import { storageFromEnv } from "@solar/storage";
import sharp from "sharp";
import { createMediaScan } from "./handlers/mediaScan.ts";
import { createMediaPublish, cleanupExpiredMedia } from "./handlers/mediaPublish.ts";

export function createMediaRuntime(db: PlatformDb) {
  sharp.concurrency(1);
  sharp.cache(false);
  // Resolve lazily: non-media jobs do not require storage env configuration.
  const media = {
    get: (tenantId: string, id: string) => forTenant(db, tenantId).media.get(id),
    promote: (tenantId: string, id: string, data: Parameters<typeof promoteMedia>[3]) => promoteMedia(db, tenantId, id, data),
    reject: (tenantId: string, id: string, reason: string) => rejectMedia(db, tenantId, id, reason),
    publish: async (tenantId: string, id: string, key: string, previous: string, variants?: MediaVariant[]) =>
      (await forTenant(db, tenantId).media.update(id, { key, visibility: "public", ...(variants !== undefined ? { variants } : {}) }, { key: previous, status: "ready", visibility: "private" })).count === 1,
  };
  return {
    scan: (job: Parameters<ReturnType<typeof createMediaScan>>[0]) => createMediaScan({ media, storage: storageFromEnv() })(job),
    publish: (job: Parameters<ReturnType<typeof createMediaPublish>>[0]) => createMediaPublish({ media, storage: storageFromEnv() })(job),
    cleanup: () => cleanupExpiredMedia({ expireStale: now => forPlatform(db).media.expireStale(now), storage: storageFromEnv() }),
  };
}
