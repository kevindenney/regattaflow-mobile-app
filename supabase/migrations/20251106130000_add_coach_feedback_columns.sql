-- Add coach feedback columns to sailor_race_preparation table

ALTER TABLE sailor_race_preparation
ADD COLUMN IF NOT EXISTS coach_feedback text,
ADD COLUMN IF NOT EXISTS coach_reviewed_at timestamptz;

COMMENT ON COLUMN sailor_race_preparation.coach_feedback IS 'Feedback from coach on the sailor''s pre-race strategy';
COMMENT ON COLUMN sailor_race_preparation.coach_reviewed_at IS 'Timestamp when coach reviewed the strategy';
