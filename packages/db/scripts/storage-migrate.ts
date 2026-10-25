import { parseArgs } from "node:util";
import { storageFor } from "@solar/storage";
import { createPlatformDb } from "../src/client.ts";
import { forPlatform } from "../src/repository.ts";
import { migrationInput } from "../src/storageMigrate.ts";

try {
  const { values } = parseArgs({ options: { tenant: { type: "string" }, from: { type: "string" }, to: { type: "string" }, "dry-run": { type: "boolean", default: false } } });
  const { tenant, from, to, dryRun } = migrationInput({ tenant: values.tenant, from: values.from, to: values.to, dryRun: values["dry-run"] });
  storageFor(from); storageFor(to);
  const db = createPlatformDb({ pool: 2 });
  try {
    const site = await forPlatform(db).tenants.bySlug(tenant);
    if (!site) throw new Error("Không tìm thấy tenant theo slug");
    console.log(JSON.stringify(await forPlatform(db).media.migrate({ tenantId: site.tenantId, from, to, dryRun, storage: storageFor })));
  } finally { await db.$disconnect(); }
} catch (error) { console.error(error instanceof Error ? error.message : "Không thể chuyển driver"); process.exitCode = 1; }
