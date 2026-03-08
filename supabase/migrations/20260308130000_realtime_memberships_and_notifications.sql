BEGIN;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_memberships;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN duplicate_table THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN duplicate_table THEN NULL;
  END;
END $$;

COMMIT;
