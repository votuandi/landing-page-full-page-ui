BEGIN;
DO $$ BEGIN
  IF current_user <> 'app_owner' THEN RAISE EXCEPTION 'Auth migration requires app_owner'; END IF;
END $$;
ALTER TABLE public."SiteUser" ADD COLUMN "totpBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public."PlatformAdmin" ADD COLUMN "totpBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Runtime cannot traverse GhostGrant. Return only validity of its own tenant's existing ghost session.
CREATE FUNCTION public.is_ghost_session_active(session_id uuid, tenant_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
  SELECT EXISTS (
    SELECT FROM public."SiteSession" s
    JOIN public."GhostGrant" g ON g.id=s."ghostGrantId" AND g."targetTenantId"=s."tenantId"
    JOIN public."PlatformAdmin" a ON a.id=g."platformAdminId"
    JOIN public."Tenant" t ON t.id=s."tenantId"
    WHERE s.id=$1 AND s."tenantId"=$2 AND $2=nullif(current_setting('app.tenant_id',true),'')::uuid
      AND s.kind='ghost' AND s.audience='admin' AND g."usedAt" IS NOT NULL AND g."revokedAt" IS NULL
      AND g."sessionExpiresAt">(statement_timestamp() AT TIME ZONE 'UTC')
      AND s."expiresAt">(statement_timestamp() AT TIME ZONE 'UTC')
      AND a.status='active' AND t.status IN ('active','trial')
  )
$$;
REVOKE ALL ON FUNCTION public.is_ghost_session_active(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_ghost_session_active(uuid,uuid) TO app_runtime;
GRANT CREATE ON SCHEMA public TO app_platform;
ALTER FUNCTION public.is_ghost_session_active(uuid,uuid) OWNER TO app_platform;
REVOKE CREATE ON SCHEMA public FROM app_platform;
COMMIT;
