-- Session Lifecycle Management Migration
-- Adds structured session notes, engagement ratings, and booking request expiration

-- ============================================================================
-- Session Completion Fields
-- ============================================================================

-- Add structured session notes fields to coaching_sessions
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS session_notes_structured JSONB DEFAULT '{}'::jsonb;

-- The structured notes will contain:
-- {
--   "what_was_covered": "string",
--   "what_went_well": "string",
--   "areas_to_work_on": "string",
--   "homework_next_steps": "string"
-- }

-- Add private coach-only engagement rating (1-5 scale)
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS sailor_engagement_rating INTEGER CHECK (sailor_engagement_rating >= 1 AND sailor_engagement_rating <= 5);

-- Add flag for whether summary was sent to sailor
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS summary_sent_to_sailor BOOLEAN DEFAULT FALSE;

-- Add actual duration for session completion (may differ from scheduled)
ALTER TABLE coaching_sessions
ADD COLUMN IF NOT EXISTS actual_duration_minutes INTEGER;

-- ============================================================================
-- Booking Request Expiration Fields
-- ============================================================================

-- Add expiration tracking to session_bookings table
ALTER TABLE session_bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add field to track if expiration notification was sent
ALTER TABLE session_bookings
ADD COLUMN IF NOT EXISTS expiration_warning_sent BOOLEAN DEFAULT FALSE;

-- Add expired status to the status check if not already there
-- First check existing constraint
DO $$
BEGIN
  -- Drop the existing constraint if it exists
  ALTER TABLE session_bookings DROP CONSTRAINT IF EXISTS session_bookings_status_check;

  -- Add updated constraint including 'expired' status
  ALTER TABLE session_bookings
  ADD CONSTRAINT session_bookings_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired'));
EXCEPTION
  WHEN others THEN
    -- If no constraint exists, try adding it anyway
    BEGIN
      ALTER TABLE session_bookings
      ADD CONSTRAINT session_bookings_status_check
      CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'expired'));
    EXCEPTION
      WHEN others THEN NULL;
    END;
END $$;

-- Set default expiration for new booking requests (48 hours from creation)
CREATE OR REPLACE FUNCTION set_booking_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set expiration for new pending requests
  IF NEW.expires_at IS NULL AND NEW.status = 'pending' THEN
    NEW.expires_at := NEW.created_at + INTERVAL '48 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_booking_expiration ON session_bookings;
CREATE TRIGGER tr_set_booking_expiration
  BEFORE INSERT ON session_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_expiration();

-- Update existing pending requests to have expiration (48 hours from now for existing ones)
UPDATE session_bookings
SET expires_at = COALESCE(created_at + INTERVAL '48 hours', NOW() + INTERVAL '48 hours')
WHERE status = 'pending' AND expires_at IS NULL;

-- ============================================================================
-- Expire Booking Requests Function (called by cron or edge function)
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_pending_booking_requests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Update all pending requests that have passed their expiration time
  WITH expired AS (
    UPDATE session_bookings
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE
      status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Send Expiration Warning Function (called by cron, marks 24hr warning)
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_expiration_warnings()
RETURNS INTEGER AS $$
DECLARE
  warning_count INTEGER;
BEGIN
  -- Mark requests that expire within 24 hours and haven't been warned
  WITH warned AS (
    UPDATE session_bookings
    SET
      expiration_warning_sent = TRUE,
      updated_at = NOW()
    WHERE
      status = 'pending'
      AND expiration_warning_sent = FALSE
      AND expires_at IS NOT NULL
      AND expires_at < NOW() + INTERVAL '24 hours'
      AND expires_at > NOW()
    RETURNING id, coach_id, sailor_id
  )
  SELECT COUNT(*) INTO warning_count FROM warned;

  RETURN warning_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_session_bookings_expires_at
ON session_bookings(expires_at)
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_session_bookings_expiration_warning
ON session_bookings(expiration_warning_sent, expires_at)
WHERE status = 'pending' AND expiration_warning_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_completion
ON coaching_sessions(coach_id, status, scheduled_at)
WHERE status IN ('confirmed', 'scheduled', 'in_progress');

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON COLUMN coaching_sessions.session_notes_structured IS
'Structured session notes with fields: what_was_covered, what_went_well, areas_to_work_on, homework_next_steps';

COMMENT ON COLUMN coaching_sessions.sailor_engagement_rating IS
'Private coach-only rating of sailor engagement (1-5 scale)';

COMMENT ON COLUMN coaching_sessions.actual_duration_minutes IS
'Actual session duration as confirmed by coach at completion';

COMMENT ON COLUMN session_bookings.expires_at IS
'When this booking request will auto-expire if not responded to (default: 48 hours from creation)';

COMMENT ON COLUMN session_bookings.expiration_warning_sent IS
'Whether a 24-hour expiration warning has been sent to the coach';

COMMENT ON FUNCTION expire_pending_booking_requests() IS
'Call periodically to auto-expire pending booking requests past their expiration time';

COMMENT ON FUNCTION mark_expiration_warnings() IS
'Call periodically to mark requests needing 24-hour warning notifications';

-- ============================================================================
-- pg_cron Setup (if pg_cron extension is available)
-- ============================================================================

-- Note: pg_cron must be enabled in your Supabase project.
-- These cron jobs call the database functions directly.
-- For the edge function approach, use an external cron service (e.g., cron-job.org)
-- to call the /functions/v1/expire-booking-requests endpoint.

DO $$
BEGIN
  -- Check if pg_cron is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Run expiration check every 15 minutes
    PERFORM cron.schedule(
      'expire-booking-requests',
      '*/15 * * * *',
      'SELECT expire_pending_booking_requests()'
    );

    -- Run warning check every hour
    PERFORM cron.schedule(
      'mark-expiration-warnings',
      '0 * * * *',
      'SELECT mark_expiration_warnings()'
    );

    RAISE NOTICE 'pg_cron jobs scheduled successfully';
  ELSE
    RAISE NOTICE 'pg_cron not available - use external cron service to call edge function';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not schedule cron jobs: %', SQLERRM;
END $$;
