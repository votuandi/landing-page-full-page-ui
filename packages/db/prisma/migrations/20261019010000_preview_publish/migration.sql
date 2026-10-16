BEGIN;
DO $$ BEGIN
  IF current_user <> 'app_owner' THEN RAISE EXCEPTION 'Preview migration requires app_owner'; END IF;
END $$;
CREATE TABLE "PreviewToken" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "siteId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PreviewToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PreviewToken_tokenHash_key" ON "PreviewToken"("tokenHash");
CREATE UNIQUE INDEX "PreviewToken_tenantId_id_key" ON "PreviewToken"("tenantId", "id");
CREATE INDEX "PreviewToken_tenantId_idx" ON "PreviewToken"("tenantId");
CREATE INDEX "PreviewToken_tenantId_siteId_idx" ON "PreviewToken"("tenantId", "siteId");
ALTER TABLE "PreviewToken" ADD CONSTRAINT "PreviewToken_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreviewToken" ADD CONSTRAINT "PreviewToken_tenantId_siteId_fkey" FOREIGN KEY ("tenantId", "siteId") REFERENCES "Site"("tenantId", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
ALTER TABLE public."PreviewToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PreviewToken" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON public."PreviewToken" TO app_runtime
  USING ("tenantId" = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenantId" = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY platform_access ON public."PreviewToken" TO app_platform USING (true) WITH CHECK (true);
REVOKE ALL ON TABLE public."PreviewToken" FROM PUBLIC, app_runtime, app_platform;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."PreviewToken" TO app_runtime, app_platform;

-- Routing data only; app_runtime cannot read Site before the host selects a tenant.
CREATE FUNCTION public.resolve_tenant_slug(slug text)
RETURNS TABLE ("tenantId" uuid, "siteId" uuid, "tenantStatus" public."TenantStatus")
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
  SELECT t.id,s.id,t.status FROM public."Tenant" t JOIN public."Site" s ON s."tenantId"=t.id WHERE t.slug=$1
$$;
REVOKE ALL ON FUNCTION public.resolve_tenant_slug(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_tenant_slug(text) TO app_runtime;
GRANT CREATE ON SCHEMA public TO app_platform;
ALTER FUNCTION public.resolve_tenant_slug(text) OWNER TO app_platform;
REVOKE CREATE ON SCHEMA public FROM app_platform;
COMMIT;
