-- Migration: Stripe webhook idempotency, payment tables, and refund tracking
--
-- This migration adds infrastructure for:
-- 1. Webhook event idempotency (stripe_webhook_events)
-- 2. Coach payout tracking (coach_payouts)
-- 3. Platform transfer logging (platform_transfers)
-- 4. Refund tracking on coaching_sessions (payment_status, refunded_amount)
-- 5. Currency and stripe_account_id on coach_profiles

-- ============================================================================
-- 1. stripe_webhook_events — deduplicate Stripe webhook deliveries
-- ============================================================================
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by event_id (unique constraint already creates one,
-- but explicit index makes intent clear for maintenance)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id
  ON stripe_webhook_events (event_id);

-- Expire old events after 90 days to keep the table lean
-- (run via pg_cron or manual cleanup)
COMMENT ON TABLE stripe_webhook_events IS 'Tracks processed Stripe webhook event IDs for idempotency. Safe to prune rows older than 90 days.';

-- RLS: only service_role should access this table (edge functions use service key)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. coach_payouts — record payout history per coach
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  stripe_payout_id TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,               -- cents
  currency TEXT NOT NULL DEFAULT 'usd',
  arrival_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  failure_message TEXT,                   -- populated on payout.failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_payouts_coach_id ON coach_payouts (coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_payouts_status ON coach_payouts (status);

ALTER TABLE coach_payouts ENABLE ROW LEVEL SECURITY;

-- Coaches can read their own payouts
CREATE POLICY "Coaches can view own payouts"
  ON coach_payouts FOR SELECT
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. platform_transfers — log transfers from platform to connected accounts
-- ============================================================================
CREATE TABLE IF NOT EXISTS platform_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_transfer_id TEXT NOT NULL UNIQUE,
  destination_account TEXT NOT NULL,
  amount INTEGER NOT NULL,               -- cents
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_transfers_destination
  ON platform_transfers (destination_account);

ALTER TABLE platform_transfers ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. coaching_sessions — add refund tracking columns
-- ============================================================================
ALTER TABLE coaching_sessions
  ADD COLUMN IF NOT EXISTS payment_status TEXT;

ALTER TABLE coaching_sessions
  ADD COLUMN IF NOT EXISTS refunded_amount INTEGER;  -- cents

-- total_amount alias used in charge.refunded handler (maps to fee_amount)
ALTER TABLE coaching_sessions
  ADD COLUMN IF NOT EXISTS total_amount INTEGER;  -- cents

-- ============================================================================
-- 5. coach_profiles — add stripe_account_id and currency if missing
-- ============================================================================
ALTER TABLE coach_profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

ALTER TABLE coach_profiles
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd';

-- Index for looking up coach by their Stripe Connect account
CREATE INDEX IF NOT EXISTS idx_coach_profiles_stripe_account_id
  ON coach_profiles (stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

-- ============================================================================
-- Verify
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Stripe webhook idempotency and payment tables migration completed successfully';
END $$;
