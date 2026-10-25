import { parseArgs } from "node:util";
import { storageFor } from "@solar/storage";
import { createPlatformDb } from "../src/client.ts";
import { forPlatform } from "../src/repository.ts";
import { loadBackupMediaProtection } from "../src/mediaOrphans.ts";

try {
  const { values } = parseArgs({ options: { tenant: { type: "string" }, "dry-run": { type: "boolean", default: false } } });
  const protect = await loadBackupMediaProtection(), db = createPlatformDb({ pool: 2 });
  try {
    const platform = forPlatform(db), site = values.tenant ? await platform.tenants.bySlug(values.tenant) : null;
    if (values.tenant && !site) throw new Error("Không tìm thấy tenant theo slug");
    const options = { tenantId: site?.tenantId, protect, now: new Date() };
    const preview = await platform.media.sweepOrphans({ ...options, dryRun: true });
    console.log(JSON.stringify(preview.map(({ tenantId, id, key, orphanedAt }) => ({ tenantId, id, key, orphanedAt }))));
    if (!values["dry-run"]) for (const row of await platform.media.sweepOrphans(options)) {
      const driver = storageFor(row.driver);
      for (const key of row.keys) await driver.delete(key);
    }
  } finally { await db.$disconnect(); }
} catch (error) { console.error(error instanceof Error ? error.message : "Không thể quét media mồ côi"); process.exitCode = 1; }
