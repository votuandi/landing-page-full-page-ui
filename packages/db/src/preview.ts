import { createHash, randomBytes } from "node:crypto";
import type { Db, PlatformDb } from "./client.ts";
import { withTenantTransaction, tenantTransaction } from "./tenantTransaction.ts";

export async function createPreviewToken(db: Db | PlatformDb, tenantId: string, siteId: string, { ttlMs = 600_000 } = {}) {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0 || ttlMs > 600_000) throw new Error("Preview TTL must be between 1 ms and 10 minutes");
  const token = randomBytes(32).toString("base64url");
  await withTenantTransaction(db, tenantId, repo => repo.previewToken.create({ siteId,
    tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + ttlMs) }));
  return token;
}

export async function consumePreviewToken(db: Db | PlatformDb, tenantId: string, token: string): Promise<{ siteId: string } | null> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const hash = createHash("sha256").update(token).digest("hex");
  return tenantTransaction(db, tenantId, async tx => {
    const rows = await tx.$queryRaw<{ siteId: string }[]>`
      UPDATE public."PreviewToken" SET "usedAt" = clock_timestamp() AT TIME ZONE 'UTC'
      WHERE "tenantId" = ${tenantId}::uuid AND "tokenHash" = ${hash} AND "usedAt" IS NULL
        AND "expiresAt" > (clock_timestamp() AT TIME ZONE 'UTC') RETURNING "siteId"`;
    return rows[0] ?? null;
  });
}
