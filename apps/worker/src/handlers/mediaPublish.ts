import { mediaVariantsSchema, type MediaVariant, type OutboxJob } from "@solar/db";
import { assertKey, type StorageDriver } from "@solar/storage";
import { mediaJob, ownedKey, type JobMedia } from "./mediaScan.ts";
import { PermanentError } from "../loop.ts";

export function createMediaPublish({ media, storage }: { media: {
  get(tenantId: string, id: string): Promise<JobMedia | null>;
  publish(tenantId: string, id: string, key: string, previous: string, variants?: MediaVariant[]): Promise<boolean>;
}; storage: StorageDriver }) {
  return async (job: OutboxJob) => {
    const { tenantId, id } = mediaJob(job, "media.publish");
    const row = await media.get(tenantId, id);
    if (!row || row.status === "failed") return;
    if (row.status === "quarantine") throw new Error("media.publish: đang chờ kiểm tra tệp");
    // Legacy backup JSON is preserved unless it matches the pipeline's variant schema.
    const variants = mediaVariantsSchema.safeParse(row.variants).data;
    const prefix = row.visibility === "public" ? "tenants" : "private";
    ownedKey(row, prefix);
    for (const key of [row.key, ...(variants ?? []).map(v => v.key)]) {
      try { assertKey(key); } catch { throw new PermanentError("media.publish: khóa không hợp lệ"); }
      if (!key.startsWith(`${prefix}/${tenantId}/`)) throw new PermanentError("media.publish: biến thể khác tenant hoặc vùng lưu trữ");
    }
    const cleanup = () => Promise.all([row.key, ...(variants ?? []).map(v => v.key)].map(key => storage.delete(key.replace(/^tenants\//, "private/"))));
    if (row.visibility === "public") {
      // Recover a crash after the DB update but before source deletion.
      await cleanup();
      return;
    }
    const previous = row.key;
    const bytes = await storage.get(previous);
    if (!bytes) throw new PermanentError("media.publish: thiếu tệp private");
    const key = previous.replace(/^private\//, "tenants/");
    await storage.put(key, bytes, { contentType: row.mime, cacheControl: "public, max-age=31536000, immutable" });
    const publishedVariants = variants?.map(variant => ({ ...variant, key: variant.key.replace(/^private\//, "tenants/") }));
    for (const variant of variants ?? []) {
      const body = await storage.get(variant.key);
      if (!body) throw new PermanentError("media.publish: thiếu biến thể private");
      await storage.put(variant.key.replace(/^private\//, "tenants/"), body, { contentType: `image/${variant.format}`, cacheControl: "public, max-age=31536000, immutable" });
    }
    if (await media.publish(tenantId, id, key, previous, publishedVariants)) await cleanup();
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
