import { mediaVariantsSchema, type MediaVariant, type OutboxJob } from "@solar/db";
import { assertKey, type StorageDriver, type StorageKind } from "@solar/storage";
import { mediaJob, ownedKey, type JobMedia } from "./mediaScan.ts";
import { PermanentError } from "../loop.ts";
import { invalidationJob } from "@solar/cache";

export function createMediaPublish({ media, storage: resolveStorage, invalidate }: { media: {
  get(tenantId: string, id: string): Promise<JobMedia | null>;
  publish(tenantId: string, id: string, key: string, previous: string, variants?: MediaVariant[], driver?: StorageKind): Promise<boolean>;
}; storage: StorageDriver | ((kind: StorageKind) => StorageDriver); invalidate?: (tenantId: string, job: ReturnType<typeof invalidationJob>) => Promise<unknown> }) {
  return async (job: OutboxJob) => {
    const { tenantId, id } = mediaJob(job, "media.publish");
    const row = await media.get(tenantId, id);
    if (!row || row.status === "failed") return;
    if (row.status === "quarantine") throw new Error("media.publish: đang chờ kiểm tra tệp");
    const storage = typeof resolveStorage === "function" ? resolveStorage(row.driver) : resolveStorage;
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
      await invalidate?.(tenantId, invalidationJob([`tenant:${tenantId}`]));
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
    const previousDriver = row.driver;
    if (await media.publish(tenantId, id, key, previous, publishedVariants, previousDriver)) {
      await invalidate?.(tenantId, invalidationJob([`tenant:${tenantId}`]));
      await cleanup();
    } else {
      const current = await media.get(tenantId, id);
      if (current?.status === "ready" && current.visibility === "private" && current.driver !== previousDriver) throw new Error("media.publish: driver vừa thay đổi, thử lại");
    }
  };
}

export async function cleanupExpiredMedia({ expireStale, storage, now = new Date() }: {
  expireStale(now: Date): Promise<{ tenantId: string; key: string; driver: StorageKind }[]>; storage: StorageDriver | ((kind: StorageKind) => StorageDriver); now?: Date;
}) {
  for (const row of await expireStale(now)) {
    if (!row.key.startsWith(`quarantine/${row.tenantId}/`)) throw new PermanentError("media cleanup: khóa khác tenant");
    await (typeof storage === "function" ? storage(row.driver) : storage).delete(row.key);
  }
}
