-- =============================================================================
-- Crew Threads: Persistent crew chat threads for ongoing crew relationships
-- =============================================================================

-- crew_threads: A named group of crew members for persistent conversations
CREATE TABLE IF NOT EXISTS crew_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_emoji TEXT DEFAULT '⛵',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- crew_thread_members: Who's in the thread
CREATE TABLE IF NOT EXISTS crew_thread_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES crew_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, user_id)
);

-- crew_thread_messages: The chat messages
CREATE TABLE IF NOT EXISTS crew_thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES crew_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'image')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_crew_threads_owner ON crew_threads(owner_id);
CREATE INDEX IF NOT EXISTS idx_crew_thread_members_thread ON crew_thread_members(thread_id);
CREATE INDEX IF NOT EXISTS idx_crew_thread_members_user ON crew_thread_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_thread_messages_thread ON crew_thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_crew_thread_messages_created ON crew_thread_messages(thread_id, created_at DESC);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE crew_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_thread_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_thread_messages ENABLE ROW LEVEL SECURITY;

-- Crew Threads: Users can see threads they're a member of
CREATE POLICY "Users can view threads they're a member of"
  ON crew_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_thread_members
      WHERE crew_thread_members.thread_id = crew_threads.id
      AND crew_thread_members.user_id = auth.uid()
    )
  );

-- Crew Threads: Users can create threads
CREATE POLICY "Users can create threads"
  ON crew_threads FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Crew Threads: Owners can update their threads
CREATE POLICY "Owners can update their threads"
  ON crew_threads FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Crew Threads: Owners can delete their threads
CREATE POLICY "Owners can delete their threads"
  ON crew_threads FOR DELETE
  USING (auth.uid() = owner_id);

-- Members: Users can see members of threads they belong to
CREATE POLICY "Users can view members of their threads"
  ON crew_thread_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_thread_members AS my_membership
      WHERE my_membership.thread_id = crew_thread_members.thread_id
      AND my_membership.user_id = auth.uid()
    )
  );

-- Members: Thread owners/admins can add members
CREATE POLICY "Owners and admins can add members"
  ON crew_thread_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM crew_thread_members AS admin_check
      WHERE admin_check.thread_id = crew_thread_members.thread_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role IN ('owner', 'admin')
    )
    OR
    -- Allow owner to add first member (themselves) when creating thread
    EXISTS (
      SELECT 1 FROM crew_threads
      WHERE crew_threads.id = crew_thread_members.thread_id
      AND crew_threads.owner_id = auth.uid()
    )
  );

-- Members: Users can update their own membership (e.g., last_read_at)
CREATE POLICY "Users can update their own membership"
  ON crew_thread_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Members: Users can leave threads, owners/admins can remove members
CREATE POLICY "Users can leave or admins can remove members"
  ON crew_thread_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM crew_thread_members AS admin_check
      WHERE admin_check.thread_id = crew_thread_members.thread_id
      AND admin_check.user_id = auth.uid()
      AND admin_check.role IN ('owner', 'admin')
    )
  );

-- Messages: Users can see messages in threads they belong to
CREATE POLICY "Users can view messages in their threads"
  ON crew_thread_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM crew_thread_members
      WHERE crew_thread_members.thread_id = crew_thread_messages.thread_id
      AND crew_thread_members.user_id = auth.uid()
    )
  );

-- Messages: Thread members can send messages
CREATE POLICY "Members can send messages"
  ON crew_thread_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND
    EXISTS (
      SELECT 1 FROM crew_thread_members
      WHERE crew_thread_members.thread_id = crew_thread_messages.thread_id
      AND crew_thread_members.user_id = auth.uid()
    )
  );

-- Messages: Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
  ON crew_thread_messages FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Enable Realtime
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE crew_thread_messages;

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_crew_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE crew_threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_crew_thread_on_message
AFTER INSERT ON crew_thread_messages
FOR EACH ROW
EXECUTE FUNCTION update_crew_thread_updated_at();

-- =============================================================================
-- Helper Views
-- =============================================================================

-- View for threads with latest message and unread count
CREATE OR REPLACE VIEW crew_threads_with_details AS
SELECT
  ct.id,
  ct.name,
  ct.owner_id,
  ct.avatar_emoji,
  ct.created_at,
  ct.updated_at,
  ctm.user_id AS member_user_id,
  ctm.role,
  ctm.last_read_at,
  (
    SELECT COUNT(*)::int
    FROM crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    AND msg.created_at > COALESCE(ctm.last_read_at, ct.created_at)
    AND msg.user_id != ctm.user_id
  ) AS unread_count,
  (
    SELECT message
    FROM crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) AS last_message,
  (
    SELECT created_at
    FROM crew_thread_messages msg
    WHERE msg.thread_id = ct.id
    ORDER BY msg.created_at DESC
    LIMIT 1
  ) AS last_message_at
FROM crew_threads ct
JOIN crew_thread_members ctm ON ctm.thread_id = ct.id;

-- Grant access to the view
GRANT SELECT ON crew_threads_with_details TO authenticated;
