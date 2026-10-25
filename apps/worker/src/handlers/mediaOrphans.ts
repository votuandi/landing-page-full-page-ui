import type { OrphanMedia, OrphanOptions } from "@solar/db";
import type { StorageDriver, StorageKind } from "@solar/storage";

export async function runMediaOrphans({ sweep, storage, log = console.log, dryRun = false, ...options }: OrphanOptions & {
  sweep(options: OrphanOptions): Promise<OrphanMedia[]>;
  storage(kind: StorageKind): Pick<StorageDriver, "delete">;
  log?(value: string): void;
}) {
  const now = options.now ?? new Date();
  const preview = await sweep({ ...options, now, dryRun: true });
  log(JSON.stringify(preview.map(({ tenantId, id, key, orphanedAt }) => ({ tenantId, id, key, orphanedAt }))));
  if (dryRun) return preview;
  const removed = await sweep({ ...options, now, dryRun: false });
  for (const row of removed) {
    const driver = storage(row.driver);
    for (const key of row.keys) await driver.delete(key);
  }
  return removed;
}
