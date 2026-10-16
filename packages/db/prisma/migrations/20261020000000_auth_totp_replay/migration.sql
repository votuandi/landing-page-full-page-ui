DO $$ BEGIN
  IF current_user <> 'app_owner' THEN RAISE EXCEPTION 'Auth migration requires app_owner'; END IF;
END $$;

ALTER TABLE public."SiteUser" ADD COLUMN "totpLastStep" INTEGER;
ALTER TABLE public."PlatformAdmin" ADD COLUMN "totpLastStep" INTEGER;
