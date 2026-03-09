#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'kevin@oceanflow.io';
const requesterEmail = process.env.DEMO_REQUESTER_EMAIL || 'jhu2@jhu.edu';
const purgeDays = Number(process.env.DEMO_NOTIFICATION_PURGE_DAYS || '30');
const dbUrl =
  process.env.DEMO_RESET_DB_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.SUPABASE_DATABASE_URL ||
  process.env.DATABASE_URL ||
  '';

const resetSqlDoc = path.resolve(repoRoot, 'docs/RESET_SQL.md');

function emit(id, status, detail) {
  console.log(`${id}|${status}|${detail}`);
}

function hasPsql() {
  const result = spawnSync('psql', ['--version'], { encoding: 'utf8' });
  return result.status === 0;
}

function runStep(id, sql) {
  const args = [
    dbUrl,
    '-v',
    'ON_ERROR_STOP=1',
    '-v',
    `admin_email=${adminEmail}`,
    '-v',
    `requester_email=${requesterEmail}`,
    '-v',
    `purge_days=${Number.isFinite(purgeDays) ? String(purgeDays) : '30'}`,
    '-f',
    '-',
  ];

  const result = spawnSync('psql', args, {
    input: sql,
    encoding: 'utf8',
    cwd: repoRoot,
  });

  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim().split('\n').slice(-4).join(' | ');
    emit(id, 'FAIL', err || 'psql execution failed');
    throw new Error(`${id} failed`);
  }

  emit(id, 'PASS', 'ok');
}

const stepIdentityAndOrgCheck = `
DO $$
DECLARE
  v_admin_email text := :'admin_email';
  v_requester_email text := :'requester_email';
  v_admin_id uuid;
  v_requester_id uuid;
  v_jhson_id uuid;
  v_rhkyc_id uuid;
BEGIN
  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_admin_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_admin_email) LIMIT 1)
  ) INTO v_admin_id;

  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_requester_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_requester_email) LIMIT 1)
  ) INTO v_requester_id;

  SELECT id
  INTO v_jhson_id
  FROM public.organizations
  WHERE name ILIKE '%Johns Hopkins School of Nursing%'
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  SELECT id
  INTO v_rhkyc_id
  FROM public.organizations
  WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%')
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found for email %', v_admin_email;
  END IF;

  IF v_requester_id IS NULL THEN
    RAISE EXCEPTION 'Requester user not found for email %', v_requester_email;
  END IF;

  IF v_jhson_id IS NULL THEN
    RAISE EXCEPTION 'JHSON organization not found';
  END IF;

  IF v_rhkyc_id IS NULL THEN
    RAISE EXCEPTION 'RHKYC organization not found';
  END IF;
END
$$;
`;

const stepOrgSettings = `
DO $$
DECLARE
  v_jhson_id uuid;
  v_rhkyc_id uuid;
  has_join_mode boolean;
  has_allowed_domains boolean;
  has_interest_slug boolean;
BEGIN
  SELECT id
  INTO v_jhson_id
  FROM public.organizations
  WHERE name ILIKE '%Johns Hopkins School of Nursing%'
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  SELECT id
  INTO v_rhkyc_id
  FROM public.organizations
  WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%')
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organizations' AND column_name='join_mode'
  ) INTO has_join_mode;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organizations' AND column_name='allowed_email_domains'
  ) INTO has_allowed_domains;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='organizations' AND column_name='interest_slug'
  ) INTO has_interest_slug;

  IF has_join_mode THEN
    UPDATE public.organizations SET join_mode = 'open_join' WHERE id = v_jhson_id;
    UPDATE public.organizations SET join_mode = 'request_to_join' WHERE id = v_rhkyc_id;
  END IF;

  IF has_allowed_domains THEN
    UPDATE public.organizations SET allowed_email_domains = ARRAY['jhu.edu']::text[] WHERE id = v_jhson_id;
  END IF;

  IF has_interest_slug THEN
    UPDATE public.organizations SET interest_slug = 'nursing' WHERE id = v_jhson_id;
    UPDATE public.organizations SET interest_slug = 'sail-racing' WHERE id = v_rhkyc_id;
  END IF;
END
$$;
`;

const stepMemberships = `
DO $$
DECLARE
  v_admin_email text := :'admin_email';
  v_requester_email text := :'requester_email';
  v_admin_id uuid;
  v_requester_id uuid;
  v_jhson_id uuid;
  v_rhkyc_id uuid;
BEGIN
  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_admin_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_admin_email) LIMIT 1)
  ) INTO v_admin_id;

  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_requester_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_requester_email) LIMIT 1)
  ) INTO v_requester_id;

  SELECT id
  INTO v_jhson_id
  FROM public.organizations
  WHERE name ILIKE '%Johns Hopkins School of Nursing%'
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  SELECT id
  INTO v_rhkyc_id
  FROM public.organizations
  WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%')
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  -- Admin must be active admin in both orgs.
  UPDATE public.organization_memberships
  SET
    role = 'admin',
    status = 'active',
    membership_status = 'active',
    is_verified = true,
    verification_source = 'admin',
    verified_at = now(),
    joined_at = COALESCE(joined_at, now())
  WHERE user_id = v_admin_id
    AND organization_id IN (v_jhson_id, v_rhkyc_id);

  INSERT INTO public.organization_memberships (
    organization_id,
    user_id,
    role,
    status,
    membership_status,
    is_verified,
    verification_source,
    verified_at,
    joined_at
  )
  SELECT org_id, v_admin_id, 'admin', 'active', 'active', true, 'admin', now(), now()
  FROM (VALUES (v_jhson_id), (v_rhkyc_id)) AS seed(org_id)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.organization_id = seed.org_id
      AND om.user_id = v_admin_id
  );

  -- Requester: JHSON active member.
  UPDATE public.organization_memberships
  SET
    role = 'member',
    status = 'active',
    membership_status = 'active',
    is_verified = true,
    verification_source = 'domain',
    verified_at = now(),
    joined_at = COALESCE(joined_at, now())
  WHERE user_id = v_requester_id
    AND organization_id = v_jhson_id;

  INSERT INTO public.organization_memberships (
    organization_id,
    user_id,
    role,
    status,
    membership_status,
    is_verified,
    verification_source,
    verified_at,
    joined_at
  )
  SELECT v_jhson_id, v_requester_id, 'member', 'active', 'active', true, 'domain', now(), now()
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.organization_id = v_jhson_id
      AND om.user_id = v_requester_id
  );

  -- Requester: RHKYC pending member.
  UPDATE public.organization_memberships
  SET
    role = 'member',
    status = 'pending',
    membership_status = 'pending',
    is_verified = false,
    verification_source = 'invite',
    verified_at = NULL,
    joined_at = NULL
  WHERE user_id = v_requester_id
    AND organization_id = v_rhkyc_id;

  INSERT INTO public.organization_memberships (
    organization_id,
    user_id,
    role,
    status,
    membership_status,
    is_verified,
    verification_source,
    verified_at,
    joined_at
  )
  SELECT v_rhkyc_id, v_requester_id, 'member', 'pending', 'pending', false, 'invite', NULL, NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.organization_memberships om
    WHERE om.organization_id = v_rhkyc_id
      AND om.user_id = v_requester_id
  );
END
$$;
`;

const stepCohortsAndTemplates = `
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
  v_jhson_template_id uuid;
  v_rhkyc_template_id uuid;
BEGIN
  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_admin_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_admin_email) LIMIT 1)
  ) INTO v_admin_id;

  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_requester_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_requester_email) LIMIT 1)
  ) INTO v_requester_id;

  SELECT id
  INTO v_jhson_id
  FROM public.organizations
  WHERE name ILIKE '%Johns Hopkins School of Nursing%'
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  SELECT id
  INTO v_rhkyc_id
  FROM public.organizations
  WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%')
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  INSERT INTO public.betterat_org_cohorts (org_id, name, description, interest_slug)
  SELECT v_jhson_id, 'JHSON Demo Cohort', 'Deterministic demo cohort for JHSON', 'nursing'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.betterat_org_cohorts c
    WHERE c.org_id = v_jhson_id AND c.name = 'JHSON Demo Cohort'
  );

  INSERT INTO public.betterat_org_cohorts (org_id, name, description, interest_slug)
  SELECT v_rhkyc_id, 'RHKYC Demo Cohort', 'Deterministic demo cohort for RHKYC', 'sail-racing'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.betterat_org_cohorts c
    WHERE c.org_id = v_rhkyc_id AND c.name = 'RHKYC Demo Cohort'
  );

  SELECT id INTO v_jhson_cohort_id
  FROM public.betterat_org_cohorts
  WHERE org_id = v_jhson_id AND name = 'JHSON Demo Cohort'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT id INTO v_rhkyc_cohort_id
  FROM public.betterat_org_cohorts
  WHERE org_id = v_rhkyc_id AND name = 'RHKYC Demo Cohort'
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO public.betterat_org_cohort_members (cohort_id, user_id, role)
  SELECT v_jhson_cohort_id, v_requester_id, 'member'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.betterat_org_cohort_members m
    WHERE m.cohort_id = v_jhson_cohort_id AND m.user_id = v_requester_id
  );

  INSERT INTO public.betterat_org_cohort_members (cohort_id, user_id, role)
  SELECT v_rhkyc_cohort_id, v_requester_id, 'member'
  WHERE NOT EXISTS (
    SELECT 1 FROM public.betterat_org_cohort_members m
    WHERE m.cohort_id = v_rhkyc_cohort_id AND m.user_id = v_requester_id
  );

  INSERT INTO public.betterat_org_step_templates (
    org_id,
    interest_slug,
    title,
    description,
    step_type,
    module_ids,
    suggested_competency_ids,
    is_published,
    created_by
  )
  SELECT
    v_jhson_id,
    'nursing',
    'JHSON Demo Template',
    'Deterministic template for JHSON demo flow',
    'clinical_shift',
    ARRAY[]::text[],
    ARRAY[]::text[],
    true,
    v_admin_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.betterat_org_step_templates t
    WHERE t.org_id = v_jhson_id AND t.title = 'JHSON Demo Template'
  );

  INSERT INTO public.betterat_org_step_templates (
    org_id,
    interest_slug,
    title,
    description,
    step_type,
    module_ids,
    suggested_competency_ids,
    is_published,
    created_by
  )
  SELECT
    v_rhkyc_id,
    'sail-racing',
    'RHKYC Demo Template',
    'Deterministic template for RHKYC demo flow',
    'race_day',
    ARRAY[]::text[],
    ARRAY[]::text[],
    true,
    v_admin_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.betterat_org_step_templates t
    WHERE t.org_id = v_rhkyc_id AND t.title = 'RHKYC Demo Template'
  );

  SELECT id INTO v_jhson_template_id
  FROM public.betterat_org_step_templates
  WHERE org_id = v_jhson_id AND title = 'JHSON Demo Template'
  ORDER BY created_at DESC
  LIMIT 1;

  SELECT id INTO v_rhkyc_template_id
  FROM public.betterat_org_step_templates
  WHERE org_id = v_rhkyc_id AND title = 'RHKYC Demo Template'
  ORDER BY created_at DESC
  LIMIT 1;

  INSERT INTO public.betterat_org_step_template_cohorts (org_template_id, cohort_id)
  SELECT v_jhson_template_id, v_jhson_cohort_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.betterat_org_step_template_cohorts l
    WHERE l.org_template_id = v_jhson_template_id AND l.cohort_id = v_jhson_cohort_id
  );

  INSERT INTO public.betterat_org_step_template_cohorts (org_template_id, cohort_id)
  SELECT v_rhkyc_template_id, v_rhkyc_cohort_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.betterat_org_step_template_cohorts l
    WHERE l.org_template_id = v_rhkyc_template_id AND l.cohort_id = v_rhkyc_cohort_id
  );
END
$$;
`;

const stepNotificationCleanup = `
DO $$
DECLARE
  v_requester_email text := :'requester_email';
  v_requester_id uuid;
  v_purge_days integer := :'purge_days';
BEGIN
  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_requester_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_requester_email) LIMIT 1)
  ) INTO v_requester_id;

  DELETE FROM public.social_notifications
  WHERE user_id = v_requester_id
    AND type = 'org_membership_decision'
    AND created_at < (now() - make_interval(days => GREATEST(v_purge_days, 1)));
END
$$;
`;

const stepVerify = `
DO $$
DECLARE
  v_admin_email text := :'admin_email';
  v_requester_email text := :'requester_email';
  v_admin_id uuid;
  v_requester_id uuid;
  v_jhson_id uuid;
  v_rhkyc_id uuid;
  v_admin_ok integer;
  v_requester_ok integer;
  v_cohort_count integer;
  v_template_link_count integer;
BEGIN
  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_admin_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_admin_email) LIMIT 1)
  ) INTO v_admin_id;

  SELECT COALESCE(
    (SELECT id FROM public.users WHERE lower(email) = lower(v_requester_email) LIMIT 1),
    (SELECT id FROM auth.users WHERE lower(email) = lower(v_requester_email) LIMIT 1)
  ) INTO v_requester_id;

  SELECT id
  INTO v_jhson_id
  FROM public.organizations
  WHERE name ILIKE '%Johns Hopkins School of Nursing%'
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  SELECT id
  INTO v_rhkyc_id
  FROM public.organizations
  WHERE (name ILIKE '%Royal Hong Kong Yacht Club%' OR name ILIKE '%RHKYC%')
    AND COALESCE(is_active, true) = true
  ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
  LIMIT 1;

  SELECT COUNT(*) INTO v_admin_ok
  FROM public.organization_memberships om
  WHERE om.user_id = v_admin_id
    AND om.organization_id IN (v_jhson_id, v_rhkyc_id)
    AND COALESCE(om.membership_status, om.status) = 'active'
    AND om.role = 'admin';

  IF v_admin_ok <> 2 THEN
    RAISE EXCEPTION 'Admin membership verification failed (expected 2 rows, got %)', v_admin_ok;
  END IF;

  SELECT COUNT(*) INTO v_requester_ok
  FROM public.organization_memberships om
  WHERE om.user_id = v_requester_id
    AND (
      (om.organization_id = v_jhson_id AND COALESCE(om.membership_status, om.status) = 'active') OR
      (om.organization_id = v_rhkyc_id AND COALESCE(om.membership_status, om.status) = 'pending')
    );

  IF v_requester_ok <> 2 THEN
    RAISE EXCEPTION 'Requester membership verification failed (expected 2 rows, got %)', v_requester_ok;
  END IF;

  SELECT COUNT(*) INTO v_cohort_count
  FROM public.betterat_org_cohorts c
  WHERE c.org_id IN (v_jhson_id, v_rhkyc_id)
    AND c.name IN ('JHSON Demo Cohort', 'RHKYC Demo Cohort');

  IF v_cohort_count < 2 THEN
    RAISE EXCEPTION 'Cohort verification failed (expected >=2 rows, got %)', v_cohort_count;
  END IF;

  SELECT COUNT(*) INTO v_template_link_count
  FROM public.betterat_org_step_template_cohorts l
  JOIN public.betterat_org_step_templates t ON t.id = l.org_template_id
  JOIN public.betterat_org_cohorts c ON c.id = l.cohort_id
  WHERE (t.title = 'JHSON Demo Template' AND c.name = 'JHSON Demo Cohort')
     OR (t.title = 'RHKYC Demo Template' AND c.name = 'RHKYC Demo Cohort');

  IF v_template_link_count < 2 THEN
    RAISE EXCEPTION 'Template-link verification failed (expected >=2 rows, got %)', v_template_link_count;
  END IF;
END
$$;
`;

function printManualInstructions() {
  emit('reset_mode', 'INFO', 'manual_sql_packet_required');
  emit('reset_prereq_db_url', 'FAIL', 'No database connection string found in DEMO_RESET_DB_URL/SUPABASE_DB_URL/SUPABASE_DATABASE_URL/DATABASE_URL');
  emit('reset_instructions', 'INFO', `Use ${resetSqlDoc} with psql`);
  emit(
    'reset_example',
    'INFO',
    'DEMO_ADMIN_EMAIL=<admin> DEMO_REQUESTER_EMAIL=<requester> DEMO_RESET_DB_URL=<postgres-url> node scripts/reset-multi-org-demo.mjs'
  );
}

function main() {
  emit('reset_start', 'INFO', 'M10 canonical demo reset');
  emit('reset_personas', 'INFO', `admin=${adminEmail}; requester=${requesterEmail}`);

  if (!dbUrl) {
    printManualInstructions();
    return;
  }

  if (!hasPsql()) {
    emit('reset_prereq_psql', 'FAIL', 'psql not available in PATH');
    emit('reset_instructions', 'INFO', `Install psql and run SQL packet in ${resetSqlDoc}`);
    return;
  }

  try {
    emit('reset_mode', 'PASS', 'psql_auto');
    runStep('reset_check_identities', stepIdentityAndOrgCheck);
    runStep('reset_org_settings', stepOrgSettings);
    runStep('reset_memberships', stepMemberships);
    runStep('reset_cohorts_templates', stepCohortsAndTemplates);
    runStep('reset_notifications_cleanup', stepNotificationCleanup);
    runStep('reset_verify', stepVerify);
    emit('reset_complete', 'PASS', 'Demo state reset completed');
  } catch {
    emit('reset_complete', 'FAIL', 'Reset failed; inspect FAIL step output and run packet manually if needed');
    process.exitCode = 1;
  }
}

main();
