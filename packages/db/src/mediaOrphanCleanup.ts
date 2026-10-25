import type { StorageDriver, StorageKind } from "@solar/storage";
import type { OrphanMedia, OrphanOptions, OrphanTenantError } from "./mediaOrphans.ts";

/** Shared by the worker and CLI so both resolve the locked row's driver before deletion. */
export async function runMediaOrphans({ sweep, storage, log = console.log, dryRun = false, ...options }: OrphanOptions & {
  sweep(options: OrphanOptions): Promise<OrphanMedia[]>;
  storage(kind: StorageKind): Pick<StorageDriver, "delete">;
  log?(value: string): void;
}) {
  const now = options.now ?? new Date(), drivers = new Map<StorageKind, Pick<StorageDriver, "delete">>();
  const failures = new Map<string, OrphanTenantError>();
  const onTenantError = (error: OrphanTenantError) => { failures.set(error.tenantId, error); options.onTenantError?.(error); };
  const preview = await sweep({ ...options, now, dryRun: true, onTenantError });
  log(JSON.stringify(preview.map(({ tenantId, id, key, orphanedAt }) => ({ tenantId, id, key, orphanedAt }))));
  const canDelete = (row: OrphanMedia) => {
    try {
      if (!drivers.has(row.driver)) drivers.set(row.driver, storage(row.driver));
      return options.canDelete?.(row) ?? true;
    } catch (error) {
      log(JSON.stringify({ event: "media.orphan_skipped", tenantId: row.tenantId, id: row.id, driver: row.driver,
        message: error instanceof Error ? error.message : "Không thể cấu hình driver" }));
      return false;
    }
  };
  const removed = dryRun ? [] : await sweep({ ...options, now, dryRun: false, onTenantError, canDelete });
  for (const row of removed) {
    const driver = drivers.get(row.driver)!; // Every committed row passed canDelete under its transaction lock.
    for (const key of row.keys) await driver.delete(key);
  }
  const errors = [...failures.values()];
  if (errors.length) log(JSON.stringify({ event: "media.orphan_tenant_errors", errors }));
  return { removed, errors };
}
