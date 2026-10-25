import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { assertKey, type StorageKind } from "@solar/storage";
import { siteTag } from "@solar/cache";
import type { PlatformDb } from "./client.ts";
import { platformClient } from "./client.ts";
import { tenantTransaction } from "./tenantTransaction.ts";
import { createTenantRepo } from "./repository.ts";
import { mediaReferenceIds, backupMediaReferenceIds } from "./mediaRetention.ts";
import { parseTenantBackup } from "./tenantBackup.ts";
import { mediaVariantsSchema } from "./media.ts";
import { enqueueInvalidate } from "./invalidate.ts";

export type OrphanMedia = { tenantId: string; id: string; key: string; driver: StorageKind; keys: string[]; orphanedAt: Date };
export type OrphanOptions = { tenantId?: string; now?: Date; protect?: Map<string, Set<string>>; dryRun?: boolean };

export function ownedMediaKeys(row: { tenantId: string; key: string; variants?: unknown }): string[] {
  return [...new Set([row.key, ...(mediaVariantsSchema.safeParse(row.variants).data ?? []).map(v => v.key)])].filter(key => {
    try { assertKey(key); return ["tenants", "private"].some(prefix => key.startsWith(`${prefix}/${row.tenantId}/`)); } catch { return false; }
  });
}

/** Read every retained bundle before making any DB changes. A corrupt/missing configured directory fails closed. */
export async function loadBackupMediaProtection(directory = process.env.MEDIA_BACKUP_DIR): Promise<Map<string, Set<string>>> {
  const protect = new Map<string, Set<string>>();
  if (!directory) return protect;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.name.endsWith(".json")) continue;
    if (!entry.isFile()) throw new Error("Bản sao lưu media phải là file JSON thông thường");
    const bundle = parseTenantBackup(await readFile(join(directory, entry.name), "utf8"));
    const tenantId = bundle.source.tenantId.toLowerCase(), ids = protect.get(tenantId) ?? new Set<string>();
    for (const id of backupMediaReferenceIds(bundle)) ids.add(id);
    protect.set(tenantId, ids);
  }
  return protect;
}

export async function sweepOrphanMedia(db: PlatformDb, { tenantId, now = new Date(), protect = new Map(), dryRun = false }: OrphanOptions = {}): Promise<OrphanMedia[]> {
  const tenants = await platformClient(db).tenant.findMany({ where: tenantId ? { id: tenantId } : {}, select: { id: true } });
  const deleted: OrphanMedia[] = [], cutoff = new Date(+now - 30 * 86400_000);
  for (const tenant of tenants) {
    // ReadCommitted + row locks instead of Serializable: the sweep scans whole tables, and SSI predicate locks would abort
    // unrelated tenants' Serializable writes. Lock candidates first so the reference scan sees every committed writer;
    // writers touch the referenced row (repository checkRefs), so an in-flight reference blocks this lock until it commits.
    const rows = await tenantTransaction(db, tenant.id, async tx => {
      await tx.$queryRaw`SELECT id FROM public."Media" WHERE "tenantId" = ${tenant.id}::uuid AND status = 'ready' AND "orphanedAt" < ${cutoff} FOR UPDATE`;
      const repo = createTenantRepo(tx, tenant.id);
      const refs = await mediaReferenceIds(repo);
      for (const id of protect.get(tenant.id) ?? []) refs.add(id.toLowerCase());
      const candidates: OrphanMedia[] = [];
      for (const row of await repo.media.list({ where: { status: "ready" }, orderBy: { id: "asc" } })) {
        if (refs.has(row.id.toLowerCase())) {
          if (!dryRun && row.orphanedAt) await repo.media.update(row.id, { orphanedAt: null });
          continue;
        }
        if (!row.orphanedAt) {
          if (!dryRun) await repo.media.update(row.id, { orphanedAt: now });
          continue;
        }
        if (row.orphanedAt >= cutoff) continue;
        const candidate = { tenantId: tenant.id, id: row.id, key: row.key, driver: row.driver, keys: ownedMediaKeys(row), orphanedAt: row.orphanedAt };
        if (!dryRun) {
          await repo.media.delete(row.id);
          await repo.auditLog.create({ actorType: "system", action: "media.orphan_deleted", entity: "Media", entityId: row.id, data: { key: row.key, driver: row.driver } });
          if (row.visibility === "public") await enqueueInvalidate(repo, [siteTag(tenant.id)]);
        }
        candidates.push(candidate);
      }
      return candidates;
    }, { timeout: 30_000 });
    deleted.push(...rows);
  }
  return deleted;
}
