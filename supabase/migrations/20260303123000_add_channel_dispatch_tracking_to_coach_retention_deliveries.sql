-- =============================================================================
-- coach_retention_deliveries channel-level dispatch tracking
--
-- Canonical ownership:
-- - Adds per-channel dispatch status to prevent duplicate in-app notifications
--   while allowing push/email retries on transient failures.
-- Override intent:
-- - none
-- =============================================================================

BEGIN;

ALTER TABLE public.coach_retention_deliveries
  ADD COLUMN IF NOT EXISTS in_app_dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS push_dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS push_dispatch_error text,
  ADD COLUMN IF NOT EXISTS email_dispatch_error text;

CREATE INDEX IF NOT EXISTS idx_coach_retention_deliveries_pending_channels
  ON public.coach_retention_deliveries(dispatched_at, in_app_dispatched_at, push_dispatched_at, email_dispatched_at);

COMMIT;
