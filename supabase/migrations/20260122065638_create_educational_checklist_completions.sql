-- Create educational_checklist_completions table
-- Stores user completion status for educational checklist items per race

CREATE TABLE IF NOT EXISTS educational_checklist_completions (
  race_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Composite primary key ensures one completion record per user/race/section/item
  PRIMARY KEY (race_id, user_id, section_id, item_id)
);

-- Index for efficient lookups by user and race
CREATE INDEX idx_educational_checklist_completions_user_race
  ON educational_checklist_completions(user_id, race_id);

-- Enable RLS
ALTER TABLE educational_checklist_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view own completions"
  ON educational_checklist_completions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own completions
CREATE POLICY "Users can insert own completions"
  ON educational_checklist_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own completions
CREATE POLICY "Users can update own completions"
  ON educational_checklist_completions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own completions
CREATE POLICY "Users can delete own completions"
  ON educational_checklist_completions
  FOR DELETE
  USING (auth.uid() = user_id);
