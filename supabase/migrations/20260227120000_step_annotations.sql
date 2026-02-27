-- ============================================================================
-- Step Annotations: per-step notes + self-assessment for lesson interactives
-- ============================================================================
-- Allows nursing students to:
--   1. Add personal clinical notes to any lesson step
--   2. Self-rate confidence per step (maps to competency framework)
--   3. Track which steps they've practiced in clinical
--
-- Connects to: betterat_lessons, betterat_competencies, betterat_competency_progress
-- ============================================================================

CREATE TABLE IF NOT EXISTS betterat_step_annotations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id     uuid NOT NULL REFERENCES betterat_lessons(id) ON DELETE CASCADE,
  step_number   int  NOT NULL,
  -- Personal clinical note (free-text, persists across sessions)
  note          text,
  -- Self-assessed confidence: maps to competency_attempts.self_rating
  confidence    text CHECK (confidence IN ('needs_practice', 'developing', 'proficient', 'confident')),
  -- How many times practiced in clinical (manually incremented or auto from events)
  practice_count int NOT NULL DEFAULT 0,
  -- Timestamps
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, lesson_id, step_number)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_step_annotations_user_lesson
  ON betterat_step_annotations (user_id, lesson_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_step_annotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_step_annotations_updated_at ON betterat_step_annotations;
CREATE TRIGGER trg_step_annotations_updated_at
  BEFORE UPDATE ON betterat_step_annotations
  FOR EACH ROW EXECUTE FUNCTION update_step_annotations_updated_at();

-- RLS: students can only access their own annotations
ALTER TABLE betterat_step_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own step annotations"
  ON betterat_step_annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own step annotations"
  ON betterat_step_annotations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own step annotations"
  ON betterat_step_annotations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own step annotations"
  ON betterat_step_annotations FOR DELETE
  USING (auth.uid() = user_id);
