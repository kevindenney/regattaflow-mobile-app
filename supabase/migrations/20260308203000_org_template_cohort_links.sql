BEGIN;

CREATE TABLE IF NOT EXISTS public.betterat_org_step_template_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_template_id uuid NOT NULL REFERENCES public.betterat_org_step_templates(id) ON DELETE CASCADE,
  cohort_id uuid NOT NULL REFERENCES public.betterat_org_cohorts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT betterat_org_step_template_cohorts_unique UNIQUE (org_template_id, cohort_id)
);

CREATE INDEX IF NOT EXISTS idx_org_template_cohorts_template_id
  ON public.betterat_org_step_template_cohorts (org_template_id);

CREATE INDEX IF NOT EXISTS idx_org_template_cohorts_cohort_id
  ON public.betterat_org_step_template_cohorts (cohort_id);

ALTER TABLE public.betterat_org_step_template_cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_template_cohorts_select_active_members_v1" ON public.betterat_org_step_template_cohorts;
CREATE POLICY "org_template_cohorts_select_active_members_v1"
  ON public.betterat_org_step_template_cohorts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.betterat_org_cohorts c
      WHERE c.id = cohort_id
        AND public.is_org_active_member(c.org_id)
    )
  );

DROP POLICY IF EXISTS "org_template_cohorts_insert_admin_v1" ON public.betterat_org_step_template_cohorts;
CREATE POLICY "org_template_cohorts_insert_admin_v1"
  ON public.betterat_org_step_template_cohorts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.betterat_org_cohorts c
      WHERE c.id = cohort_id
        AND public.is_org_admin_member(c.org_id)
    )
  );

DROP POLICY IF EXISTS "org_template_cohorts_delete_admin_v1" ON public.betterat_org_step_template_cohorts;
CREATE POLICY "org_template_cohorts_delete_admin_v1"
  ON public.betterat_org_step_template_cohorts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.betterat_org_cohorts c
      WHERE c.id = cohort_id
        AND public.is_org_admin_member(c.org_id)
    )
  );

COMMIT;
