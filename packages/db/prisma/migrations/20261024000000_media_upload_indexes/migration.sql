BEGIN;
CREATE INDEX "Media_tenantId_status_idx" ON "Media"("tenantId", "status");
CREATE INDEX "Media_status_createdAt_idx" ON "Media"("status", "createdAt");

-- Runtime has SELECT-only access to Tenant. This bridge locks only the initialized tenant,
-- without granting UPDATE privileges on billing/entitlement columns.
CREATE FUNCTION public.lock_media_tenant(tenant_id uuid)
RETURNS uuid
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
  SELECT id FROM public."Tenant"
  WHERE id = $1 AND id = nullif(current_setting('app.tenant_id', true), '')::uuid
  FOR UPDATE
$$;
REVOKE ALL ON FUNCTION public.lock_media_tenant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lock_media_tenant(uuid) TO app_runtime;
GRANT CREATE ON SCHEMA public TO app_platform;
ALTER FUNCTION public.lock_media_tenant(uuid) OWNER TO app_platform;
REVOKE CREATE ON SCHEMA public FROM app_platform;
COMMIT;
