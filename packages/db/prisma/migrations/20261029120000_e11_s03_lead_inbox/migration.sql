ALTER TYPE "LeadStatus" ADD VALUE 'quoted';
ALTER TABLE "Lead" ADD COLUMN "note" TEXT,
  ADD COLUMN "assigneeId" UUID,
  ADD COLUMN "branchId" UUID;

-- Only clear the optional reference; tenantId is required for RLS and isolation.
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_assigneeId_fkey" FOREIGN KEY ("tenantId", "assigneeId") REFERENCES "SiteUser" ("tenantId", "id")
  ON DELETE SET NULL ("assigneeId") ON UPDATE RESTRICT;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_branchId_fkey" FOREIGN KEY ("tenantId", "branchId") REFERENCES "Branch" ("tenantId", "id")
  ON DELETE SET NULL ("branchId") ON UPDATE RESTRICT;
CREATE INDEX "Lead_tenantId_status_createdAt_idx" ON "Lead" ("tenantId", "status", "createdAt");
