BEGIN;
DO $$ BEGIN
  IF current_user <> 'app_owner' THEN RAISE EXCEPTION 'Billing migration requires app_owner'; END IF;
END $$;
ALTER TABLE public."Tenant" ADD COLUMN "planExpiresAt" TIMESTAMP(3);
CREATE INDEX "Tenant_status_planExpiresAt_idx" ON public."Tenant"("status", "planExpiresAt");
COMMIT;
