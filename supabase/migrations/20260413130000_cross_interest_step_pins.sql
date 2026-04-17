-- Cross-interest step pins: shows a step on another interest's timeline as private-only reference
-- The owner sees the pinned step on the target interest timeline, but it never
-- appears in blueprints, subscriber feeds, or notifications for that interest.

CREATE TABLE IF NOT EXISTS timeline_step_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES timeline_steps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(step_id, user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_step_pins_user_interest
  ON timeline_step_pins(user_id, interest_id);

ALTER TABLE timeline_step_pins ENABLE ROW LEVEL SECURITY;

-- Only the step owner can manage their own pins
DO $$ BEGIN
  CREATE POLICY "Users manage own step pins" ON timeline_step_pins
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
