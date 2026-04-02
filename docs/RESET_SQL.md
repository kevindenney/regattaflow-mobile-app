# Multi-Org Demo Reset SQL (M10)

This packet resets the JHSON-first demo state deterministically for:
- Admin user (active admin in JHSON + RHKYC)
- Requester user (JHSON active member, RHKYC pending member)
- Cohort + template + cohort-template linkage in each org

## Inputs
Required environment variables:
- `DEMO_ADMIN_EMAIL` (example: `kevin@oceanflow.io`)
- `DEMO_REQUESTER_EMAIL` (example: `jhu2@jhu.edu`)
- `DEMO_RESET_DB_URL` (Postgres connection string)

Optional:
- `DEMO_NOTIFICATION_PURGE_DAYS` (default `30`)

## Preferred Command

```bash
DEMO_ADMIN_EMAIL="kevin@oceanflow.io" \
DEMO_REQUESTER_EMAIL="jhu2@jhu.edu" \
DEMO_RESET_DB_URL="postgres://..." \
node scripts/reset-multi-org-demo.mjs
```

The script runs this packet and prints machine-readable `PASS/FAIL` lines.

## Manual Fallback (psql)
If you need to run SQL directly:

```bash
psql "$DEMO_RESET_DB_URL" \
  -v ON_ERROR_STOP=1 \
  -v admin_email="$DEMO_ADMIN_EMAIL" \
  -v requester_email="$DEMO_REQUESTER_EMAIL" \
  -v purge_days="${DEMO_NOTIFICATION_PURGE_DAYS:-30}" \
  -f - <<'SQL'
-- Validate identities + orgs
DO $$
DECLARE
  v_admin_email text := :'admin_email';
  v_requester_email text := :'requester_email';
  v_admin_id uuid;
  v_requester_id uuid;
  v_jhson_id uuid;
  v_rhkyc_id uuid;
BEGIN
  SELECT COALESCE((SELECT id FROM public.users WHERE lower(email)=lower(v_admin_email) LIMIT 1),(SELECT id FROM auth.users WHERE lower(email)=lower(v_admin_email) LIMIT 1)) INTO v_admin_id;
  SELECT COALESCE((SELECT id FROM public.users WHERE lower(email)=lower(v_requester_email) LIMIT 1),(SELECT id FROM auth.users WHERE lower(email)=lower(v_requester_email) LIMIT 1)) INTO v_requester_id;
  SELECT id INTO v_jhson_id FROM public.organizations WHERE name ILIKE '%Johns Hopkins School of Nursing%' AND COALESCE(is_active, true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1;
  SELECT id INTO v_rhkyc_id FROM public.organizations WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%') AND COALESCE(is_active, true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1;
  IF v_admin_id IS NULL THEN RAISE EXCEPTION 'Admin user not found for %', v_admin_email; END IF;
  IF v_requester_id IS NULL THEN RAISE EXCEPTION 'Requester user not found for %', v_requester_email; END IF;
  IF v_jhson_id IS NULL THEN RAISE EXCEPTION 'JHSON not found'; END IF;
  IF v_rhkyc_id IS NULL THEN RAISE EXCEPTION 'RHKYC not found'; END IF;
END$$;

-- Org config reset
DO $$
DECLARE
  v_jhson_id uuid;
  v_rhkyc_id uuid;
BEGIN
  SELECT id INTO v_jhson_id FROM public.organizations WHERE name ILIKE '%Johns Hopkins School of Nursing%' AND COALESCE(is_active, true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1;
  SELECT id INTO v_rhkyc_id FROM public.organizations WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%') AND COALESCE(is_active, true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1;

  UPDATE public.organizations SET join_mode='open_join', allowed_email_domains=ARRAY['jhu.edu']::text[], interest_slug='nursing' WHERE id=v_jhson_id;
  UPDATE public.organizations SET join_mode='request_to_join', interest_slug='sail-racing' WHERE id=v_rhkyc_id;
END$$;

-- Membership reset
DO $$
DECLARE
  v_admin_email text := :'admin_email';
  v_requester_email text := :'requester_email';
  v_admin_id uuid;
  v_requester_id uuid;
  v_jhson_id uuid;
  v_rhkyc_id uuid;
BEGIN
  SELECT COALESCE((SELECT id FROM public.users WHERE lower(email)=lower(v_admin_email) LIMIT 1),(SELECT id FROM auth.users WHERE lower(email)=lower(v_admin_email) LIMIT 1)) INTO v_admin_id;
  SELECT COALESCE((SELECT id FROM public.users WHERE lower(email)=lower(v_requester_email) LIMIT 1),(SELECT id FROM auth.users WHERE lower(email)=lower(v_requester_email) LIMIT 1)) INTO v_requester_id;
  SELECT id INTO v_jhson_id FROM public.organizations WHERE name ILIKE '%Johns Hopkins School of Nursing%' AND COALESCE(is_active, true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1;
  SELECT id INTO v_rhkyc_id FROM public.organizations WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%') AND COALESCE(is_active, true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1;

  UPDATE public.organization_memberships SET role='admin', status='active', membership_status='active', is_verified=true, verification_source='admin', verified_at=now(), joined_at=COALESCE(joined_at, now()) WHERE user_id=v_admin_id AND organization_id IN (v_jhson_id,v_rhkyc_id);
  INSERT INTO public.organization_memberships (organization_id,user_id,role,status,membership_status,is_verified,verification_source,verified_at,joined_at)
  SELECT org_id, v_admin_id, 'admin','active','active',true,'admin',now(),now()
  FROM (VALUES (v_jhson_id),(v_rhkyc_id)) AS seed(org_id)
  WHERE NOT EXISTS (SELECT 1 FROM public.organization_memberships om WHERE om.organization_id=seed.org_id AND om.user_id=v_admin_id);

  UPDATE public.organization_memberships SET role='member', status='active', membership_status='active', is_verified=true, verification_source='domain', verified_at=now(), joined_at=COALESCE(joined_at, now()) WHERE user_id=v_requester_id AND organization_id=v_jhson_id;
  INSERT INTO public.organization_memberships (organization_id,user_id,role,status,membership_status,is_verified,verification_source,verified_at,joined_at)
  SELECT v_jhson_id, v_requester_id, 'member','active','active',true,'domain',now(),now()
  WHERE NOT EXISTS (SELECT 1 FROM public.organization_memberships om WHERE om.organization_id=v_jhson_id AND om.user_id=v_requester_id);

  UPDATE public.organization_memberships SET role='member', status='pending', membership_status='pending', is_verified=false, verification_source='invite', verified_at=NULL, joined_at=NULL WHERE user_id=v_requester_id AND organization_id=v_rhkyc_id;
  INSERT INTO public.organization_memberships (organization_id,user_id,role,status,membership_status,is_verified,verification_source,verified_at,joined_at)
  SELECT v_rhkyc_id, v_requester_id, 'member','pending','pending',false,'invite',NULL,NULL
  WHERE NOT EXISTS (SELECT 1 FROM public.organization_memberships om WHERE om.organization_id=v_rhkyc_id AND om.user_id=v_requester_id);
END$$;

-- Cohort + template + link reset
DO $$
DECLARE
  v_admin_email text := :'admin_email';
  v_requester_email text := :'requester_email';
  v_admin_id uuid;
  v_requester_id uuid;
  v_jhson_id uuid;
  v_rhkyc_id uuid;
  v_jhson_cohort_id uuid;
  v_rhkyc_cohort_id uuid;
BEGIN
  SELECT COALESCE((SELECT id FROM public.users WHERE lower(email)=lower(v_admin_email) LIMIT 1),(SELECT id FROM auth.users WHERE lower(email)=lower(v_admin_email) LIMIT 1)) INTO v_admin_id;
  SELECT COALESCE((SELECT id FROM public.users WHERE lower(email)=lower(v_requester_email) LIMIT 1),(SELECT id FROM auth.users WHERE lower(email)=lower(v_requester_email) LIMIT 1)) INTO v_requester_id;
  SELECT id INTO v_jhson_id FROM public.organizations WHERE name ILIKE '%Johns Hopkins School of Nursing%' AND COALESCE(is_active, true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1;
  SELECT id INTO v_rhkyc_id FROM public.organizations WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%') AND COALESCE(is_active, true)=true ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST LIMIT 1;

  INSERT INTO public.betterat_org_cohorts (org_id,name,description,interest_slug)
  SELECT v_jhson_id, 'JHSON Demo Cohort', 'Deterministic demo cohort for JHSON', 'nursing'
  WHERE NOT EXISTS (SELECT 1 FROM public.betterat_org_cohorts c WHERE c.org_id=v_jhson_id AND c.name='JHSON Demo Cohort');

  INSERT INTO public.betterat_org_cohorts (org_id,name,description,interest_slug)
  SELECT v_rhkyc_id, 'RHKYC Demo Cohort', 'Deterministic demo cohort for RHKYC', 'sail-racing'
  WHERE NOT EXISTS (SELECT 1 FROM public.betterat_org_cohorts c WHERE c.org_id=v_rhkyc_id AND c.name='RHKYC Demo Cohort');

  SELECT id INTO v_jhson_cohort_id FROM public.betterat_org_cohorts WHERE org_id=v_jhson_id AND name='JHSON Demo Cohort' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_rhkyc_cohort_id FROM public.betterat_org_cohorts WHERE org_id=v_rhkyc_id AND name='RHKYC Demo Cohort' ORDER BY created_at DESC LIMIT 1;

  INSERT INTO public.betterat_org_cohort_members (cohort_id,user_id,role)
  SELECT v_jhson_cohort_id, v_requester_id, 'member'
  WHERE NOT EXISTS (SELECT 1 FROM public.betterat_org_cohort_members m WHERE m.cohort_id=v_jhson_cohort_id AND m.user_id=v_requester_id);

  INSERT INTO public.betterat_org_cohort_members (cohort_id,user_id,role)
  SELECT v_rhkyc_cohort_id, v_requester_id, 'member'
  WHERE NOT EXISTS (SELECT 1 FROM public.betterat_org_cohort_members m WHERE m.cohort_id=v_rhkyc_cohort_id AND m.user_id=v_requester_id);

END$$;

-- Optional bounded cleanup for decision notifications.
DO $$
DECLARE
  v_requester_email text := :'requester_email';
  v_requester_id uuid;
  v_purge_days integer := :'purge_days';
BEGIN
  SELECT COALESCE((SELECT id FROM public.users WHERE lower(email)=lower(v_requester_email) LIMIT 1),(SELECT id FROM auth.users WHERE lower(email)=lower(v_requester_email) LIMIT 1)) INTO v_requester_id;

  DELETE FROM public.social_notifications
  WHERE user_id = v_requester_id
    AND type = 'org_membership_decision'
    AND created_at < (now() - make_interval(days => GREATEST(v_purge_days, 1)));
END$$;
SQL
```
