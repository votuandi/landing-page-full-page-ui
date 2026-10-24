import type { OutboxJob } from "@solar/db";
import type { StorageDriver } from "@solar/storage";
import { mediaJob, ownedKey, type JobMedia } from "./mediaScan.ts";
import { PermanentError } from "../loop.ts";

export function createMediaPublish({ media, storage }: { media: {
  get(tenantId: string, id: string): Promise<JobMedia | null>;
  publish(tenantId: string, id: string, key: string, previous: string): Promise<boolean>;
}; storage: StorageDriver }) {
  return async (job: OutboxJob) => {
    const { tenantId, id } = mediaJob(job, "media.publish");
    const row = await media.get(tenantId, id);
    if (!row || row.status !== "ready") return;
    if (row.visibility === "public") {
      ownedKey(row, "tenants");
      // Recover a crash after the DB update but before source deletion.
      await storage.delete(row.key.replace(/^tenants\//, "private/"));
      return;
    }
    ownedKey(row, "private");
    const previous = row.key;
    const bytes = await storage.get(previous);
    if (!bytes) throw new PermanentError("media.publish: thiếu tệp private");
    const key = previous.replace(/^private\//, "tenants/");
    await storage.put(key, bytes, { contentType: row.mime, cacheControl: "public, max-age=31536000, immutable" });
    if (await media.publish(tenantId, id, key, previous)) await storage.delete(previous);
  };
}

export async function cleanupExpiredMedia({ expireStale, storage, now = new Date() }: {
  expireStale(now: Date): Promise<{ tenantId: string; key: string }[]>; storage: StorageDriver; now?: Date;
}) {
  for (const row of await expireStale(now)) {
    if (!row.key.startsWith(`quarantine/${row.tenantId}/`)) throw new PermanentError("media cleanup: khóa khác tenant");
    await storage.delete(row.key);
  }
}
