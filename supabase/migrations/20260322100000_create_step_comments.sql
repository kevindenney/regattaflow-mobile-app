-- Step comments: discussion thread for step collaborators and owner
CREATE TABLE step_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES timeline_steps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES step_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_step_comments_step ON step_comments(step_id, created_at);

ALTER TABLE step_comments ENABLE ROW LEVEL SECURITY;

-- Owner + collaborators can view comments
CREATE POLICY "Step participants can view comments" ON step_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM timeline_steps ts WHERE ts.id = step_id
      AND (ts.user_id = auth.uid() OR auth.uid()::text = ANY(ts.collaborator_user_ids))
    )
  );

-- Owner + collaborators can insert their own comments
CREATE POLICY "Step participants can add comments" ON step_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM timeline_steps ts WHERE ts.id = step_id
      AND (ts.user_id = auth.uid() OR auth.uid()::text = ANY(ts.collaborator_user_ids))
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON step_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON step_comments
  FOR DELETE USING (auth.uid() = user_id);
