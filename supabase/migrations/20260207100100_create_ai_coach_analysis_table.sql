-- Create the ai_coach_analysis table for storing race analysis results
-- from the race-analysis edge function.

CREATE TABLE IF NOT EXISTS ai_coach_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timer_session_id UUID NOT NULL REFERENCES race_timer_sessions(id) ON DELETE CASCADE,
  overall_summary TEXT,
  start_analysis JSONB,
  upwind_analysis JSONB,
  downwind_analysis JSONB,
  tactical_decisions JSONB,
  boat_handling JSONB,
  recommendations JSONB,
  confidence_score DECIMAL,
  model_used TEXT,
  analysis_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_ai_coach_analysis_timer_session_id
  ON ai_coach_analysis(timer_session_id);

-- RLS: authenticated users can read analysis for their own timer sessions.
-- Edge function inserts via service role, so no INSERT policy needed for regular users.
ALTER TABLE ai_coach_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own race analysis"
  ON ai_coach_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM race_timer_sessions rts
      WHERE rts.id = ai_coach_analysis.timer_session_id
        AND rts.sailor_id = auth.uid()
    )
  );

-- Allow service role to insert (edge functions use service role key)
CREATE POLICY "Service role can insert analysis"
  ON ai_coach_analysis FOR INSERT
  WITH CHECK (true);
