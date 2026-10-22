ALTER TABLE "SectionContent" ADD COLUMN "removedAt" TIMESTAMP(3);
CREATE INDEX "SectionContent_tenantId_removedAt_idx" ON "SectionContent"("tenantId", "removedAt");

UPDATE "SectionContent" c SET "removedAt" = CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Page" p
  WHERE p."tenantId" = c."tenantId" AND p.id = c."pageId"
  AND (p.sections @> jsonb_build_array(jsonb_build_object('id', c."sectionId"))
    OR COALESCE(NULLIF(p."draftSections", 'null'::jsonb), p.sections) @> jsonb_build_array(jsonb_build_object('id', c."sectionId")))
);
