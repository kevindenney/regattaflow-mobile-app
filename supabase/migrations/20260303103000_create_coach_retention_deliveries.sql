-- =============================================================================
-- coach_retention_deliveries
--
-- Canonical ownership:
-- - Owns retention-loop delivery logging for coach-facing streak/reminder/weekly
--   recap generation and scheduled dispatch bookkeeping.
-- Override intent:
-- - none
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.coach_retention_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_type text NOT NULL CHECK (delivery_type IN ('reminders', 'weekly_recap')),
  window_start date NOT NULL,
  window_end date NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, delivery_type, window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_coach_retention_deliveries_user_created
  ON public.coach_retention_deliveries(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_coach_retention_deliveries_org_created
  ON public.coach_retention_deliveries(organization_id, created_at DESC);

ALTER TABLE public.coach_retention_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_retention_deliveries_select_self_or_org_staff" ON public.coach_retention_deliveries;
CREATE POLICY "coach_retention_deliveries_select_self_or_org_staff"
  ON public.coach_retention_deliveries FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_org_role(
      organization_id,
      ARRAY['owner', 'admin', 'manager', 'coordinator']::text[]
    )
  );

DROP POLICY IF EXISTS "coach_retention_deliveries_insert_service_role" ON public.coach_retention_deliveries;
CREATE POLICY "coach_retention_deliveries_insert_service_role"
  ON public.coach_retention_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
