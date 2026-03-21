-- User-defined skill goals for self-directed learners
-- Parallel to org-scoped betterat_competencies, but user-owned
-- e.g., "Roll Tacking", "Spinnaker Trim", "Rig Tuning" from a Dragon racing guide

CREATE TABLE IF NOT EXISTS user_skill_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                          -- grouping (e.g., "Boat Handling", "Rig Tuning")
  source_type TEXT NOT NULL DEFAULT 'manual',  -- 'manual' | 'ai_generated' | 'from_resource' | 'from_brain_dump'
  source_resource_id UUID,               -- library resource that spawned this
  source_url TEXT,                        -- external URL source
  current_rating SMALLINT DEFAULT 0 CHECK (current_rating BETWEEN 0 AND 5),
  rating_count INTEGER DEFAULT 0,        -- how many times rated across steps
  last_rated_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, interest_id, title)
);

-- Index for fast lookups
CREATE INDEX idx_user_skill_goals_user_interest ON user_skill_goals(user_id, interest_id) WHERE status = 'active';

-- RLS
ALTER TABLE user_skill_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own skill goals"
  ON user_skill_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill goals"
  ON user_skill_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill goals"
  ON user_skill_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skill goals"
  ON user_skill_goals FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_skill_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_user_skill_goals_updated_at
  BEFORE UPDATE ON user_skill_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_user_skill_goals_updated_at();
