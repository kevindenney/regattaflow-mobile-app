-- Nutrition tracking: dedicated table + conversation context type
-- Nutrition is daily/ambient (not step-bound), so it gets its own table

-- 1. Create nutrition_entries table
CREATE TABLE IF NOT EXISTS nutrition_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  meal_type TEXT CHECK (meal_type IN (
    'breakfast', 'lunch', 'dinner', 'snack',
    'pre_workout', 'post_workout', 'other'
  )),
  description TEXT NOT NULL,
  calories INTEGER,
  protein_g REAL,
  carbs_g REAL,
  fat_g REAL,
  fiber_g REAL,
  water_oz REAL,
  confidence TEXT DEFAULT 'estimated' CHECK (confidence IN ('exact', 'estimated', 'rough')),
  source TEXT DEFAULT 'conversation' CHECK (source IN ('conversation', 'quick_log', 'photo', 'manual')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own nutrition entries"
  ON nutrition_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition entries"
  ON nutrition_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition entries"
  ON nutrition_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own nutrition entries"
  ON nutrition_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Index for daily dashboard queries (most common: "show me today's meals")
CREATE INDEX idx_nutrition_entries_user_day
  ON nutrition_entries(user_id, interest_id, logged_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_nutrition_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_nutrition_entries_updated_at
  BEFORE UPDATE ON nutrition_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_nutrition_entries_updated_at();

-- 2. Extend ai_conversations context_type to include 'nutrition'
ALTER TABLE ai_conversations
  DROP CONSTRAINT IF EXISTS ai_conversations_context_type_check;

ALTER TABLE ai_conversations
  ADD CONSTRAINT ai_conversations_context_type_check
  CHECK (context_type IN ('capture', 'train', 'review', 'manifesto', 'nutrition'));
