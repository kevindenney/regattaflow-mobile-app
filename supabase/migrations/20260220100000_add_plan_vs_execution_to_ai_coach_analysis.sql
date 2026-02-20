-- Add plan_vs_execution column to ai_coach_analysis table
-- Stores AI comparison of sailor's pre-race plan vs actual execution

ALTER TABLE ai_coach_analysis
ADD COLUMN IF NOT EXISTS plan_vs_execution TEXT;

COMMENT ON COLUMN ai_coach_analysis.plan_vs_execution IS
  'AI-generated comparison of the sailor''s pre-race plan/strategy vs their actual race execution';
