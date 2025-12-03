-- Migration: Add coach payment setup tracking columns
-- This migration adds columns to track Stripe Connect onboarding status for coaches
-- Allows tracking when coaches skip payment setup and for reminder systems

-- Add payment setup tracking columns to coach_profiles
ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS stripe_onboarding_skipped BOOLEAN DEFAULT FALSE;

ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS stripe_onboarding_skipped_at TIMESTAMPTZ;

ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE;

ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT FALSE;

ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS payment_setup_reminder_sent_at TIMESTAMPTZ;

ALTER TABLE coach_profiles 
ADD COLUMN IF NOT EXISTS payment_setup_reminder_count INTEGER DEFAULT 0;

-- Add an index for querying coaches who need payment setup reminders
CREATE INDEX IF NOT EXISTS idx_coach_profiles_payment_incomplete 
ON coach_profiles (stripe_onboarding_skipped, stripe_onboarding_complete)
WHERE stripe_onboarding_complete = FALSE AND stripe_onboarding_skipped = TRUE;

-- Add an index for reminder timing
CREATE INDEX IF NOT EXISTS idx_coach_profiles_payment_reminder
ON coach_profiles (payment_setup_reminder_sent_at)
WHERE stripe_onboarding_complete = FALSE;

-- Create a view for coaches needing payment setup reminders
CREATE OR REPLACE VIEW coaches_needing_payment_reminder AS
SELECT 
  cp.id,
  cp.user_id,
  cp.full_name,
  cp.stripe_onboarding_skipped,
  cp.stripe_onboarding_skipped_at,
  cp.stripe_onboarding_complete,
  cp.payment_setup_reminder_sent_at,
  cp.payment_setup_reminder_count,
  u.email,
  cp.created_at,
  cp.profile_published
FROM coach_profiles cp
JOIN users u ON cp.user_id = u.id
WHERE 
  cp.stripe_onboarding_complete = FALSE
  AND cp.profile_published = TRUE
  AND (
    -- Never sent a reminder
    cp.payment_setup_reminder_sent_at IS NULL
    -- Or it's been more than 7 days since last reminder (max 3 reminders)
    OR (
      cp.payment_setup_reminder_sent_at < NOW() - INTERVAL '7 days'
      AND cp.payment_setup_reminder_count < 3
    )
  );

-- Function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_payment_reminder_sent(coach_profile_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE coach_profiles
  SET 
    payment_setup_reminder_sent_at = NOW(),
    payment_setup_reminder_count = payment_setup_reminder_count + 1
  WHERE id = coach_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for edge functions)
GRANT EXECUTE ON FUNCTION mark_payment_reminder_sent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_payment_reminder_sent(UUID) TO service_role;

-- Add comment for documentation
COMMENT ON COLUMN coach_profiles.stripe_onboarding_skipped IS 'Whether the coach skipped Stripe Connect setup during onboarding';
COMMENT ON COLUMN coach_profiles.stripe_onboarding_skipped_at IS 'When the coach skipped Stripe Connect setup';
COMMENT ON COLUMN coach_profiles.stripe_onboarding_complete IS 'Whether Stripe Connect onboarding is fully complete';
COMMENT ON COLUMN coach_profiles.stripe_charges_enabled IS 'Whether the Stripe account can accept charges';
COMMENT ON COLUMN coach_profiles.stripe_payouts_enabled IS 'Whether the Stripe account can receive payouts';
COMMENT ON COLUMN coach_profiles.stripe_details_submitted IS 'Whether all required Stripe account details have been submitted';
COMMENT ON COLUMN coach_profiles.payment_setup_reminder_sent_at IS 'When the last payment setup reminder was sent';
COMMENT ON COLUMN coach_profiles.payment_setup_reminder_count IS 'Number of payment setup reminders sent';

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Coach payment tracking columns migration completed successfully';
END $$;

