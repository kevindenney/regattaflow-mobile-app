-- Race Messages: simple linear chat for race card discussions
-- Supports crew collaboration communication

CREATE TABLE race_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regatta_id UUID NOT NULL REFERENCES regattas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'checklist')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE race_messages ENABLE ROW LEVEL SECURITY;

-- Race owner can read and write all messages for their races
CREATE POLICY "race_owner_manage_messages" ON race_messages
FOR ALL USING (
  regatta_id IN (SELECT id FROM regattas WHERE created_by = auth.uid())
);

-- Accepted collaborators can read messages
CREATE POLICY "collaborators_read_messages" ON race_messages
FOR SELECT USING (
  regatta_id IN (
    SELECT regatta_id FROM race_collaborators
    WHERE user_id = auth.uid() AND status = 'accepted'
  )
);

-- Accepted collaborators can post messages
CREATE POLICY "collaborators_post_messages" ON race_messages
FOR INSERT WITH CHECK (
  user_id = auth.uid()
  AND (
    -- User is the race owner
    regatta_id IN (SELECT id FROM regattas WHERE created_by = auth.uid())
    OR
    -- User is an accepted collaborator
    regatta_id IN (
      SELECT regatta_id FROM race_collaborators
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  )
);

-- Users can delete their own messages
CREATE POLICY "users_delete_own_messages" ON race_messages
FOR DELETE USING (user_id = auth.uid());

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE race_messages;

-- Index for efficient message retrieval
CREATE INDEX idx_race_messages_regatta_created ON race_messages(regatta_id, created_at DESC);
CREATE INDEX idx_race_messages_user_id ON race_messages(user_id);
