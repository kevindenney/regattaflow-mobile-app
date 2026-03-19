-- Add denormalized collaborator_user_ids column to timeline_steps
-- for efficient RLS checks. Synced from metadata.plan.collaborators[].user_id.

ALTER TABLE timeline_steps
  ADD COLUMN collaborator_user_ids text[] NOT NULL DEFAULT '{}';

-- GIN index for fast array containment checks in RLS
CREATE INDEX idx_timeline_steps_collaborator_user_ids
  ON timeline_steps USING GIN (collaborator_user_ids);

-- RLS: collaborators can view steps they're added to (regardless of visibility)
CREATE POLICY "Collaborators can view steps they are added to"
  ON timeline_steps
  FOR SELECT
  USING (auth.uid()::text = ANY (collaborator_user_ids));
