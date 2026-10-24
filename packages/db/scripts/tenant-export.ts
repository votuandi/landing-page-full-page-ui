import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { createPlatformDb } from "../src/client.ts";
import { forPlatform, forTenant } from "../src/repository.ts";
import { exportTenant } from "../src/tenantBackup.ts";

try {
  const { values } = parseArgs({ options: { tenant: { type: "string" }, out: { type: "string" } } });
  if (!values.tenant || !values.out) throw new Error("Dùng: pnpm tenant:export --tenant <slug> --out <file>");
  const db = createPlatformDb({ pool: 2 });
  try {
    const tenant = await forPlatform(db).tenants.bySlug(values.tenant);
    if (!tenant) throw new Error("Không tìm thấy website");
    const bundle = await exportTenant(db, tenant.tenantId);
    // Backups contain site content; avoid world-readable files or overwriting an existing backup.
    await writeFile(resolve(process.env.INIT_CWD ?? process.cwd(), values.out), JSON.stringify(bundle, null, 2), { mode: 0o600, flag: "wx" });
    await forTenant(db, tenant.tenantId).auditLog.create({ action: "tenant.backup.export", entity: "Tenant", entityId: tenant.tenantId, actorType: "system" });
    console.log(JSON.stringify({ tenantId: tenant.tenantId, slug: values.tenant }));
  } finally { await db.$disconnect(); }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Không thể sao lưu website"); process.exitCode = 1;
}
