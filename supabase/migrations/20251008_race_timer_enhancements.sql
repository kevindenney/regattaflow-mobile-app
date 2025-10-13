-- ============================================================================
-- RACE TIMER SESSION ENHANCEMENTS FOR PHASE 3
-- ============================================================================
-- Add user race description and coach notification tracking

ALTER TABLE race_timer_sessions
  ADD COLUMN IF NOT EXISTS user_race_description TEXT,
  ADD COLUMN IF NOT EXISTS analysis_sent_to_coach BOOLEAN DEFAULT false;

-- Index for finding sessions that need coach notification
CREATE INDEX IF NOT EXISTS idx_race_timer_sessions_coach_notification
  ON race_timer_sessions(analysis_sent_to_coach)
  WHERE analysis_sent_to_coach = false AND auto_analyzed = true;

COMMENT ON COLUMN race_timer_sessions.user_race_description IS 'User's freeform description of race performance (post-race interview)';
COMMENT ON COLUMN race_timer_sessions.analysis_sent_to_coach IS 'Flag indicating if AI analysis has been sent to assigned coach';
