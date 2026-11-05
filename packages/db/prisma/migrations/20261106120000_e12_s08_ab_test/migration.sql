BEGIN;
DO $$ BEGIN
  IF current_user <> 'app_owner' THEN RAISE EXCEPTION 'migration requires app_owner'; END IF;
END $$;

ALTER TABLE "Page" ADD COLUMN "abTest" JSONB;
ALTER TABLE "Lead" ADD COLUMN "abTestId" UUID, ADD COLUMN "abVariant" TEXT;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_abVariant_check" CHECK ("abVariant" IN ('A', 'B'));
CREATE INDEX "Lead_tenantId_abTestId_idx" ON "Lead"("tenantId", "abTestId");
CREATE TABLE "AbTestView" (
  "tenantId" UUID NOT NULL,
  "pageId" UUID NOT NULL,
  "testId" UUID NOT NULL,
  "variant" TEXT NOT NULL CHECK ("variant" IN ('A', 'B')),
  "views" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "AbTestView_pkey" PRIMARY KEY ("tenantId", "testId", "variant"),
  CONSTRAINT "AbTestView_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "AbTestView" ADD CONSTRAINT "AbTestView_tenantId_pageId_fkey" FOREIGN KEY ("tenantId", "pageId") REFERENCES "Page"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
CREATE INDEX "AbTestView_tenantId_pageId_idx" ON "AbTestView"("tenantId", "pageId");
ALTER TABLE public."AbTestView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AbTestView" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON public."AbTestView" TO app_runtime
  USING ("tenantId" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY platform_access ON public."AbTestView" TO app_platform USING (true) WITH CHECK (true);
REVOKE ALL ON TABLE public."AbTestView" FROM PUBLIC, app_runtime, app_platform;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."AbTestView" TO app_runtime, app_platform;
COMMIT;
