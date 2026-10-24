import { z } from "zod";
import { getPlan, limit } from "@solar/plans";
import { kindOf, UPLOAD_LIMITS, quarantineKey } from "@solar/storage";
import type { Db, PlatformDb } from "./client.ts";
import { platformClient } from "./client.ts";
import { tenantTransaction, withTenantTransaction } from "./tenantTransaction.ts";
import { createTenantRepo, type TenantRepo } from "./repository.ts";

export class MediaError extends Error {
  constructor(message: string, readonly status: 400 | 404 | 409 | 413 = 400) { super(message); this.name = "MediaError"; }
}
export class MediaQuotaError extends MediaError {
  constructor() { super("Vượt dung lượng media của gói dịch vụ.", 413); this.name = "MediaQuotaError"; }
}
export function uploadInput(raw: unknown): { mime: string; size: number } {
  const parsed = z.strictObject({ mime: z.string(), size: z.number().int().positive() }).safeParse(raw);
  if (!parsed.success) throw new MediaError("Thông tin tệp không hợp lệ.");
  const { mime, size } = parsed.data, kind = kindOf(mime);
  if (!kind || size > UPLOAD_LIMITS[kind]) throw new MediaError("Loại hoặc kích thước tệp không được hỗ trợ.");
  return parsed.data;
}

export const usageStatuses = ["quarantine", "ready"] as const;
/** Reservations are rows, so cancellation/rejection cannot leave a separate counter out of sync. */
export async function mediaUsage(repo: Pick<TenantRepo, "media">): Promise<number> {
  return (await repo.media.list({ where: { status: { in: [...usageStatuses] } }, select: { size: true } })).reduce((sum, row) => sum + row.size, 0);
}
export async function reserveUpload(db: Db | PlatformDb, tenantId: string, raw: unknown, driver: "local" | "s3") {
  const input = uploadInput(raw);
  return tenantTransaction(db, tenantId, async tx => {
    const [locked] = await tx.$queryRaw<{ id: string | null }[]>`SELECT public.lock_media_tenant(${tenantId}::uuid) AS id`;
    if (!locked?.id) throw new MediaError("Không tìm thấy website.", 404);
    const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: tenantId } });
    const [usage] = await tx.$queryRaw<{ bytes: bigint }[]>`SELECT COALESCE(SUM(size::bigint), 0)::bigint AS bytes FROM public."Media" WHERE "tenantId" = ${tenantId}::uuid AND status::text = ANY(${[...usageStatuses]}::text[])`;
    const maxBytes = BigInt(Math.floor((getPlan(tenant.planId) ? limit(tenant, "mediaGb") : 0) * 1024 ** 3));
    if (usage.bytes + BigInt(input.size) > maxBytes) throw new MediaQuotaError();
    return createTenantRepo(tx, tenantId).media.create({ ...input, driver, key: quarantineKey(tenantId), status: "quarantine", visibility: "private" });
  });
}
const missing = () => new MediaError("Không tìm thấy media.", 404);
export async function completeUpload(db: Db | PlatformDb, tenantId: string, id: string) {
  return tenantTransaction(db, tenantId, async tx => {
    if (!z.uuid().safeParse(id).success) throw missing();
    const row = await tx.media.findFirst({ where: { id, tenantId, status: "quarantine" } });
    if (!row) throw missing();
    await tx.outbox.createMany({ data: [{ tenantId, topic: "media.scan", payload: { tenantId, id }, idempotencyKey: `media.scan:${id}` }], skipDuplicates: true });
  });
}
export async function cancelUpload(db: Db | PlatformDb, tenantId: string, id: string) {
  return tenantTransaction(db, tenantId, async tx => {
    if (!z.uuid().safeParse(id).success) throw missing();
    const row = await tx.media.findFirst({ where: { id, tenantId, status: "quarantine" } });
    if (!row || !(await tx.media.deleteMany({ where: { id, tenantId, status: "quarantine" } })).count) throw missing();
    return row;
  });
}
export type Promotion = { key: string; mime: string; size: number; width?: number; height?: number };
export async function promoteMedia(db: Db | PlatformDb, tenantId: string, id: string, data: Promotion): Promise<boolean> {
  if (!data.key.startsWith(`private/${tenantId}/`)) throw new MediaError("Khóa media không hợp lệ.");
  return withTenantTransaction(db, tenantId, async repo => {
    const row = await repo.media.get(id);
    if (!row || row.status !== "quarantine") return false;
    if (data.size > row.size) throw new MediaError("Tệp vượt dung lượng đã đặt chỗ.", 413);
    return (await repo.media.update(id, { ...data, status: "ready", visibility: "private" }, { status: "quarantine", key: row.key })).count === 1;
  });
}
export async function rejectMedia(db: Db | PlatformDb, tenantId: string, id: string, reason: string) {
  return withTenantTransaction(db, tenantId, async repo => {
    if (!(await repo.media.update(id, { status: "failed" }, { status: "quarantine" })).count) return false;
    await repo.auditLog.create({ actorType: "system", action: "media.rejected", entity: "Media", entityId: id, data: { reason } });
    return true;
  });
}
/** Worker-only platform sweep; failed quarantine rows are returned again if object deletion previously failed. */
export async function expireStaleMedia(db: PlatformDb, now = new Date()) {
  const client = platformClient(db);
  return client.$transaction(async tx => {
    const rows = await tx.media.findMany({ where: { status: "quarantine", createdAt: { lt: new Date(now.getTime() - 24 * 3600_000) } } });
    for (const row of rows) {
      if ((await tx.media.updateMany({ where: { id: row.id, tenantId: row.tenantId, status: "quarantine" }, data: { status: "failed" } })).count) {
        await tx.auditLog.create({ data: { tenantId: row.tenantId, actorType: "system", action: "media.rejected", entity: "Media", entityId: row.id, data: { reason: "expired" } } });
      }
    }
    return tx.media.findMany({ where: { status: "failed", key: { startsWith: "quarantine/" } } });
  });
}
/** Within the content publication transaction; duplicate jobs do not abort it. */
export async function publishMedia(repo: TenantRepo, ids: readonly string[]) {
  const uuids = [...new Set(ids.filter(id => z.uuid().safeParse(id).success).map(id => id.toLowerCase()))];
  if (!uuids.length) return;
  for (const row of await repo.media.list({ where: { id: { in: uuids }, status: "ready", visibility: "private" }, orderBy: { id: "asc" } })) {
    // Serialize different pages publishing the same asset before checking the unique job key.
    await repo.media.update(row.id, { visibility: "private" }, { visibility: "private" });
    if (!await repo.outbox.first({ where: { idempotencyKey: `media.publish:${row.id}` } })) {
      await repo.outbox.create({ topic: "media.publish", payload: { tenantId: row.tenantId, id: row.id }, idempotencyKey: `media.publish:${row.id}` });
    }
  }
}
