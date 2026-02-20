-- ============================================================================
-- Coaching Push Notifications Infrastructure
-- Adds coaching-specific notification preferences and session reminder tracking
-- ============================================================================

-- Add coaching notification preference columns to existing notification_preferences table
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS booking_requests BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS messages BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS session_reminders BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS payment_updates BOOLEAN DEFAULT true;

-- Add reminder_sent to coaching_sessions to prevent duplicate reminder notifications
ALTER TABLE coaching_sessions
  ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;

-- Index for session reminder queries (find confirmed sessions needing reminders)
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_reminder
  ON coaching_sessions (scheduled_at)
  WHERE status = 'confirmed' AND reminder_sent = false;

-- ============================================================================
-- Helper: Check if a user has a notification preference enabled
-- Returns true if the preference is enabled or if no preferences row exists (default on)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_notification_preference(
  p_user_id UUID,
  p_category TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(%I, true) FROM notification_preferences WHERE user_id = $1',
    p_category
  ) INTO v_enabled USING p_user_id;

  -- If no row exists, default to true (opt-in by default)
  RETURN COALESCE(v_enabled, true);
END;
$$;

COMMENT ON FUNCTION check_notification_preference IS 'Check if a user has a notification category enabled. Returns true by default.';
