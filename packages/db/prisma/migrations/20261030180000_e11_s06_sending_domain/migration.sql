BEGIN;
DO $$ BEGIN
  IF current_user <> 'app_owner' THEN RAISE EXCEPTION 'migration requires app_owner'; END IF;
END $$;

CREATE TYPE "SendingDomainStatus" AS ENUM ('pending', 'verified', 'failed');
CREATE TABLE "SendingDomain" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "hostname" TEXT NOT NULL,
  "status" "SendingDomainStatus" NOT NULL DEFAULT 'pending',
  "providerId" TEXT,
  "records" JSONB NOT NULL DEFAULT '[]',
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SendingDomain_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SendingDomain_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SendingDomain_tenantId_key" ON "SendingDomain"("tenantId");
CREATE UNIQUE INDEX "SendingDomain_hostname_key" ON "SendingDomain"("hostname");
CREATE UNIQUE INDEX "SendingDomain_tenantId_id_key" ON "SendingDomain"("tenantId", "id");
CREATE INDEX "SendingDomain_tenantId_idx" ON "SendingDomain"("tenantId");

ALTER TABLE public."SendingDomain" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SendingDomain" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON public."SendingDomain" TO app_runtime
  USING ("tenantId" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY platform_access ON public."SendingDomain" TO app_platform USING (true) WITH CHECK (true);
REVOKE ALL ON TABLE public."SendingDomain" FROM PUBLIC, app_runtime, app_platform;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."SendingDomain" TO app_runtime, app_platform;
COMMIT;
