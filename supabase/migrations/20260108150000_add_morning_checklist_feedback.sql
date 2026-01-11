-- Add morning checklist feedback column to race_analysis table
-- Stores post-race feedback on morning checklist decisions for AI learning

ALTER TABLE race_analysis
ADD COLUMN IF NOT EXISTS morning_checklist_feedback JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN race_analysis.morning_checklist_feedback IS 'Post-race feedback on morning checklist items (forecast, rig, sails, tactics) for AI learning loop';

-- Add index for efficient querying of feedback data
CREATE INDEX IF NOT EXISTS idx_race_analysis_morning_checklist_feedback
ON race_analysis USING gin (morning_checklist_feedback);
