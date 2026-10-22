import { checkConnection, platformClient, type PlatformDb } from "./client.ts";

export const SECTION_RETENTION_MS = 30 * 86400000;

/** Page writers and cleanup both lock Page first, then inspect/delete content in the same transaction. */
export async function purgeRemoved(db: PlatformDb, { now = new Date() }: { now?: Date } = {}) {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid cleanup time");
  await checkConnection(db);
  const client = platformClient(db), cutoff = new Date(now.getTime() - SECTION_RETENTION_MS);
  const candidates = await client.sectionContent.findMany({ where: { removedAt: { lt: cutoff } }, select: { pageId: true, tenantId: true }, distinct: ["pageId", "tenantId"] });
  let deleted = 0;
  for (const page of candidates) deleted += await client.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Page" WHERE "tenantId" = ${page.tenantId}::uuid AND id = ${page.pageId}::uuid FOR UPDATE`;
    const rows = await tx.$queryRaw<{ id: string; sectionId: string }[]>`
      DELETE FROM "SectionContent" c USING "Page" p
      WHERE c."tenantId" = ${page.tenantId}::uuid AND c."pageId" = ${page.pageId}::uuid
        AND p."tenantId" = c."tenantId" AND p.id = c."pageId" AND c."removedAt" < ${cutoff}
        AND NOT (p.sections @> jsonb_build_array(jsonb_build_object('id', c."sectionId")))
        AND NOT (COALESCE(NULLIF(p."draftSections", 'null'::jsonb), p.sections) @> jsonb_build_array(jsonb_build_object('id', c."sectionId")))
        AND NOT EXISTS (
          SELECT 1 FROM (SELECT v.snapshot FROM "PageVersion" v WHERE v."tenantId" = c."tenantId" AND v."pageId" = c."pageId" ORDER BY v.revision DESC LIMIT 1) latest
          WHERE latest.snapshot->'sections' @> jsonb_build_array(jsonb_build_object('id', c."sectionId"))
             OR latest.snapshot->'contents' @> jsonb_build_array(jsonb_build_object('sectionId', c."sectionId"))
        )
      RETURNING c.id, c."sectionId"`;
    if (rows.length) await tx.auditLog.create({ data: { tenantId: page.tenantId, actorType: "system", action: "section-content.purge", entity: "Page", entityId: page.pageId,
      data: { sectionIds: rows.map(row => row.sectionId), cutoff: cutoff.toISOString() } } });
    return rows.length;
  });
  return { deleted };
}
