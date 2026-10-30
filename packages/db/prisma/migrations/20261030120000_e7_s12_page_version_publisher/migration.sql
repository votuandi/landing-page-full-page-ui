-- Keep publication history and its tenant when a staff account is removed.
ALTER TABLE "PageVersion" DROP CONSTRAINT "PageVersion_tenantId_publishedBySiteUserId_fkey";
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_tenantId_publishedBySiteUserId_fkey"
  FOREIGN KEY ("tenantId", "publishedBySiteUserId") REFERENCES "SiteUser" ("tenantId", "id")
  ON DELETE SET NULL ("publishedBySiteUserId") ON UPDATE RESTRICT;
