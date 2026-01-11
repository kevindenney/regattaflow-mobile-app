-- Add phase_ratings column to race_timer_sessions for structured debrief
-- Stores self-assessment ratings (1-5) and optional notes for each race phase

ALTER TABLE race_timer_sessions
ADD COLUMN IF NOT EXISTS phase_ratings JSONB DEFAULT '{}';

COMMENT ON COLUMN race_timer_sessions.phase_ratings IS
'Structured debrief: {prestart, start, upwind, windwardMark, downwind, leewardMark} each with rating (1-5) and optional note';

-- Create index for efficient querying of phase ratings
CREATE INDEX IF NOT EXISTS idx_race_timer_sessions_phase_ratings
ON race_timer_sessions USING GIN (phase_ratings)
WHERE phase_ratings IS NOT NULL AND phase_ratings != '{}';
