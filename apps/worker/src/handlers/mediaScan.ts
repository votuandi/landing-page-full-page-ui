import { z } from "zod";
import sharp, { type Sharp } from "sharp";
import { MediaQuotaError, type MediaVariant, type OutboxJob, type Promotion } from "@solar/db";
import { kindOf, privateKey, sniff, UPLOAD_LIMITS, variantKey, VARIANT_WIDTHS, VARIANT_FORMATS, type StorageDriver } from "@solar/storage";
import { PermanentError } from "../loop.ts";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { probeVideo, posterFrame, InvalidVideoError } from "../video.ts";

export type JobMedia = { id: string; tenantId: string; key: string; status: string; visibility: string; mime: string; size: number; variants?: unknown };
class UnsafeImageError extends Error {}
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

export function createMediaScan({ media, storage, video = { probe: probeVideo, frame: posterFrame } }: {
  media: ScanMedia; storage: StorageDriver;
  video?: { probe: typeof probeVideo; frame: typeof posterFrame };
}) {
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
    let body: Uint8Array = bytes, width: number | undefined, height: number | undefined, pages = 1;
    let poster: Uint8Array | undefined;
    if (format.kind === "video") {
      const folder = await mkdtemp(join(tmpdir(), "solar-video-"));
      try {
        const path = join(folder, `input.${format.ext}`);
        await writeFile(path, bytes);
        const info = await video.probe(path);
        if (info.duration > 600) throw new InvalidVideoError();
        width = info.width; height = info.height;
        poster = await video.frame(path, Math.min(1, info.duration / 2));
      } catch (error) {
        if (error instanceof InvalidVideoError) return reject("invalid or too long video");
        throw error;
      } finally { await rm(folder, { recursive: true, force: true }); }
    }
    const deadline = Date.now() + 30_000;
    const encode = async (pipeline: Sharp) => {
      try {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw new UnsafeImageError();
        const output = await pipeline.timeout({ seconds: Math.max(1, Math.floor(remaining / 1000)) }).toBuffer({ resolveWithObject: true });
        if (Date.now() >= deadline) throw new UnsafeImageError();
        return output;
      } catch { throw new UnsafeImageError(); }
    };
    if (format.kind === "image") {
      try {
        // Metadata is removed by default: https://sharp.pixelplumbing.com/api-output/
        const output = await encode(sharp(bytes, { animated: true, limitInputPixels: 50_000_000 }).rotate());
        body = output.data; width = output.info.width; height = output.info.height; pages = output.info.pages ?? 1;
      } catch { return reject("invalid or unsafe image"); }
      if (sniff(body)?.mime !== format.mime || body.byteLength > UPLOAD_LIMITS.image) return reject("encoded image exceeds kind limit or changes format");
    }
    const key = privateKey(tenantId, format.ext);
    const written: string[] = [], variants: MediaVariant[] = [];
    const cleanup = () => Promise.all(written.map(key => storage.delete(key)));
    const put = async (key: string, body: Uint8Array, contentType: string) => {
      written.push(key);
      await storage.put(key, body, { contentType, cacheControl: "private, no-store" });
    };
    try {
      await put(key, body, format.mime);
      if ((format.kind === "image" && pages <= 1) || poster) {
        for (const targetWidth of VARIANT_WIDTHS) for (const format of VARIANT_FORMATS) {
          let output: Awaited<ReturnType<typeof encode>>;
          try {
            const image = sharp(poster ?? body, { limitInputPixels: 50_000_000 }).resize({ width: targetWidth, withoutEnlargement: true });
            output = await encode(format === "avif" ? image.avif({ quality: 50 }) : image.webp({ quality: 75 }));
          } catch { throw new UnsafeImageError(); }
          const variant = { key: variantKey(key, targetWidth, format), format, width: output.info.width, height: output.info.height, size: output.data.byteLength };
          await put(variant.key, output.data, `image/${format}`);
          variants.push(variant);
        }
      }
      const promoted = await media.promote(tenantId, id, { key, mime: format.mime, size: body.byteLength, width, height, variants });
      if (!promoted) await cleanup();
    }
    catch (error) {
      await cleanup();
      if (error instanceof UnsafeImageError) return reject("invalid or unsafe image");
      if (error instanceof MediaQuotaError) return reject("quota: cleaned file exceeds tenant limit");
      throw error;
    }
    await storage.delete(row.key);
  };
}
