BEGIN;
DO $$ DECLARE name text; BEGIN
  IF current_user <> 'app_owner' THEN RAISE EXCEPTION 'RLS migration requires app_owner'; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='app_runtime' AND NOT rolsuper AND NOT rolbypassrls)
    OR NOT EXISTS (SELECT FROM pg_roles WHERE rolname='app_platform' AND NOT rolsuper AND NOT rolbypassrls)
    OR pg_has_role('app_runtime','app_owner','MEMBER') OR pg_has_role('app_runtime','app_platform','MEMBER') THEN
    RAISE EXCEPTION 'Provision isolated app roles before deploying RLS';
  END IF;
  FOREACH name IN ARRAY ARRAY['Plan','Tenant','Customer','PlatformAdmin','PlatformSession','GhostGrant','PlatformSetting','SiteUser','SiteSession','SiteToken','Domain','Site','Page','PageVersion','SectionContent','Product','ProductCategory','Project','Story','Post','Faq','Testimonial','Branch','Certificate','Brand','PressItem','Service','Media','Lead','Outbox','LeadIntegration','AuditLog','_prisma_migrations'] LOOP
    IF NOT EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname=name AND c.relowner='app_owner'::regrole) THEN
      RAISE EXCEPTION 'Table % must belong to app_owner',name;
    END IF;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, app_runtime, app_platform',name);
    IF name <> '_prisma_migrations' THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO app_platform',name);
    END IF;
  END LOOP;
END $$;
REVOKE UPDATE, DELETE ON public."AuditLog" FROM app_platform;
REVOKE CREATE ON SCHEMA public FROM PUBLIC, app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime, app_platform;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC, app_runtime, app_platform;
ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
GRANT SELECT ON public."Plan", public."Tenant" TO app_runtime;

DO $$ DECLARE name text; column_name text; BEGIN
  FOREACH name IN ARRAY ARRAY['Tenant','SiteUser','SiteSession','SiteToken','Domain','Site','Page','PageVersion','SectionContent','Product','ProductCategory','Project','Story','Post','Faq','Testimonial','Branch','Certificate','Brand','PressItem','Service','Media','Lead','Outbox','LeadIntegration','AuditLog'] LOOP
    column_name := CASE WHEN name='Tenant' THEN 'id' ELSE 'tenantId' END;
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',name);
    EXECUTE format('CREATE POLICY tenant_isolation ON public.%I TO app_runtime USING (%I = nullif(current_setting(''app.tenant_id'', true), '''')::uuid) WITH CHECK (%I = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',name,column_name,column_name);
    EXECUTE format('CREATE POLICY platform_access ON public.%I TO app_platform USING (true) WITH CHECK (true)',name);
    IF name='AuditLog' THEN EXECUTE format('GRANT SELECT, INSERT ON public.%I TO app_runtime',name);
    ELSIF name <> 'Tenant' THEN EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO app_runtime',name);
    END IF;
  END LOOP;
END $$;

-- The only public bootstrap exception (D3): routing data, never credentials or tenant configuration.
CREATE FUNCTION public.resolve_tenant_host(hostname text)
RETURNS TABLE (hostname text, "tenantId" uuid, "siteId" uuid, status public."DomainStatus", "isPrimary" boolean, "tenantStatus" public."TenantStatus", "primaryHost" text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
  SELECT d.hostname,d."tenantId",d."siteId",d.status,d."isPrimary",t.status,
    (SELECT p.hostname FROM public."Domain" p WHERE p."tenantId"=d."tenantId" AND p."siteId"=d."siteId"
     AND p."isPrimary" AND p.status IN ('verified','active') ORDER BY p.hostname LIMIT 1)
  FROM public."Domain" d JOIN public."Tenant" t ON t.id=d."tenantId" WHERE d.hostname=$1
$$;

-- The caller has already resolved the tenant. UPDATE serializes competing redemptions.
CREATE FUNCTION public.redeem_ghost_grant(token text, tenant_id uuid)
RETURNS TABLE ("grantId" uuid, "actorId" uuid, "expiresAt" timestamp(3))
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
  UPDATE public."GhostGrant" g SET "usedAt"=clock_timestamp() AT TIME ZONE 'UTC'
  FROM public."PlatformAdmin" a, public."Tenant" t
  WHERE g."platformAdminId"=a.id AND a.status='active' AND g."targetTenantId"=t.id AND t.status IN ('active','trial')
    AND g."targetTenantId"=$2 AND $2=nullif(current_setting('app.tenant_id',true),'')::uuid
    AND g."tokenHash"=encode(sha256(convert_to($1,'UTF8')),'hex')
    AND g."usedAt" IS NULL AND g."revokedAt" IS NULL
    AND g."expiresAt">(clock_timestamp() AT TIME ZONE 'UTC') AND g."sessionExpiresAt">(clock_timestamp() AT TIME ZONE 'UTC')
  RETURNING g.id,g."platformAdminId",g."sessionExpiresAt"
$$;
REVOKE ALL ON FUNCTION public.resolve_tenant_host(text), public.redeem_ghost_grant(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_tenant_host(text), public.redeem_ghost_grant(text,uuid) TO app_runtime;
-- PostgreSQL requires CREATE on the schema for an ownership transfer; revoke it in this transaction.
GRANT CREATE ON SCHEMA public TO app_platform;
ALTER FUNCTION public.resolve_tenant_host(text) OWNER TO app_platform;
ALTER FUNCTION public.redeem_ghost_grant(text,uuid) OWNER TO app_platform;
REVOKE CREATE ON SCHEMA public FROM app_platform;
COMMIT;
