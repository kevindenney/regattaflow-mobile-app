-- ============================================================================
-- Coaching Messaging System
-- Conversations and messages between coaches and sailors
-- ============================================================================

-- Conversations table
CREATE TABLE IF NOT EXISTS coaching_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sailor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  coach_unread_count INTEGER NOT NULL DEFAULT 0,
  sailor_unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure one conversation per coach-sailor pair
  CONSTRAINT unique_coach_sailor_conversation UNIQUE (coach_id, sailor_id),
  -- Prevent self-conversations
  CONSTRAINT no_self_conversation CHECK (coach_id <> sailor_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS coaching_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES coaching_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text'
    CHECK (message_type IN ('text', 'session_note', 'debrief_share', 'schedule_request', 'system')),
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_coaching_conversations_coach ON coaching_conversations(coach_id);
CREATE INDEX idx_coaching_conversations_sailor ON coaching_conversations(sailor_id);
CREATE INDEX idx_coaching_conversations_last_message ON coaching_conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_coaching_messages_conversation ON coaching_messages(conversation_id, created_at DESC);
CREATE INDEX idx_coaching_messages_sender ON coaching_messages(sender_id);
CREATE INDEX idx_coaching_messages_unread ON coaching_messages(conversation_id, read_at) WHERE read_at IS NULL;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE coaching_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can see conversations where they are coach or sailor
CREATE POLICY "Users can view own conversations"
  ON coaching_conversations FOR SELECT
  USING (auth.uid() = coach_id OR auth.uid() = sailor_id);

CREATE POLICY "Users can insert conversations they are part of"
  ON coaching_conversations FOR INSERT
  WITH CHECK (auth.uid() = coach_id OR auth.uid() = sailor_id);

CREATE POLICY "Users can update own conversations"
  ON coaching_conversations FOR UPDATE
  USING (auth.uid() = coach_id OR auth.uid() = sailor_id);

-- Messages: users can see messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON coaching_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coaching_conversations c
      WHERE c.id = coaching_messages.conversation_id
        AND (c.coach_id = auth.uid() OR c.sailor_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in own conversations"
  ON coaching_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM coaching_conversations c
      WHERE c.id = coaching_messages.conversation_id
        AND (c.coach_id = auth.uid() OR c.sailor_id = auth.uid())
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON coaching_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coaching_conversations c
      WHERE c.id = coaching_messages.conversation_id
        AND (c.coach_id = auth.uid() OR c.sailor_id = auth.uid())
    )
  );

-- ============================================================================
-- Enable Realtime
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE coaching_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE coaching_messages;
