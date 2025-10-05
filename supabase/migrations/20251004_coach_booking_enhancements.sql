-- Coach Booking System Enhancements
-- Adds support for boat class filtering, timezone preferences, and session reminders

-- Add missing columns to coach_profiles
ALTER TABLE coach_profiles
ADD COLUMN IF NOT EXISTS boat_classes_coached TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

COMMENT ON COLUMN coach_profiles.boat_classes_coached IS 'List of boat classes this coach specializes in (e.g., dragon, j70, etchells)';
COMMENT ON COLUMN coach_profiles.timezone IS 'Coach primary timezone for session scheduling';

-- Add reminder tracking column to coaching_sessions
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by TEXT CHECK (cancelled_by IN ('coach', 'sailor')),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2);

COMMENT ON COLUMN coaching_sessions.reminder_sent IS '24-hour reminder email sent flag';
COMMENT ON COLUMN coaching_sessions.stripe_payment_intent_id IS 'Stripe payment intent ID for session payment';
COMMENT ON COLUMN coaching_sessions.cancellation_reason IS 'Reason provided for cancellation';
COMMENT ON COLUMN coaching_sessions.cancelled_by IS 'Who cancelled the session (coach or sailor)';
COMMENT ON COLUMN coaching_sessions.refund_amount IS 'Amount refunded based on cancellation policy';

-- Update coach_match_scores table to store AI matching details
ALTER TABLE coach_match_scores
ADD COLUMN IF NOT EXISTS score_breakdown JSONB,
ADD COLUMN IF NOT EXISTS recommendations TEXT[];

COMMENT ON COLUMN coach_match_scores.score_breakdown IS 'Detailed compatibility score breakdown from AI matching';
COMMENT ON COLUMN coach_match_scores.recommendations IS 'Personalized session recommendations from AI';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_profiles_boat_classes
ON coach_profiles USING GIN(boat_classes_coached);

CREATE INDEX IF NOT EXISTS idx_coach_profiles_timezone
ON coach_profiles(timezone);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_scheduled_at
ON coaching_sessions(scheduled_at)
WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_reminder_sent
ON coaching_sessions(reminder_sent, scheduled_at)
WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_payment_intent
ON coaching_sessions(stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;

-- Update RLS policies to allow coaches to view their own payment data
CREATE POLICY IF NOT EXISTS "Coaches can view their payment intents"
ON coaching_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = coach_id AND stripe_payment_intent_id IS NOT NULL
);

-- Function to automatically update coach stats after session completion
CREATE OR REPLACE FUNCTION update_coach_stats_on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update coach profile stats when session is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE coach_profiles
    SET
      total_sessions = total_sessions + 1,
      updated_at = NOW()
    WHERE id = NEW.coach_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for session completion
DROP TRIGGER IF EXISTS on_session_complete_update_coach_stats ON coaching_sessions;
CREATE TRIGGER on_session_complete_update_coach_stats
AFTER UPDATE ON coaching_sessions
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION update_coach_stats_on_session_complete();

-- Function to calculate refund amount based on cancellation policy
CREATE OR REPLACE FUNCTION calculate_session_refund(
  p_session_id UUID,
  p_current_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS NUMERIC AS $$
DECLARE
  v_session RECORD;
  v_hours_until_session NUMERIC;
  v_refund_amount NUMERIC;
BEGIN
  -- Get session details
  SELECT fee_amount, scheduled_at
  INTO v_session
  FROM coaching_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  -- Calculate hours until session
  v_hours_until_session := EXTRACT(EPOCH FROM (v_session.scheduled_at - p_current_time)) / 3600;

  -- Apply cancellation policy
  IF v_hours_until_session >= 24 THEN
    v_refund_amount := v_session.fee_amount; -- Full refund
  ELSIF v_hours_until_session >= 12 THEN
    v_refund_amount := v_session.fee_amount * 0.5; -- 50% refund
  ELSE
    v_refund_amount := 0; -- No refund
  END IF;

  RETURN v_refund_amount;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_session_refund IS 'Calculate refund amount based on cancellation policy: 100% if >24h, 50% if 12-24h, 0% if <12h';

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_session_refund TO authenticated;
GRANT EXECUTE ON FUNCTION update_coach_stats_on_session_complete TO authenticated;
