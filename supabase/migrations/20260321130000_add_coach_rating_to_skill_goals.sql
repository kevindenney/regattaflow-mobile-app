-- Add coach/instructor rating columns to user_skill_goals
-- Supports dual self-assessment + coach validation model.
-- current_rating remains the self-rating (no rename needed).

ALTER TABLE user_skill_goals
  ADD COLUMN coach_rating SMALLINT CHECK (coach_rating IS NULL OR (coach_rating BETWEEN 0 AND 5)),
  ADD COLUMN coach_id UUID REFERENCES auth.users(id),
  ADD COLUMN coach_rated_at TIMESTAMPTZ;
