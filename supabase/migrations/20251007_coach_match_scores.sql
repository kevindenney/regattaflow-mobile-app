-- AI-powered coach matching scores table
-- Stores compatibility scores and analysis from CoachMatchingAgent

-- Create coach_match_scores table
CREATE TABLE coach_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  compatibility_score DECIMAL(3, 2) NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
  skill_gap_analysis JSONB,
  match_reasoning TEXT,
  performance_data_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, coach_id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_coach_match_scores_user ON coach_match_scores(user_id);
CREATE INDEX idx_coach_match_scores_coach ON coach_match_scores(coach_id);
CREATE INDEX idx_coach_match_scores_score ON coach_match_scores(compatibility_score DESC);
CREATE INDEX idx_coach_match_scores_created ON coach_match_scores(created_at DESC);

-- Enable Row Level Security
ALTER TABLE coach_match_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own match scores
CREATE POLICY "Users can view their own coach match scores"
  ON coach_match_scores
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Coaches can view match scores where they are the coach
CREATE POLICY "Coaches can view their match scores"
  ON coach_match_scores
  FOR SELECT
  USING (auth.uid() = coach_id);

-- RLS Policy: System can insert match scores (for AI agent)
CREATE POLICY "System can insert coach match scores"
  ON coach_match_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own match scores
CREATE POLICY "Users can update their own coach match scores"
  ON coach_match_scores
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own match scores
CREATE POLICY "Users can delete their own coach match scores"
  ON coach_match_scores
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coach_match_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coach_match_scores_updated_at
  BEFORE UPDATE ON coach_match_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_match_scores_updated_at();

-- Add comment for documentation
COMMENT ON TABLE coach_match_scores IS 'AI-generated compatibility scores between sailors and coaches using CoachMatchingAgent';
COMMENT ON COLUMN coach_match_scores.compatibility_score IS 'Normalized compatibility score (0.0 to 1.0) calculated by AI agent';
COMMENT ON COLUMN coach_match_scores.skill_gap_analysis IS 'JSON analysis of skill gaps identified by AI';
COMMENT ON COLUMN coach_match_scores.match_reasoning IS 'Natural language explanation of match quality';
COMMENT ON COLUMN coach_match_scores.performance_data_used IS 'JSON snapshot of performance data used in scoring';
