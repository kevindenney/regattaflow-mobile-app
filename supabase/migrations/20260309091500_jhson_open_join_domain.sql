DO $$
DECLARE
  has_join_mode BOOLEAN;
  has_allowed_domains BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'join_mode'
  ) INTO has_join_mode;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'allowed_email_domains'
  ) INTO has_allowed_domains;

  IF has_join_mode THEN
    UPDATE public.organizations
    SET join_mode = 'open_join'
    WHERE name ILIKE '%Johns Hopkins School of Nursing%';
  END IF;

  IF has_allowed_domains THEN
    UPDATE public.organizations
    SET allowed_email_domains = ARRAY['jhu.edu']
    WHERE name ILIKE '%Johns Hopkins School of Nursing%';

    EXECUTE 'CREATE INDEX IF NOT EXISTS organizations_allowed_email_domains_gin ON public.organizations USING gin (allowed_email_domains)';
  END IF;
END $$;
