import { z } from "zod";
import sharp from "sharp";
import type { OutboxJob, Promotion } from "@solar/db";
import { kindOf, privateKey, sniff, UPLOAD_LIMITS, type StorageDriver } from "@solar/storage";
import { PermanentError } from "../loop.ts";

export type JobMedia = { id: string; tenantId: string; key: string; status: string; visibility: string; mime: string; size: number };
export type ScanMedia = {
  get(tenantId: string, id: string): Promise<JobMedia | null>;
  promote(tenantId: string, id: string, data: Promotion): Promise<boolean>;
  reject(tenantId: string, id: string, reason: string): Promise<boolean>;
};
export function mediaJob(job: OutboxJob, topic: string) {
  const parsed = z.strictObject({ tenantId: z.uuid(), id: z.uuid() }).safeParse(job.payload);
  if (!parsed.success || parsed.data.tenantId !== job.tenantId || job.topic !== topic) throw new PermanentError("media: payload hoặc tenant không hợp lệ");
  return parsed.data;
}
export function ownedKey(row: JobMedia, prefix: "quarantine" | "private" | "tenants") {
  if (!row.key.startsWith(`${prefix}/${row.tenantId}/`)) throw new PermanentError("media: khóa khác tenant hoặc vùng lưu trữ");
}

export function createMediaScan({ media, storage }: { media: ScanMedia; storage: StorageDriver }) {
  return async (job: OutboxJob) => {
    const { tenantId, id } = mediaJob(job, "media.scan");
    const row = await media.get(tenantId, id);
    if (!row || row.status === "ready") return;
    ownedKey(row, "quarantine");
    if (row.status === "failed") { await storage.delete(row.key); return; }
    const reject = async (reason: string) => { await media.reject(tenantId, id, reason); await storage.delete(row.key); };
    const head = await storage.head(row.key);
    if (!head || head.size <= 0 || head.size > row.size) return reject("missing or oversized object");
    const bytes = await storage.get(row.key);
    if (!bytes || !bytes.byteLength || bytes.byteLength > row.size) return reject("missing or oversized object");
    const format = sniff(bytes);
    if (!format || format.kind !== kindOf(row.mime) || bytes.byteLength > UPLOAD_LIMITS[format.kind]) return reject("unsupported content or size");
    let body: Uint8Array = bytes, width: number | undefined, height: number | undefined;
    if (format.kind === "image") {
      try {
        // Metadata is removed by default: https://sharp.pixelplumbing.com/api-output/
        const output = await sharp(bytes, { animated: true, limitInputPixels: 50_000_000 }).rotate().timeout({ seconds: 30 }).toBuffer({ resolveWithObject: true });
        body = output.data; width = output.info.width; height = output.info.height;
      } catch { return reject("invalid or unsafe image"); }
      // Re-encoding must preserve the detected type and stay inside the quota reservation.
      if (sniff(body)?.mime !== format.mime || body.byteLength > row.size || body.byteLength > UPLOAD_LIMITS.image) return reject("encoded image exceeds reservation or changes format");
    }
    const key = privateKey(tenantId, format.ext);
    await storage.put(key, body, { contentType: format.mime, cacheControl: "private, no-store" });
    const promoted = await media.promote(tenantId, id, { key, mime: format.mime, size: body.byteLength, width, height });
    if (!promoted) await storage.delete(key);
    await storage.delete(row.key);
  };
}
