ALTER TABLE "Tenant" ADD COLUMN "storageDriver" "StorageDriver";
ALTER TABLE "Media" ADD COLUMN "orphanedAt" TIMESTAMP(3);
CREATE INDEX "Media_status_orphanedAt_idx" ON "Media"("status", "orphanedAt");
