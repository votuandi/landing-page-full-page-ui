BEGIN;
-- Kill switch bridge (D19): app_runtime reads only the disabled-feature names, never other platform settings.
CREATE FUNCTION public.platform_disabled_features()
RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, pg_temp
AS $$
  SELECT coalesce((SELECT array_agg(f) FROM public."PlatformSetting" s, jsonb_array_elements_text(s.value) f
    WHERE s.key='features.disabled' AND jsonb_typeof(s.value)='array'), ARRAY[]::text[])
$$;
REVOKE ALL ON FUNCTION public.platform_disabled_features() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.platform_disabled_features() TO app_runtime;
-- PostgreSQL requires CREATE on the schema for an ownership transfer; revoke it in this transaction.
GRANT CREATE ON SCHEMA public TO app_platform;
ALTER FUNCTION public.platform_disabled_features() OWNER TO app_platform;
REVOKE CREATE ON SCHEMA public FROM app_platform;
COMMIT;
