import { parseArgs } from "node:util";
import { storageFor } from "@solar/storage";
import { createPlatformDb } from "../src/client.ts";
import { forPlatform } from "../src/repository.ts";
import { loadBackupMediaProtection } from "../src/mediaOrphans.ts";
import { runMediaOrphans } from "../src/mediaOrphanCleanup.ts";

try {
  const { values } = parseArgs({ options: { tenant: { type: "string" }, "dry-run": { type: "boolean", default: false } } });
  const protect = await loadBackupMediaProtection(), db = createPlatformDb({ pool: 2 });
  try {
    const platform = forPlatform(db), site = values.tenant ? await platform.tenants.bySlug(values.tenant) : null;
    if (values.tenant && !site) throw new Error("Không tìm thấy tenant theo slug");
    const result = await runMediaOrphans({ tenantId: site?.tenantId, protect, dryRun: values["dry-run"], storage: storageFor,
      sweep: options => platform.media.sweepOrphans(options) });
    if (result.errors.length) process.exitCode = 1;
  } finally { await db.$disconnect(); }
} catch (error) { console.error(error instanceof Error ? error.message : "Không thể quét media mồ côi"); process.exitCode = 1; }
