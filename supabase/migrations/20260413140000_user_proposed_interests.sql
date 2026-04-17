-- Allow users to propose new interests. The proposer can use it immediately;
-- other users discover it through the proposer's public blueprints.
-- Admins can later promote user_proposed interests to official.

ALTER TABLE interests
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_interests_created_by
  ON interests(created_by_user_id) WHERE created_by_user_id IS NOT NULL;
