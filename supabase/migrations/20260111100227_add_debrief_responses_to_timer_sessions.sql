-- Add debrief_responses and debrief_complete columns to race_timer_sessions
-- These support the guided post-race interview feature

-- Add JSONB column for storing all debrief interview responses
ALTER TABLE race_timer_sessions
ADD COLUMN IF NOT EXISTS debrief_responses JSONB DEFAULT '{}';

-- Add boolean column to track if debrief is complete
ALTER TABLE race_timer_sessions
ADD COLUMN IF NOT EXISTS debrief_complete BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN race_timer_sessions.debrief_responses IS
'Guided debrief interview responses stored as JSONB. Structure: { questionId: value, ... }';

COMMENT ON COLUMN race_timer_sessions.debrief_complete IS
'Whether the guided debrief interview has been completed (user clicked Finish)';

-- Create an index for querying completed debriefs
CREATE INDEX IF NOT EXISTS idx_race_timer_sessions_debrief_complete
ON race_timer_sessions (sailor_id, debrief_complete)
WHERE debrief_complete = TRUE;
