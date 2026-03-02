-- =============================================================================
-- Seed: Johns Hopkins School of Nursing programs (idempotent)
--
-- Canonical ownership:
-- - Owns idempotent JHSON demo seed rows for `programs` and `program_sessions`.
-- Override intent:
-- - None; data seed only. No policy/function symbol ownership in this lane.
-- =============================================================================

BEGIN;

WITH jhu_org AS (
  SELECT id
  FROM public.organizations
  WHERE organization_type = 'institution'
    AND (
      slug = 'johns-hopkins-school-of-nursing'
      OR lower(name) = 'johns hopkins school of nursing'
    )
  ORDER BY created_at DESC
  LIMIT 1
),
ins_programs AS (
  INSERT INTO public.programs (
    organization_id,
    domain,
    title,
    description,
    type,
    status,
    start_at,
    end_at,
    metadata
  )
  SELECT
    j.id,
    'nursing',
    p.title,
    p.description,
    p.type,
    p.status,
    p.start_at,
    p.end_at,
    p.metadata
  FROM jhu_org j
  CROSS JOIN (
    VALUES
      (
        'Adult-Gerontology Clinical Rotation • Cohort A',
        'Clinical placement block for med-surg rotation and bedside assessments.',
        'clinical_rotation',
        'active',
        now() + interval '2 day',
        now() + interval '21 day',
        jsonb_build_object('max_participants', 24, 'program_fee', 0, 'unit', 'cohort')
      ),
      (
        'Pediatric Clinical Rotation • Cohort B',
        'Pediatrics placement cycle with preceptor-based competency sign-off.',
        'clinical_rotation',
        'planned',
        now() + interval '5 day',
        now() + interval '28 day',
        jsonb_build_object('max_participants', 18, 'program_fee', 0, 'unit', 'cohort')
      ),
      (
        'Simulation Lab: Acute Deterioration',
        'Simulation scenario lab for rapid response, escalation, and SBAR handoff.',
        'simulation_lab',
        'planned',
        now() + interval '7 day',
        now() + interval '7 day' + interval '4 hour',
        jsonb_build_object('max_participants', 16, 'program_fee', 0, 'unit', 'session')
      )
  ) AS p(title, description, type, status, start_at, end_at, metadata)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.programs existing
    WHERE existing.organization_id = j.id
      AND existing.title = p.title
  )
  RETURNING id, organization_id, title
)
INSERT INTO public.program_sessions (
  program_id,
  organization_id,
  title,
  description,
  session_type,
  status,
  starts_at,
  ends_at,
  location,
  metadata
)
SELECT
  ip.id,
  ip.organization_id,
  CASE
    WHEN ip.title ILIKE '%Simulation%' THEN 'High-Fidelity Simulation Session'
    ELSE 'Orientation + Competency Planning'
  END,
  CASE
    WHEN ip.title ILIKE '%Simulation%' THEN 'Simulation objectives, evaluator assignment, and debrief workflow.'
    ELSE 'Program kickoff with cohort roster review and role assignments.'
  END,
  CASE
    WHEN ip.title ILIKE '%Simulation%' THEN 'simulation'
    ELSE 'orientation'
  END,
  'planned',
  now() + interval '1 day',
  now() + interval '1 day' + interval '2 hour',
  'JHSON Learning Center',
  jsonb_build_object('seed', '20260302113000')
FROM ins_programs ip
WHERE NOT EXISTS (
  SELECT 1
  FROM public.program_sessions s
  WHERE s.program_id = ip.id
    AND s.title = CASE
      WHEN ip.title ILIKE '%Simulation%' THEN 'High-Fidelity Simulation Session'
      ELSE 'Orientation + Competency Planning'
    END
);

COMMIT;
