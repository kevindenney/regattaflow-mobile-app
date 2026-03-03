-- =============================================================================
-- Invite tokens + domain role preset seed
--
-- Canonical ownership:
-- - Owns invite token generation primitive (`generate_invite_token`), invite
--   token/role key columns, and role preset seed upserts in `domain_catalog`.
-- Override intent:
-- - None; later invite-flow migrations consume these symbols but do not replace
--   them in the 20260302 lane.
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT lower(substring(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '') from 1 for 24));
$$;

ALTER TABLE public.organization_invites
  ADD COLUMN IF NOT EXISTS invite_token text,
  ADD COLUMN IF NOT EXISTS role_key text;

ALTER TABLE public.organization_invites
  ALTER COLUMN invite_token SET DEFAULT public.generate_invite_token();

UPDATE public.organization_invites
SET invite_token = public.generate_invite_token()
WHERE invite_token IS NULL;

ALTER TABLE public.organization_invites
  ALTER COLUMN invite_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_invites_token
  ON public.organization_invites(invite_token);

CREATE INDEX IF NOT EXISTS idx_organization_invites_role_key
  ON public.organization_invites(role_key);

-- Domain role presets used by Organization Access invite buttons.
INSERT INTO public.domain_catalog (domain, catalog_type, key, value, metadata)
VALUES
  ('nursing', 'role', 'clinical_instructor', 'Clinical Instructor', '{"invite_label":"Invite Clinical Instructor","role_type":"faculty"}'::jsonb),
  ('nursing', 'role', 'clinical_preceptor', 'Clinical Preceptor', '{"invite_label":"Invite Clinical Preceptor","role_type":"preceptor"}'::jsonb),
  ('nursing', 'role', 'simulation_faculty', 'Simulation Faculty', '{"invite_label":"Invite Simulation Faculty","role_type":"faculty"}'::jsonb),
  ('nursing', 'role', 'skills_lab_facilitator', 'Skills Lab Facilitator', '{"invite_label":"Invite Skills Lab Facilitator","role_type":"instructor"}'::jsonb),
  ('nursing', 'role', 'program_director', 'Program Director', '{"invite_label":"Invite Program Director","role_type":"manager"}'::jsonb),
  ('nursing', 'role', 'placement_coordinator', 'Clinical Placement Coordinator', '{"invite_label":"Invite Placement Coordinator","role_type":"coordinator"}'::jsonb),
  ('nursing', 'role', 'assessor', 'Evaluator / Assessor', '{"invite_label":"Invite Evaluator / Assessor","role_type":"assessor"}'::jsonb),
  ('nursing', 'role', 'sp_coordinator', 'Standardized Patient Coordinator', '{"invite_label":"Invite SP Coordinator","role_type":"coordinator"}'::jsonb),
  ('nursing', 'role', 'academic_coach', 'Tutor / Academic Coach', '{"invite_label":"Invite Tutor / Academic Coach","role_type":"coach"}'::jsonb),
  ('sailing', 'role', 'race_officer', 'Race Officer', '{"invite_label":"Invite Race Officer","role_type":"manager"}'::jsonb),
  ('sailing', 'role', 'race_committee', 'Race Committee', '{"invite_label":"Invite Race Committee","role_type":"staff"}'::jsonb),
  ('sailing', 'role', 'coach', 'Coach', '{"invite_label":"Invite Coach","role_type":"coach"}'::jsonb),
  ('sailing', 'role', 'safety_officer', 'Safety Officer', '{"invite_label":"Invite Safety Officer","role_type":"staff"}'::jsonb),
  ('generic', 'role', 'team_member', 'Team Member', '{"invite_label":"Invite Team Member","role_type":"member"}'::jsonb),
  ('generic', 'role', 'coordinator', 'Coordinator', '{"invite_label":"Invite Coordinator","role_type":"coordinator"}'::jsonb)
ON CONFLICT (domain, catalog_type, key)
DO UPDATE SET
  value = EXCLUDED.value,
  metadata = EXCLUDED.metadata,
  is_active = true,
  updated_at = now();

COMMIT;
