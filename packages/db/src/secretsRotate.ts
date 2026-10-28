import type { PlatformDb } from "./client.ts";
import { forPlatform, type TenantRepo } from "./repository.ts";
import { withTenantTransaction } from "./tenantTransaction.ts";

type Rotate = (value: string, context: { tenantId: string; integrationId: string }) => string | null;

/** Runs inside the caller's tenant transaction; kept separate for DB-free contract tests. */
export async function rotateTenantIntegrationSecrets(repo: Pick<TenantRepo, "leadIntegration" | "auditLog">,
  tenantId: string, rotate: Rotate) {
  const counts = { rotated: 0, skipped: 0 };
  let cursor: string | undefined;
  for (;;) {
    const rows = await repo.leadIntegration.list({ take: 100, orderBy: { id: "asc" },
      ...(cursor ? { where: { id: { gt: cursor } } } : {}) });
    if (!rows.length) break;
    for (const row of rows) {
      const next = rotate(row.configEncrypted, { tenantId, integrationId: row.id });
      if (next === null) counts.skipped++;
      else if (next !== row.configEncrypted) {
        // Refuse stale writes if an integration was edited while rotating.
        const result = await repo.leadIntegration.update(row.id, { configEncrypted: next }, { configEncrypted: row.configEncrypted });
        if (result.count !== 1) throw new Error("concurrent update");
        counts.rotated++;
      }
    }
    cursor = rows[rows.length - 1].id;
  }
  if (counts.rotated > 0) await repo.auditLog.create({ actorType: "system", action: "secrets.rotate",
    entity: "LeadIntegration", data: counts });
  return counts;
}

/** Trusted worker/CLI only. Each tenant's writes and count-only audit commit together. */
export async function rotateIntegrationSecrets(db: PlatformDb, rotate: Rotate) {
  const total = { rotated: 0, skipped: 0 };
  let after: string | undefined;
  try {
    for (;;) {
      const tenants = await forPlatform(db).tenants.listIds(after);
      if (!tenants.length) break;
      for (const tenant of tenants) {
        const counts = await withTenantTransaction(db, tenant.id, repo => rotateTenantIntegrationSecrets(repo, tenant.id, rotate));
        total.rotated += counts.rotated; total.skipped += counts.skipped;
      }
      after = tenants[tenants.length - 1].id;
    }
    return total;
  } catch { throw new Error("Không thể xoay khóa bí mật tích hợp; kiểm tra cấu hình và thử lại"); }
}
