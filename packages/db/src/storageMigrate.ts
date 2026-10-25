import { createHash } from "node:crypto";
import { z } from "zod";
import { siteTag } from "@solar/cache";
import type { StorageDriver, StorageKind } from "@solar/storage";
import { platformClient, type PlatformDb } from "./client.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";
import { forTenant } from "./repository.ts";
import { enqueueInvalidate } from "./invalidate.ts";
import { ownedMediaKeys } from "./mediaOrphans.ts";
import { Prisma } from "../generated/client.ts";

export function migrationInput(raw: unknown) {
  const result = z.strictObject({ tenant: z.string().trim().min(1), from: z.enum(["local", "s3"]), to: z.enum(["local", "s3"]), dryRun: z.boolean().default(false) }).safeParse(raw);
  if (!result.success) throw new Error("Dùng: pnpm storage:migrate --tenant <slug> --from local|s3 --to local|s3 [--dry-run]");
  const parsed = result.data;
  if (parsed.from === parsed.to) throw new Error("Driver nguồn và đích phải khác nhau");
  return parsed;
}
const sha = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
export async function copyMediaObjects(row: { tenantId: string; key: string; mime: string; variants?: unknown }, source: StorageDriver, target: StorageDriver): Promise<number> {
  const keys = ownedMediaKeys(row);
  if (!keys.includes(row.key)) throw new Error("Khóa media nằm ngoài tenant");
  let size = 0;
  for (const key of keys) {
    const body = await source.get(key);
    if (!body) throw new Error(`Không tìm thấy tệp nguồn: ${key}`);
    await target.put(key, body, { contentType: key === row.key ? row.mime : key.endsWith(".avif") ? "image/avif" : "image/webp",
      cacheControl: key.startsWith("tenants/") ? "public, max-age=31536000, immutable" : "private, no-store" });
    const copied = await target.get(key);
    if (!copied || sha(body) !== sha(copied)) throw new Error(`Checksum không khớp: ${key}`);
    size += body.byteLength;
  }
  return size;
}

export type MigrateOptions = { tenantId: string; from: StorageKind; to: StorageKind; dryRun?: boolean; storage(kind: StorageKind): StorageDriver };
export async function migrateTenantStorage(db: PlatformDb, { tenantId, from, to, dryRun = false, storage }: MigrateOptions) {
  if (from === to) throw new Error("Driver nguồn và đích phải khác nhau");
  // Validate both drivers and tenant before the first mutation.
  const source = storage(from), target = storage(to), client = platformClient(db);
  const tenant = await client.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("Không tìm thấy tenant");
  const repo = forTenant(db, tenantId), where = { driver: from, status: "ready" as const };
  let copied = 0, bytes = 0, skipped = 0;
  if (!dryRun) await client.$transaction(async tx => {
    await tx.tenant.update({ where: { id: tenantId }, data: { storageDriver: to } });
    await tx.auditLog.create({ data: { tenantId, actorType: "system", action: "media.storage_driver_changed", entity: "Tenant", entityId: tenantId, data: { from, to } } });
  });
  if (!dryRun) for (const row of await repo.media.list({ where, orderBy: { id: "asc" } })) {
    const size = await copyMediaObjects(row, source, target);
    const updated = await withTenantTransaction(db, tenantId, async txRepo => {
      const result = await txRepo.media.update(row.id, { driver: to }, { driver: from, key: row.key, status: "ready", variants: { equals: row.variants ?? Prisma.AnyNull } });
      if (result.count) {
        await txRepo.auditLog.create({ actorType: "system", action: "media.storage_migrated", entity: "Media", entityId: row.id, data: { from, to, bytes: size } });
        await enqueueInvalidate(txRepo, [siteTag(tenantId)]);
      }
      return result.count;
    });
    if (updated) { copied++; bytes += size; } else skipped++;
  }
  return { copied, bytes, skipped, remaining: await repo.media.count({ where }) };
}
