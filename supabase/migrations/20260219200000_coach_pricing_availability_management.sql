-- ============================================================================
-- Coach Pricing & Availability Management
-- ============================================================================
-- Adds fields for coaches to manage their pricing and availability post-onboarding:
-- - Pricing history audit trail
-- - Custom charges (add-on fees)
-- - Per-session-type rates
-- - Profile visibility toggle
-- - Blocked dates for vacations
-- - Rate snapshots on sessions
--
-- Created: 2026-02-19
-- ============================================================================

-- ============================================================================
-- PART 1: Add pricing management fields to coach_profiles
-- ============================================================================

DO $$
BEGIN
  -- Pricing history: JSONB array of all pricing changes with timestamps
  -- Format: [{ changed_at, hourly_rate, currency, session_type_rates, custom_charges, changed_by }]
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_profiles' AND column_name='pricing_history') THEN
    ALTER TABLE coach_profiles ADD COLUMN pricing_history JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added pricing_history column to coach_profiles';
  END IF;

  -- Custom charges: JSONB array of add-on line items
  -- Format: [{ id, label, amount_cents, description, is_active, session_types }]
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_profiles' AND column_name='custom_charges') THEN
    ALTER TABLE coach_profiles ADD COLUMN custom_charges JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added custom_charges column to coach_profiles';
  END IF;

  -- Per-session-type rates: JSONB object mapping session types to rates
  -- Format: { on_water: 15000, video_review: 10000, strategy: 12000, ... }
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_profiles' AND column_name='session_type_rates') THEN
    ALTER TABLE coach_profiles ADD COLUMN session_type_rates JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added session_type_rates column to coach_profiles';
  END IF;

  -- Session durations offered: array of minutes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_profiles' AND column_name='session_durations') THEN
    ALTER TABLE coach_profiles ADD COLUMN session_durations INTEGER[] DEFAULT ARRAY[60];
    RAISE NOTICE 'Added session_durations column to coach_profiles';
  END IF;

  -- Package pricing: JSONB for multi-session bundles
  -- Format: { single: 10000, five_pack: 45000, ten_pack: 80000 }
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_profiles' AND column_name='package_pricing') THEN
    ALTER TABLE coach_profiles ADD COLUMN package_pricing JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added package_pricing column to coach_profiles';
  END IF;

  -- Profile visibility: whether coach is accepting new clients
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_profiles' AND column_name='is_accepting_clients') THEN
    ALTER TABLE coach_profiles ADD COLUMN is_accepting_clients BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_accepting_clients column to coach_profiles';
  END IF;

  -- Minimum booking notice in hours (e.g., 24 = must book 24 hours in advance)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_profiles' AND column_name='min_booking_notice_hours') THEN
    ALTER TABLE coach_profiles ADD COLUMN min_booking_notice_hours INTEGER DEFAULT 24;
    RAISE NOTICE 'Added min_booking_notice_hours column to coach_profiles';
  END IF;

  -- Cancellation policy in hours (e.g., 24 = can cancel up to 24 hours before)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_profiles' AND column_name='cancellation_hours') THEN
    ALTER TABLE coach_profiles ADD COLUMN cancellation_hours INTEGER DEFAULT 24;
    RAISE NOTICE 'Added cancellation_hours column to coach_profiles';
  END IF;

  RAISE NOTICE '✅ coach_profiles pricing columns added successfully';
END $$;

-- ============================================================================
-- PART 2: Create blocked_dates table for vacation/unavailability
-- ============================================================================

CREATE TABLE IF NOT EXISTS coach_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  block_type TEXT DEFAULT 'vacation', -- vacation, regatta, personal, other
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_coach_blocked_dates_coach_id ON coach_blocked_dates(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_blocked_dates_dates ON coach_blocked_dates(start_date, end_date);

-- ============================================================================
-- PART 3: Add rate snapshot fields to coaching_sessions
-- ============================================================================

DO $$
BEGIN
  -- Rate snapshot: captures the exact pricing at time of booking
  -- Format: { hourly_rate, currency, session_type_rate, custom_charges_applied, base_amount, total_amount }
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='rate_snapshot') THEN
    ALTER TABLE coaching_sessions ADD COLUMN rate_snapshot JSONB;
    RAISE NOTICE 'Added rate_snapshot column to coaching_sessions';
  END IF;

  -- Store custom charges applied to this session
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='custom_charges_applied') THEN
    ALTER TABLE coaching_sessions ADD COLUMN custom_charges_applied JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added custom_charges_applied column to coaching_sessions';
  END IF;

  -- Base fee before custom charges (in cents)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coaching_sessions' AND column_name='base_fee_amount') THEN
    ALTER TABLE coaching_sessions ADD COLUMN base_fee_amount INTEGER;
    RAISE NOTICE 'Added base_fee_amount column to coaching_sessions';
  END IF;

  RAISE NOTICE '✅ coaching_sessions rate snapshot columns added successfully';
END $$;

-- ============================================================================
-- PART 4: Add day_of_week column to coach_availability if missing
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_availability' AND column_name='day_of_week') THEN
    ALTER TABLE coach_availability ADD COLUMN day_of_week INTEGER;
    RAISE NOTICE 'Added day_of_week column to coach_availability';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coach_availability' AND column_name='is_active') THEN
    ALTER TABLE coach_availability ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE 'Added is_active column to coach_availability';
  END IF;
END $$;

-- ============================================================================
-- PART 5: RLS Policies
-- ============================================================================

-- Enable RLS on coach_blocked_dates
ALTER TABLE coach_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own blocked dates
DROP POLICY IF EXISTS coach_blocked_dates_own ON coach_blocked_dates;
CREATE POLICY coach_blocked_dates_own ON coach_blocked_dates
  FOR ALL
  USING (
    coach_id IN (
      SELECT id FROM coach_profiles WHERE user_id = auth.uid()
    )
  );

-- Anyone can read blocked dates (needed for booking availability checks)
DROP POLICY IF EXISTS coach_blocked_dates_read ON coach_blocked_dates;
CREATE POLICY coach_blocked_dates_read ON coach_blocked_dates
  FOR SELECT
  USING (true);

-- ============================================================================
-- PART 6: Helper function to record pricing history
-- ============================================================================

CREATE OR REPLACE FUNCTION record_coach_pricing_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if pricing-related fields changed
  IF (
    OLD.hourly_rate IS DISTINCT FROM NEW.hourly_rate OR
    OLD.currency IS DISTINCT FROM NEW.currency OR
    OLD.session_type_rates IS DISTINCT FROM NEW.session_type_rates OR
    OLD.custom_charges IS DISTINCT FROM NEW.custom_charges OR
    OLD.session_durations IS DISTINCT FROM NEW.session_durations OR
    OLD.package_pricing IS DISTINCT FROM NEW.package_pricing
  ) THEN
    NEW.pricing_history = COALESCE(NEW.pricing_history, '[]'::jsonb) || jsonb_build_object(
      'changed_at', NOW(),
      'hourly_rate', NEW.hourly_rate,
      'currency', NEW.currency,
      'session_type_rates', NEW.session_type_rates,
      'custom_charges', NEW.custom_charges,
      'session_durations', NEW.session_durations,
      'package_pricing', NEW.package_pricing,
      'previous_hourly_rate', OLD.hourly_rate,
      'previous_currency', OLD.currency
    );
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for pricing history
DROP TRIGGER IF EXISTS coach_pricing_history_trigger ON coach_profiles;
CREATE TRIGGER coach_pricing_history_trigger
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION record_coach_pricing_change();

-- ============================================================================
-- PART 7: Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON coach_blocked_dates TO authenticated;

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Coach pricing & availability management migration completed!';
  RAISE NOTICE 'Added to coach_profiles: pricing_history, custom_charges, session_type_rates, session_durations, package_pricing, is_accepting_clients';
  RAISE NOTICE 'Created table: coach_blocked_dates';
  RAISE NOTICE 'Added to coaching_sessions: rate_snapshot, custom_charges_applied, base_fee_amount';
  RAISE NOTICE 'Created trigger: coach_pricing_history_trigger';
END $$;
