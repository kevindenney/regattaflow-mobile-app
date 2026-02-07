-- Repair: add RLS policies that failed in the previous migration
-- due to incorrect column name (user_id vs sailor_id).

ALTER TABLE ai_coach_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own race analysis" ON ai_coach_analysis;
CREATE POLICY "Users can read own race analysis"
  ON ai_coach_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM race_timer_sessions rts
      WHERE rts.id = ai_coach_analysis.timer_session_id
        AND rts.sailor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert analysis" ON ai_coach_analysis;
CREATE POLICY "Service role can insert analysis"
  ON ai_coach_analysis FOR INSERT
  WITH CHECK (true);
