\set ON_ERROR_STOP on
\getenv owner_password APP_OWNER_PASSWORD
\getenv runtime_password APP_RUNTIME_PASSWORD
\getenv platform_password APP_PLATFORM_PASSWORD
-- Operator only, PostgreSQL 16. Secrets are supplied through the environment, never SQL files.
BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='app_owner') THEN CREATE ROLE app_owner; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='app_runtime') THEN CREATE ROLE app_runtime; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='app_platform') THEN CREATE ROLE app_platform; END IF;
END $$;
ALTER ROLE app_owner LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT NOCREATEDB NOCREATEROLE PASSWORD :'owner_password';
ALTER ROLE app_runtime LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT NOCREATEDB NOCREATEROLE PASSWORD :'runtime_password';
ALTER ROLE app_platform LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT NOCREATEDB NOCREATEROLE PASSWORD :'platform_password';
ALTER ROLE app_owner SET timezone='UTC';
ALTER ROLE app_runtime SET timezone='UTC';
ALTER ROLE app_platform SET timezone='UTC';
REVOKE app_owner, app_platform FROM app_runtime;
GRANT app_platform TO app_owner WITH INHERIT FALSE, SET TRUE;
SELECT format('GRANT CONNECT ON DATABASE %I TO app_owner, app_runtime, app_platform', current_database()) \gexec
SELECT format('GRANT CREATE ON DATABASE %I TO app_owner', current_database()) \gexec
ALTER SCHEMA public OWNER TO app_owner;
REVOKE CREATE ON SCHEMA public FROM PUBLIC, app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime, app_platform;
-- Explicit inventory: transfers an existing install without touching unrelated operator-owned tables.
DO $$ DECLARE name text; BEGIN
  FOREACH name IN ARRAY ARRAY['Plan','Tenant','Customer','PlatformAdmin','PlatformSession','GhostGrant','PlatformSetting','SiteUser','SiteSession','SiteToken','Domain','Site','Page','PageVersion','SectionContent','Product','ProductCategory','Project','Story','Post','Faq','Testimonial','Branch','Certificate','Brand','PressItem','Service','Media','Lead','Outbox','LeadIntegration','AuditLog','_prisma_migrations'] LOOP
    IF to_regclass(format('public.%I',name)) IS NOT NULL THEN EXECUTE format('ALTER TABLE public.%I OWNER TO app_owner',name); END IF;
  END LOOP;
  FOR name IN SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typtype='e' LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO app_owner',name);
  END LOOP;
END $$;
COMMIT;
