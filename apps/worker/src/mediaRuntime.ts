import { forTenant, forPlatform, promoteMedia, rejectMedia, loadBackupMediaProtection, type MediaVariant, type PlatformDb } from "@solar/db";
import { storageFor, type StorageKind } from "@solar/storage";
import sharp from "sharp";
import { createMediaScan } from "./handlers/mediaScan.ts";
import { createMediaPublish, cleanupExpiredMedia } from "./handlers/mediaPublish.ts";
import { runMediaOrphans } from "./handlers/mediaOrphans.ts";

export function createMediaRuntime(db: PlatformDb) {
  sharp.concurrency(1);
  sharp.cache(false);
  // Resolve lazily: non-media jobs do not require storage env configuration.
  const media = {
    get: (tenantId: string, id: string) => forTenant(db, tenantId).media.get(id),
    promote: (tenantId: string, id: string, data: Parameters<typeof promoteMedia>[3]) => promoteMedia(db, tenantId, id, data),
    reject: (tenantId: string, id: string, reason: string) => rejectMedia(db, tenantId, id, reason),
    publish: async (tenantId: string, id: string, key: string, previous: string, variants?: MediaVariant[], driver?: StorageKind) =>
      (await forTenant(db, tenantId).media.update(id, { key, visibility: "public", ...(variants !== undefined ? { variants } : {}) }, { key: previous, status: "ready", visibility: "private", driver })).count === 1,
  };
  return {
    scan: (job: Parameters<ReturnType<typeof createMediaScan>>[0]) => createMediaScan({ media, storage: storageFor })(job),
    publish: (job: Parameters<ReturnType<typeof createMediaPublish>>[0]) => createMediaPublish({ media, storage: storageFor,
      invalidate: (tenantId, job) => forTenant(db, tenantId).outbox.create(job) })(job),
    cleanup: () => cleanupExpiredMedia({ expireStale: now => forPlatform(db).media.expireStale(now), storage: storageFor }),
    orphans: async () => runMediaOrphans({ protect: await loadBackupMediaProtection(), sweep: options => forPlatform(db).media.sweepOrphans(options), storage: storageFor }),
  };
}
