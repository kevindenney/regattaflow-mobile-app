DO $$
DECLARE
  has_interest_slug boolean;
  updated_nursing integer := 0;
  updated_sailing integer := 0;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'interest_slug'
  ) INTO has_interest_slug;

  IF NOT has_interest_slug THEN
    RAISE NOTICE 'organizations.interest_slug missing; skipping default seed.';
    RETURN;
  END IF;

  UPDATE public.organizations
  SET interest_slug = 'nursing'
  WHERE name ILIKE '%Johns Hopkins School of Nursing%'
    AND COALESCE(interest_slug, '') <> 'nursing';
  GET DIAGNOSTICS updated_nursing = ROW_COUNT;

  UPDATE public.organizations
  SET interest_slug = 'sail-racing'
  WHERE (
      name ILIKE '%Royal Hong Kong Yacht Club%'
      OR name ILIKE '%RHKYC%'
    )
    AND COALESCE(interest_slug, '') <> 'sail-racing';
  GET DIAGNOSTICS updated_sailing = ROW_COUNT;

  RAISE NOTICE 'interest_slug seeded: nursing rows=% sailing rows=%', updated_nursing, updated_sailing;
END $$;
