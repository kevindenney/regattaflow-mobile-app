-- Structured measurements support: manifesto extensions + insight type expansion
-- Measurements themselves live in timeline_steps.metadata JSONB (no new table needed)

-- 1. Extend ai_interest_insights CHECK constraint with new insight types
-- Drop and recreate since ALTER CHECK doesn't exist in Postgres
ALTER TABLE ai_interest_insights
  DROP CONSTRAINT IF EXISTS ai_interest_insights_insight_type_check;

ALTER TABLE ai_interest_insights
  ADD CONSTRAINT ai_interest_insights_insight_type_check
  CHECK (insight_type IN (
    'strength', 'weakness', 'pattern', 'recommendation', 'preference', 'deviation_pattern',
    'personal_record', 'plateau', 'progressive_overload', 'recovery_pattern'
  ));

-- 2. Add structured fitness fields to manifesto
ALTER TABLE user_interest_manifesto
  ADD COLUMN IF NOT EXISTS training_maxes JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS structured_goals JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS workout_split JSONB DEFAULT '{}';
