-- =============================================================================
-- coach_retention_deliveries dispatch tracking
--
-- Canonical ownership:
-- - Adds dispatch bookkeeping so retention deliveries can be generated once and
--   sent once through notification channels.
-- Override intent:
-- - none
-- =============================================================================

BEGIN;

ALTER TABLE public.coach_retention_deliveries
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatch_error text;

DROP POLICY IF EXISTS "coach_retention_deliveries_update_service_role" ON public.coach_retention_deliveries;
CREATE POLICY "coach_retention_deliveries_update_service_role"
  ON public.coach_retention_deliveries FOR UPDATE
  TO authenticated
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
